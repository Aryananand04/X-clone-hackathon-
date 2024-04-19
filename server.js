const express = require('express');
const mongoose = require('mongoose');
const firebaseAdmin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


const serviceAccount = require('./path-to-your-firebase-adminsdk.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Define a user schema and model
const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Middleware to authenticate Firebase token
const authenticateFirebaseToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Example route for user authentication
app.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    let user = await User.findOne({ uid });
    if (!user) {
      // Create a new user if not found in the database
      user = await User.create({ uid, email, username: email.split('@')[0] });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Example route for search functionality
app.get('/search', authenticateFirebaseToken, async (req, res) => {
  try {
    const { query } = req.query;
    // Perform search logic here
    res.status(200).json({ results: [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
