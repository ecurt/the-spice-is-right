// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************


// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to login page.
        return res.redirect('/login');
    }
    next();
};

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - API routes here
app.use((req,res,next) => {
    res.locals.username = req.session.user ? req.session.user.username : null;
    next();
});
// Render home page when website is loaded
app.get('/', (req, res) => {
    res.render('pages/recipe_results', {
        title: 'Home'
    });
});

// Create Recipe
app.post('/addRecipe', auth, function (req, res) {
    db.task(async t => {
        const recipeQuery =
            'INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;';

        // const reviewPromise =
        const recipe = await t.one(recipeQuery, [
            req.body.name,
            req.body.description,
            req.body.difficulty,
            req.body.time,
            req.body.ingredients,
            req.body.instructions
        ]);

        await t.none(
            'INSERT INTO recipe_owners (user_id, recipe_id) VALUES ($1, $2);',
            [req.session.user.user_id, recipe.recipe_id]
        );

        return recipe;
    })
        .then(recipe => {
            res.render('pages/recipe_results', {title: 'Succesfully created recipe',});
            // res.status(201).json({ success: true, recipe });
        })
        .catch(error => {
            console.error('Error creating recipe:', error);
            res.status(500).json({success: false, message: 'Failed to create recipe', error});
        });
});

app.get('/addRecipe', auth, (req, res) => {
    res.render('pages/add_recipe');
});


// Search recipes
app.get('/search', function (req, res) {
    const query = 'SELECT name, description, difficulty, time FROM recipes WHERE name LIKE $1';
    db.any(query, [`%${req.query.search}%`])
        .then(data => {
            const title = `Search results for \'${req.query.search}\':`;
            // console.log(data); // For debugging
            res.render('pages/recipe_results', {
                title: title,
                data: data
            });
        })
        .catch(error => {
            console.error('Error searching database: ', error);
            res.status(500).json({success: false, message: 'Error searching database', error});
        });

});

app.get('/login', (req, res) => {
    res.render('pages/login', {title: 'Login'});
});

app.post('/login', async (req, res) => {

    db.one('SELECT * FROM users WHERE username = $1 ;', [req.body.username])
        .then(async user => {
            const match = await bcrypt.compare(req.body.password, user.password);
            if (match) {
                // Login
                req.session.user = user;
                req.session.save();
                res.redirect('/');
            } else {
                // Error
                res.render('pages/login', {message: 'Incorrect password. Try again.',});
            }
        })
        .catch(err => {
            console.log(err);
            res.redirect('/register');
        });
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await db.none(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [req.body.username, hashedPassword]
        );
        res.redirect('/login'); // Redirects to login page after successful registration
    } catch (error) {
        if (error.code === '23505') {
            console.error('Username already exists');
            res.render('pages/register', {message: 'Username already exists. Please choose another.'});
        } else {
            console.error('Registration error:', error);
            res.render('pages/register', {message: 'Registration failed. Please try again.'});
        }
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});

app.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const user = await db.one('SELECT username FROM users WHERE user_id = $1', [userId]);
    const userRecipes = await db.any(
      'SELECT recipe_id, name, description FROM recipes WHERE recipe_id IN (SELECT recipe_id FROM recipe_owners WHERE user_id = $1)',
      [userId]
    );

    res.render('pages/profile', {
      title: 'User Profile',
      user: user,
      recipes: userRecipes,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('An error occurred while loading the profile page');
  }
});


// Get cookbooks
app.get('/myCookbooks', auth, async (req, res) => {
    try {
      const userId = req.session.user.user_id;
      const data = await db.any(
        'SELECT c.name FROM cookbook_owners co INNER JOIN cookbooks c ON co.cookbook_id = c.cookbook_id WHERE co.user_id = $1;',
        [userId]
      );
  
      res.render('pages/my_cookbooks', {
        data: data
      });
    } catch (error) {
      console.error('Error finding cookbooks: ', error);
      res.status(500).send('An error occurred while loading the cookbooks');
    }
});


// Load a cookbook
app.get('/cookbook', auth, async (req, res) => {
    try {

      // Make sure user owns the cookbook first:
      const userId = req.session.user.user_id;
      const owner = await db.one(
        'SELECT user_id FROM cookbook_owners WHERE cookbook_id = $1;',
        [req.query.cookbookId]
      );
      if (userId != owner) {
        return res.status(404).send('Cookbook not found.');
      }

      // Get cookbook name
      const cookbookName = db.one('SELECT name FROM cookbooks WHERE cookbook_id = $1;', [req.query.cookbookId]);

      // Get recipes in the cookbook and display it to the user
      const query = 'SELECT name, description, difficulty, time FROM \
      cookbooks c INNER JOIN saved_recipes sr ON cookbooks.cookbook_id = saved_recipes.cookbook_id \
      INNER JOIN recipes r ON sr.recipe_id = r.recipe_id \
      WHERE c.cookbook_id = $1;';
      const data = await db.any(query, [req.query.cookbookId]);
  
      res.render('pages/recipe_results', {
        title: cookbookName,
        data: data
      });

    } catch (error) {
      console.error('Error finding cookbooks: ', error);
      res.status(500).send('An error occurred while loading the cookbooks');
    }
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
/*How to query the database directly with sql:
docker compose up -d
docker exec -it projectsourcecode-db-1 /bin/bash
psql -U postgres -d users_db
*/


// Handlebars helper functions

// Formats time for recipes
Handlebars.registerHelper('formatTime', function(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`;
    }
});

Handlebars.registerHelper('isMod3', function(index) {
    return index % 3 === 0;
});
