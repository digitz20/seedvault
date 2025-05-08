
// --- Environment Variables ---
require('dotenv').config(); // Load environment variables from .env file
const PORT = process.env.BACKEND_PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET; // Load JWT Secret

// --- Basic Validations ---
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route handlers
const authRoutes = require('./routes/authRoutes'); // Import authentication routes
const userRoutes = require('./routes/userRoutes');
const seedPhraseRoutes = require('./routes/seedPhraseRoutes');
// Middleware
const authenticateToken = require('./middleware/authenticateToken'); // Import authentication middleware
// const requestLogger = require('./middleware/requestLogger'); // Example middleware

// --- Express App Initialization ---
const app = express();

// --- Middleware Setup ---
app.use(cors()); // Enable CORS for all origins (adjust in production if needed)
app.use(express.json()); // Parse JSON request bodies
// app.use(requestLogger); // Example: Use a custom request logger

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if cannot connect to DB
  });

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
  // Consider more robust error handling or monitoring here
});


// --- API Routes ---
// Public Authentication Routes (Login/Signup) - No token required here
app.use('/api/auth', authRoutes);

// Protected User Routes - Apply authenticateToken middleware BEFORE these routes
// Any request to /api/users/* must have a valid token now
app.use('/api/users', authenticateToken, userRoutes);

// Protected Seed Phrase Routes - Apply authenticateToken middleware BEFORE these routes
// Any request to /api/seed-phrases/* must have a valid token now
app.use('/api/seed-phrases', authenticateToken, seedPhraseRoutes);


// --- Root Route (Health Check/Info) ---
app.get('/', (req, res) => {
  res.send('SeedVault Backend API is running!');
});

// --- Not Found Handler (Catch-all for unhandled routes) ---
app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found on this server.' });
});


// --- Global Error Handling Middleware ---
// Must be defined last, after all routes and other middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);

  // Default to 500 Internal Server Error if status is not set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  // Avoid leaking sensitive error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
       res.status(500).json({ message: 'Internal Server Error' });
  } else {
      // Send detailed error in development, generic in production for non-500s
       res.status(statusCode).json({ message: process.env.NODE_ENV === 'production' ? 'An error occurred.' : message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
