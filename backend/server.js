
// --- Environment Variables ---
require('dotenv').config(); // Load environment variables from .env file
const PORT = process.env.BACKEND_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
// Removed JWT_SECRET variable as it's not used directly here anymore

// --- Basic Validations ---
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file');
  process.exit(1);
}
// Removed JWT_SECRET check

// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route handlers
// const authRoutes = require('./routes/authRoutes'); // Removed authRoutes import
const userRoutes = require('./routes/userRoutes');
const seedPhraseRoutes = require('./routes/seedPhraseRoutes');
// Middleware (optional, e.g., for logging)
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
// app.use('/api/auth', authRoutes); // Removed mounting of authentication routes
app.use('/api/users', userRoutes); // Mount user profile routes (note: functionality might change without auth)
app.use('/api/seed-phrases', seedPhraseRoutes); // Mount seed phrase routes (now public)

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
      res.status(statusCode).json({ message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
