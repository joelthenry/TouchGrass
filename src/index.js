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
const http = require('http');
const socketIO = require('socket.io');

app.use(express.static('src/resources'));
const apiRoutes = require('./routes/api'); 

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance attached to the server
const io = socketIO(server);

// Add near the top of your file after imports
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

// Create a single database connection to be reused
const db = pgp(dbConfig);

// Test connection at startup
db.connect()
    .then(obj => {
        console.log('Database connection established successfully');
        obj.done(); // release the connection
    })
    .catch(error => {
        console.error('ERROR connecting to database:', error);
    });

// Place this BEFORE any route definitions, near the top of your file:

// Body parser middleware with increased limits
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;  // Store raw body for verification if needed
  }
}));

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

// This should come BEFORE your route definitions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Add this before the API routes registration:

// Debug middleware for API requests
app.use('/api', (req, res, next) => {
  console.log('API Request received:', {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    hasBody: !!req.body,
    bodySize: req.body ? Object.keys(req.body).length : 0
  });
  next();
});

// Make the io instance available to all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Then register your routes AFTER these middleware configurations
app.use('/api', apiRoutes);
app.use(express.static(__dirname + '/')); 
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// Make sure you have this configuration for sessions:

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true, // Set this to true to create a session for all visitors
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Add this middleware to check session on all requests (for debugging)
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
});

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('locationUpdate', (data) => {
        console.log('Location update received:', data);
        // Broadcast the location to all clients
        io.emit('updateLocation', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/home');
    }
    next();
};

app.get("/getPins", async (req, res) => {
    try {
        const result = await db.any("SELECT latitude, longitude FROM posts"); // Query DB
        res.json(result); // Send JSON response
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/profile', requireLogin, async (req, res) => {
    try {
        // Get discoveries - ADD LATITUDE AND LONGITUDE TO QUERY
        const discoveries = await db.any(`
            SELECT 
                posts.img, 
                flowers.name,
                posts.latitude,
                posts.longitude,
                posts.created_at
            FROM posts
            JOIN flowers ON posts.flower_id = flowers.id
            WHERE posts.user_id = $1
            ORDER BY posts.created_at DESC
        `, [req.session.user.id]);
        
        // Format discoveries - INCLUDE LATITUDE AND LONGITUDE with proper null checking
        const formattedDiscoveries = discoveries.map(d => {
            // Ensure latitude and longitude are converted to numbers if they exist
            const lat = d.latitude !== null ? parseFloat(d.latitude) : null;
            const lng = d.longitude !== null ? parseFloat(d.longitude) : null;
            
            return {
                imageUrl: d.img,
                name: d.name,
                latitude: lat,  // Store as number or null
                longitude: lng, // Store as number or null
                date: new Date(d.created_at).toLocaleDateString(), // Format the date properly
                location: (lat !== null && lng !== null) ? 
                    `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 
                    'Location unknown'
            };
        });
        
        // Rest of your existing code...
        const collection = await db.any(`
            SELECT DISTINCT ON (flowers.id)
                flowers.id,
                flowers.name,
                posts.img
            FROM posts
            JOIN flowers ON posts.flower_id = flowers.id
            WHERE posts.user_id = $1
            ORDER BY flowers.id, posts.id DESC
        `, [req.session.user.id]);
        
        // Format collection
        const formattedCollection = collection.map(c => ({
            id: c.id,
            name: c.name,
            imageUrl: c.img,
            scientificName: `${c.name.charAt(0).toUpperCase() + c.name.slice(1)} family`,
            tags: ['Identified']
        }));
        
        // Render with data
        res.render('pages/profile', {
            title: 'Profile', // Add this to set the page title
            user: {
                ...req.session.user,
                discoveryCount: formattedDiscoveries.length,
                collectionCount: formattedCollection.length,
                badgeCount: 0,
                discoveries: formattedDiscoveries,
                collection: formattedCollection
            }
        });
        
    } catch (error) {
        console.error('Error retrieving profile data:', error);
        res.render('pages/profile', {
            title: 'Profile',
            user: {
                ...req.session.user,
                discoveryCount: 0,
                collectionCount: 0,
                badgeCount: 0,
                discoveries: [],
                collection: []
            }
        });
    }
});

app.get('/identify', (req, res) => {
    res.render('pages/identify');
});

app.get('/explore', (req, res) => {
    res.render('pages/map');

});

app.get('/home', async (req, res) => {
    //pass the user to home screen only if it already exists
    if (!req.session.user) {
        res.render('pages/home', {
            user: null
        });
    } else {
        try {
            // Get 3 most recent posts for this user
            const recentPosts = await db.any(`
                SELECT 
                    posts.img, 
                    flowers.name,
                    posts.latitude,
                    posts.longitude,
                    posts.created_at
                FROM posts
                JOIN flowers ON posts.flower_id = flowers.id
                WHERE posts.user_id = $1
                ORDER BY posts.created_at DESC
                LIMIT 3
            `, [req.session.user.id]);
            
            // Format the posts data
            const recentDiscoveries = recentPosts.map(p => {
                const lat = p.latitude !== null ? parseFloat(p.latitude) : null;
                const lng = p.longitude !== null ? parseFloat(p.longitude) : null;
                
                return {
                    imageUrl: p.img,
                    name: p.name,
                    date: new Date(p.created_at).toLocaleDateString(),
                    location: (lat !== null && lng !== null) ? 
                        `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 
                        'Location unknown'
                };
            });
            
            res.render('pages/home', {
                user: req.session.user,
                recentDiscoveries: recentDiscoveries
            });
        } catch (error) {
            console.error('Error retrieving recent posts:', error);
            res.render('pages/home', {
                user: req.session.user,
                recentDiscoveries: [] // Empty array if there's an error
            });
        }
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

// Add this new API route to get all flower pins with details

app.get("/api/flower-pins", async (req, res) => {
    try {
        // Query for all posts with flower information
        const pins = await db.any(`
            SELECT 
                posts.id, 
                posts.img, 
                posts.latitude, 
                posts.longitude, 
                posts.created_at,
                flowers.name,
                users.username as discoverer
            FROM posts
            JOIN flowers ON posts.flower_id = flowers.id
            JOIN users ON posts.user_id = users.id
            WHERE posts.latitude IS NOT NULL AND posts.longitude IS NOT NULL
            ORDER BY posts.created_at DESC
        `);
        
        res.json(pins);
    } catch (err) {
        console.error("Database error getting flower pins:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
}

module.exports = { app, server, io };
