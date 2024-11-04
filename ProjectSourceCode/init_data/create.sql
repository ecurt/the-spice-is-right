-- Create tables here
DROP TABLE IF EXISTS recipes CASCADE;
CREATE TABLE IF NOT EXISTS recipes (
  recipe_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100),
  description VARCHAR(500) NOT NULL,
--   difficulty is 1 to 5
  difficulty INT NOT NULL, 
--   time is in minutes
  time int NOT NULL,
  ingredients VARCHAR(500) NOT NULL,
  instructions VARCHAR(1000) NOT NULL
);
