-- Create tables here
DROP TABLE IF EXISTS recipes CASCADE;
CREATE TABLE IF NOT EXISTS recipes (
  recipe_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  -- difficulty is 1 to 5
  difficulty INT NOT NULL, 
  -- time is in minutes
  time INT NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL
);

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password CHAR(60) NOT NULL
);

DROP TABLE IF EXISTS recipe_owners CASCADE;
CREATE TABLE recipe_owners (
  user_id INTEGER NOT NULL REFERENCES users (user_id),
  recipe_id INTEGER NOT NULL REFERENCES recipes (recipe_id)
);

DROP TABLE IF EXISTS likes CASCADE;
CREATE TABLE likes (
  user_id INTEGER NOT NULL REFERENCES users (user_id),
  recipe_id INTEGER NOT NULL REFERENCES recipes (recipe_id)
);

DROP TABLE IF EXISTS cookbooks CASCADE;
CREATE TABLE IF NOT EXISTS cookbooks (
  cookbook_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS cookbook_owners CASCADE;
CREATE TABLE cookbook_owners (
  user_id INTEGER NOT NULL REFERENCES users (user_id),
  cookbook_id INTEGER NOT NULL REFERENCES cookbooks (cookbook_id)
);

DROP TABLE IF EXISTS saved_recipes CASCADE;
CREATE TABLE saved_recipes (
  recipe_id INTEGER NOT NULL REFERENCES recipes (recipe_id),
  cookbook_id INTEGER NOT NULL REFERENCES cookbooks (cookbook_id)
);