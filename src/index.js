const express = require('express'); 
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); 
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require('bcryptjs');
const axios = require('axios'); 
app.use(express.static('src/resources'));



app.use(express.static(__dirname + '/')); 
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: 'db',  
    port: 5432, 
    database: process.env.POSTGRES_DB, 
    user: process.env.POSTGRES_USER, 
    password: process.env.POSTGRES_PASSWORD, 
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

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    //Wasn;t sure if we needed cookies or not so I included it for now
    // cookie: {
    //     maxAge: 1000 * 60 * 60 * 24 // 24 hours
    // }
}));

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

// Define the login route
app.get('/login', (req, res) => {
    res.render('pages/login', { title: 'Login' });
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/home', (req, res) => {
    //pass the user to home screen only if it already exists
    if (!req.session.user) {
        res.render('pages/home', {
            user: null
        });
    } else {
        res.render('pages/home', {
            user: req.session.user
        });
    }
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  }
  module.exports = app;
console.log('Server is listening on port 3000');
