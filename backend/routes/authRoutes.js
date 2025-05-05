
const express = require('express');
const { signupUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// --- Authentication Routes ---

// POST /api/auth/signup - Register a new user
router.post('/signup', signupUser);

// POST /api/auth/login - Log in an existing user
router.post('/login', loginUser);

// Example: Add a route for password reset later if needed
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password/:token', resetPassword);

module.exports = router;
