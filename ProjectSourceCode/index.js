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

// Render home page when website is loaded
app.get('/', (req, res) => {
  res.render('pages/recipe_results',{
    title: 'Home',
    username: req.session.user ? req.session.user.username : null
  });
});

// Create Recipe
app.post('/addRecipe', auth, function (req, res) {
  db.task(t => {
    const recipeQuery =
      'INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;';

    // const reviewPromise = 
    return t.one(recipeQuery, [
      req.body.name,
      req.body.description,
      req.body.difficulty,
      req.body.time,
      req.body.ingredients,
      req.body.instructions
    ]);
  })
  .then(recipe => {
    res.render('pages/recipe_results', {title: 'Succesfully created recipe',});
    // res.status(201).json({ success: true, recipe });
  })
  .catch(error => {
    console.error('Error creating recipe:', error);
    res.status(500).json({ success: false, message: 'Failed to create recipe', error });
  });

  // Eventually add owner to recipe in the recipe_owner table

});
  
app.get('/addRecipe', auth, (req, res) => {
  res.render('pages/add_recipe');
});

app.get('/viewRecipe',(req, res) => {
  res.render('pages/view_recipe');
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
    res.status(500).json({ success: false, message: 'Error searching database', error });
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
    }
    else {
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
      res.render('pages/register', { message: 'Username already exists. Please choose another.' });
    } else {
      console.error('Registration error:', error);
      res.render('pages/register', { message: 'Registration failed. Please try again.' });
    }
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout');
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');