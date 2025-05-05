
const express = require('express');
const { signupUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup - Register a new user
router.post('/signup', signupUser);

// POST /api/auth/login - Log in an existing user
router.post('/login', loginUser);

module.exports = router;
