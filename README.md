# the-spice-is-right

## Brief Application description
The Spice Is Right is a recipe browser which allows users to upload, save, like, and browse user created recipes.
## Contributors - In this case, it will be the team Members
Charlie Wheeler
Evan Curtis
Nolan Hofle
Yohan Choi
Isabella Van Vliet
Gwyn Keaty
## Technology Stack used for the project
We will be utilizing technology learned in class. HTML, CSS, JS, Handlebars CSS, etc.
## Link to the deployed application
https://github.com/ecurt/the-spice-is-right

# How to run application:

## Prerequisites to run the application:
Docker desktop is needed to run this application.

# Steps
- cd into ProjectSourceCode
- Create .env file (not provided here for security reasons)
- run `docker compose up` or `docker compose up -d` to run in detached mode (Can't see console).
- Open `localhost:3000` in a browser.
- If ran in detached mode (-d), run `docker compose down` to stop server.
- If ran in the foreground, stop the server with ctrl+c.
- To restart the database, run `docker compose down -v`.

## Remote link:
`https://the-spice-is-right-r85m.onrender.com`

## Notes on testing:
- To run the tests, change the line `command: 'npm start'` in `docker-compose.yaml` to `command: 'npm run testandrun'`. The second line is commented out to make this easy.
- Before running a test, make sure to run `docker compose down -v`. This ensures that when the tests create a user, that username isn't already taken (from a previous test or by coincidence)
