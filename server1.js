const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt'); // For password hashing
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET = "your_jwt_secret";
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



// ✅ Homepage (This ensures homepage.html is served first)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "homepage.html"));
});

app.get("/contact",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","contact.html"));

});
app.get("/about",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","about.html"));

});
app.get("/descriptive",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","descriptive.html"));

});

// ✅ Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));


// ✅ MongoDB Connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let usersCollection;

client.connect()
    .then(() => {
        const db = client.db('videoapp'); // Database name
        usersCollection = db.collection('users'); // Collection name
        console.log('✅ Connected to MongoDB');
    })
    .catch(err => console.error('❌ Failed to connect to MongoDB:', err));

// ✅ Login and Signup Pages
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Translator Page (Loaded Only When Requested)
app.get("/translator", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'translator.html'));
});
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});


// ✅ Video Fetching
const videosFolder = path.join(__dirname, 'assets');
app.use('/assets', express.static(videosFolder));

app.get('/assets', (req, res) => {
    fs.readdir(videosFolder, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan folder');
        }
        const videoFiles = files.filter(file => file.endsWith('.mp4'));
        res.json(videoFiles);
    });
});

// ✅ Signup Route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword };

        // Insert user into the database
        await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await usersCollection.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid username or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid username or password' });

        const token = jwt.sign({ id: user._id, username: user.username }, SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ message: 'Login successful', redirectUrl: '/translator' ,username});

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
function authenticateUser(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const user = jwt.verify(token, SECRET);
        req.user = user; // Attach user data to request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

app.get('/current-user', authenticateUser, (req, res) => {
    res.json({ username: req.user.username }); // ✅ Send logged-in user's name
});

// ✅ Dashboard (Requires Authentication)
app.get('/dashboard', (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.redirect('/login');

        const user = jwt.verify(token, SECRET);
        res.send(`
            <h1>Welcome, ${user.username}!</h1>
            <a href="/logout">Logout</a>
        `);
    } catch (error) {
        res.redirect('/login');
    }
});

// ✅ Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
