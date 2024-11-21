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
  host: process.env.DATABASE_URL, // the database server
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
app.use((req, res, next) => {
  res.locals.username = req.session.user ? req.session.user.username : null;
  next();
});

// Render home page when website is loaded
app.get('/', (req, res) => {
  const query = 'SELECT recipe_id, name, description, difficulty, time, image FROM recipes';
  db.any(query, [`%${req.query.search}%`])
    .then(data => {
      res.render('pages/recipe_results', {
        data: data
      });
    })
    .catch(error => {
      console.error('Error searching database: ', error);
      res.status(500).json({ success: false, message: 'Error searching database', error });
    });
});

// Create Recipe
app.post('/addRecipe', auth, function (req, res) {
  db.task(async t => {

    // Debug
    // console.log(req.body.image)

    // Check if the image is too big (if it exists first)
    if (req.body.image) {
      if (req.body.image.length > 10000000) {
        throw new Error('Image is too large.');
      }
    }

    const recipeQuery =
      'INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;';

    // const reviewPromise =
    const recipe = await t.one(recipeQuery, [
      req.body.name,
      req.body.description,
      req.body.difficulty,
      req.body.time,
      req.body.ingredients,
      req.body.instructions,
      req.body.image
    ]);

    await t.none(
      'INSERT INTO recipe_owners (user_id, recipe_id) VALUES ($1, $2);',
      [req.session.user.user_id, recipe.recipe_id]
    );

    return recipe;
  })
    .then(recipe => {
      res.render('pages/recipe_results', { title: 'Succesfully created recipe', });
      // res.status(201).json({ success: true, recipe });
    })
    .catch(error => {
      console.error('Error creating recipe:', error);
      res.status(500).json({ success: false, message: 'Failed to create recipe', error });
    });
});


// Gets recipe
// Expects 'recipeId' query perameter
app.get('/viewRecipe', async (req, res) => {
  try {
    const recipe = await db.one(
        'SELECT * FROM recipes WHERE recipe_id = $1',
        [req.query.recipeId]
    );

    if (!recipe) {
        return res.status(404).send('Recipe not found.');
    }

    // console.log('Fetched recipe:', recipe);
    // make string an array to make it into lists to match template
    recipe.ingredients = recipe.ingredients ? recipe.ingredients.split(','): [];
    recipe.instructions = recipe.instructions ? recipe.instructions.split('/n') : [];
    
    // recipe.image = 'images/Fish_logo.jpg'; 
    // console.log('Parsed recipe with default image:', recipe);

    res.render('pages/view_recipe', {
      recipe: recipe
    });
  } catch (error) {
      console.error('Error fetching recipe:', error.message);
      res.status(500).send('An error occurred while loading the recipe.');
  }
});

app.get('/addRecipe', auth, (req, res) => {
  res.render('pages/add_recipe');
});


// Search recipes
// Expects 'search' query perameter
app.get('/search', function (req, res) {
  const query = 'SELECT * FROM recipes WHERE name LIKE $1';
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
      res.status(500).json({ success: false, message: 'Error searching database', error });
    });

});

app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  if (typeof req.body.username !== 'string' || req.body.username.trim() === '') {
    console.error('Invalid username input');
    return res.status(400).json({ message: 'Invalid input' });
  }

  db.one('SELECT * FROM users WHERE username = $1 ;', [req.body.username])
    .then(async user => {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (match) {
        // Login
        req.session.user = user;
        req.session.save();
        res.redirect('/');
      } else {
        res.render('pages/login', { message: 'Incorrect password. Try again.', });
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
  const { username, password } = req.body;

  if (typeof username !== 'string' || username.trim() === '') {
    console.error('Invalid username input');
    return res.status(400).json({ message: 'Invalid input' });
  }

//   console.log('Username:', username);
//   console.log('Password:', password);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed Password:', hashedPassword);
    await db.none(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    res.redirect('/login')
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      console.error('Username already exists');
      res.status(409).json({ message: 'Username already exists. Please choose another.' });
    } else {
      res.status(400).json({ message: 'Registration failed. Please try again.' });
    }
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout');
});


// Profile page
app.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const user = await db.one('SELECT username FROM users WHERE user_id = $1', [userId]);
    const userRecipes = await db.any(
      'SELECT recipe_id, name, description, difficulty, time FROM recipes WHERE recipe_id IN (SELECT recipe_id FROM recipe_owners WHERE user_id = $1)',
      [userId]
    );
    const cookbooks = await db.any('SELECT c.cookbook_id, c.name FROM cookbook_owners co INNER JOIN cookbooks c ON co.cookbook_id = c.cookbook_id WHERE co.user_id = $1;', [userId]);


    res.render('pages/profile', {
      title: 'User Profile',
      user: user,
      recipes: userRecipes,
      cookbooks: cookbooks,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('An error occurred while loading the profile page');
  }
});



// Load a cookbook
// Expects cookbookId
app.get('/cookbook', auth, async (req, res) => {
  try {

    // Make sure user owns the cookbook first:
    const userId = req.session.user.user_id;
    const owner = await db.one(
      'SELECT user_id FROM cookbook_owners WHERE cookbook_id = $1;',
      [req.query.cookbookId]
    );
    if (userId != owner.user_id) {
      return res.status(404).send('Cookbook not found.');
    }

    // Get cookbook name
    const cookbookName = await db.one('SELECT name FROM cookbooks WHERE cookbook_id = $1;', [req.query.cookbookId]);

    // Get recipes in the cookbook and display it to the user
    const query = `SELECT r.recipe_id, r.name, r.description, r.difficulty, r.time, r.image FROM 
      cookbooks c INNER JOIN saved_recipes sr ON c.cookbook_id = sr.cookbook_id 
      INNER JOIN recipes r ON sr.recipe_id = r.recipe_id 
      WHERE c.cookbook_id = $1;`;
    const data = await db.any(query, [parseInt(req.query.cookbookId)]);

    res.render('pages/recipe_results', {
      title: cookbookName.name,
      data: data
    });

  } catch (error) {
    console.error('Error finding cookbooks: ', error);
    res.status(500).send('An error occurred while loading the cookbooks');
  }
});


// For testing
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});


// Cookbook post
// Expects name perameter
app.post('/cookbook', auth, function (req, res) {
  db.task(async t => {
    const recipeQuery =
      'INSERT INTO cookbooks (name) VALUES ($1) RETURNING *;';

    const recipe = await t.one(recipeQuery, [req.body.name]);

    await t.none(
      'INSERT INTO cookbook_owners (user_id, cookbook_id) VALUES ($1, $2);',
      [req.session.user.user_id, recipe.cookbook_id]
    );

    return recipe;
  })
    .then(recipe => {
      res.redirect('/profile')
      // res.render('pages/profile', { title: 'Succesfully created cookbook', });
      // res.status(201).json({ success: true, recipe });
    })
    .catch(error => {
      console.error('Error creating recipe:', error);
      res.status(500).json({ success: false, message: 'Failed to create recipe', error });
    });
});


// Get save recipe page
// Expects recipeId
app.get('/saveRecipe', auth, async (req, res) => {
  try {

    // Get user
    const userId = req.session.user.user_id;

    // Get recipe_id and name
    const recipeId = req.query.recipeId;
    const recipeName = await db.one('SELECT name FROM recipes WHERE recipe_id = $1;', [recipeId]); // Null?

    // Get recipes in the cookbook and display it to the user
    const cookbooks = await db.any(
      `SELECT c.cookbook_id, c.name FROM 
        cookbook_owners co INNER JOIN cookbooks c ON co.cookbook_id = c.cookbook_id 
        WHERE co.user_id = $1;`,
      [userId]
    );

    res.render('pages/save_recipe', {
      recipeName: recipeName.name,
      recipeId: recipeId,
      cookbooks: cookbooks
    });

  } catch (error) {
    console.error('Error finding cookbooks: ', error);
    res.status(500).send('An error occurred while loading the cookbooks');
  }
});


// Post to save a recipe
// Expects recipeID and cookbookId
app.post('/saveRecipe', auth, async (req, res) => {
  try {

    // Make sure user owns the cookbook
    const userId = req.session.user.user_id;
    const owner = await db.one(
      'SELECT user_id FROM cookbook_owners WHERE cookbook_id = $1;',
      [req.body.cookbookId]
    );
    if (userId != owner.user_id) {
      return res.status(500).send('Cannot save to another\'s cookbook');
    }

    // Add to saved_recipes table
    await db.none('INSERT INTO saved_recipes (recipe_id, cookbook_id) VALUES ($1, $2)', [req.body.recipeID, req.body.cookbookId]);

    // Redirect
    res.redirect(`/cookbook?cookbookId=${req.body.cookbookId}`);

  } catch (error) {
    console.error('Error saving recipe: ', error);
    res.status(500).send('An error occurred while saving recipe');
  }
});


// Post to like a recipe
// Expects recipeID 
app.post('/likeRecipe', auth, async (req, res) => {
  try {

    const userId = req.session.user.user_id;

    // Add to saved_recipes table
    await db.none('INSERT INTO likes (user_id, recipe_id) VALUES ($1, $2)', [userId, req.body.recipeId]);

    // Redirect
    res.redirect('/likedRecipes');

  } catch (error) {
    console.error('Error saving recipe: ', error);
    res.status(500).send('An error occurred while saving recipe');
  }
});


// Get endpoint to see liked recipes
app.get('/likedRecipes', auth, async (req, res) => {
  try {

    const userId = req.session.user.user_id;

    // Get recipes in the cookbook and display it to the user
    const query = `SELECT r.recipe_id, r.name, r.description, r.difficulty, r.time, r.image FROM 
      recipes r INNER JOIN likes l ON r.recipe_id = l.recipe_id 
      WHERE l.user_id = $1;`;
    const data = await db.any(query, [userId]);

    res.render('pages/recipe_results', {
      title: 'Liked Recipes:',
      data: data
    });

  } catch (error) {
    console.error('Error finding liked recipes: ', error);
    res.status(500).send('An error occurred while loading liked recipes');
  }
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app
if(require.main === module){
  app.listen(3000)
  console.log("Listening to port 3000!")
}

/*How to query the database directly with sql:
docker compose up -d
docker exec -it projectsourcecode-db-1 /bin/bash
psql -U postgres -d users_db
*/


// Handlebars helper functions

// Formats time for recipes
Handlebars.registerHelper('formatTime', function (minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`;
  }
});

Handlebars.registerHelper('isMod3', function (index) {
  return index % 3 === 0;
});