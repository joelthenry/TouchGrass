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
    helpers: {
        if_eq: function(a, b, opts) {
            if (a === b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        }
    }
});

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
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
    saveUninitialized: false
}));

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/home');
    }
    next();
};

app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/profile', requireLogin, (req, res) => {
    res.render('pages/profile');
});


app.get('/identify', (req, res) => {
    res.render('pages/identify');
});

app.get('/map', (req, res) => {
    res.render('pages/map');
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/home');
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.one('SELECT * FROM users WHERE username = $1', username)
        .then(user => {
            bcrypt.compare(password, user.password, (_err, result) => {
                if (result) {
                    req.session.user = user;
                    res.redirect('/home');
                } else {
                    res.redirect('/login');
                }
            });
        })
        .catch(error => {
            console.log('ERROR:', error.message || error);
            res.redirect('/login');
        });
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;

    bcrypt.hash(password, 10, (err, hash) => {
        db.none('INSERT INTO users(email, username, password) VALUES($1, $2, $3)', [email, username, hash])
            .then(() => {
                res.redirect('/login');
            })
            .catch(error => {
                console.log('ERROR:', error.message || error);
                res.redirect('/register');
            });
    });
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  }
  module.exports = app;
console.log('Server is listening on port 3000');
