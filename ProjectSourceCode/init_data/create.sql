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


-- Create recipes and their owners


INSERT INTO users (username, password) VALUES ('test', '$2a$10$uhmM2r9/OHQBkRBs0/osGO6aCNV1UVwvzKb02X/EmTorBuOaoZSX2');
INSERT INTO users (username, password) VALUES ('e', '$2a$10$fP5z8hFbvSusAgH4UzjSfua9s80Dj1EcEiPHi5RVe6C3BRwE8oSqy');
-- test is user_id 1 and e is user_id 2


INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) 
VALUES ('Homemade Pizza', 'This homemade pizza recipe is perfect for parties! Everyone loves pizza, and your guests can customize their toppings to suit their personal tastes.', 
4, 180, '2 cups flour, 1 cup water, 1/2 tsp salt, 1 tbsp baking yeast, 1 tsp sugar, olive oil, 1 cup mozerella, some peperonni, 1/2 cup tomatoe sauce', 
'Mix flour and salt in a large bowl. Mix water, yeast, and sugar in a small bowl. Mix these together adding flour or water as needed. Knead dough. Let rise for 2 hours. Roll out dough on pan. Put tomatoe sause, cheese, and pepperoni to pizza. Cook at 425 degrees for 20 minutes.');

INSERT INTO recipe_owners (user_id, recipe_id) VALUES (1, 1);

INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) 
VALUES ('Pumkin pie', 'Pie is really good. You should eat pumkin pie.', 
5, 180, '1 pre-made pie crust (9-inch) or homemade crust, 2 cups (or 1 can, 15 oz) of pumpkin puree, 2 large egg, 1 can (14 oz) or substitute with heavy cream', 
'Put all the ingredients together and bake it.');

INSERT INTO recipe_owners (user_id, recipe_id) VALUES (1, 2);

INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) 
VALUES ('Sandwich', 'I like to eat sandwiches', 
1, 5, 'Gluten free whole wheat bread, meat, mustard', 
'Put stuff in the sandwhich');

INSERT INTO recipe_owners (user_id, recipe_id) VALUES (2, 3);

INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) 
VALUES ('Fish', 'Yum!', 
3, 40, 'Salmon', 
'Cut the fish and cook it.');

INSERT INTO recipe_owners (user_id, recipe_id) VALUES (2, 4);

INSERT INTO recipes (name, description, difficulty, time, ingredients, instructions) 
VALUES ('Boiled Egg', 'The best form of egg', 
2, 15, 'Egg, water', 
'Put the egg in the water and boil for 12 minutes.');

INSERT INTO recipe_owners (user_id, recipe_id) VALUES (1, 5);



-- Have e save some recipes under "pies"
INSERT INTO cookbooks (name) VALUES ('Pies'); -- cookbook_id = 1
INSERT INTO cookbook_owners (user_id, cookbook_id) VALUES (2, 1);
INSERT INTO saved_recipes (recipe_id, cookbook_id) VALUES (1, 1); -- Pizza
INSERT INTO saved_recipes (recipe_id, cookbook_id) VALUES (2, 1); -- Pumpkin pie


