
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const User = require('../models/User'); // Import User model

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Default token expiry to 1 day

// --- Signup User ---
const signupUser = async (req, res) => {
    const { email, password } = req.body;

     // Basic input validation (although schema validation handles more)
     if (!email || !password) {
         return res.status(400).json({ message: 'Email and password are required.' });
     }
     // Password length check moved to schema validation

    try {
        // Check if user already exists (case-insensitive email)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            // 409 Conflict - Resource already exists
            return res.status(409).json({ message: 'Email already exists. Please log in or use a different email.' });
        }

        // Create new user instance (password hashing handled by pre-save hook)
        const user = new User({ email, password });

        // Save user (triggers pre-save hook for hashing)
        await user.save();

        // Generate JWT upon successful signup
        const token = jwt.sign(
            { id: user._id, email: user.email }, // Payload
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } // Token expiration
        );

        console.log(`[Signup Controller] User created successfully: ${email}, ID: ${user._id}`);

        // Send response with token and user info (exclude password)
        // 201 Created status code
        res.status(201).json({
            token,
            user: { id: user._id, email: user.email } // Return minimal user info
        });

    } catch (error) {
        console.error('[Signup Controller Error]', error);

        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            // Extract validation messages
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ message: 'Validation Error', errors });
        }

        // Handle duplicate key errors (just in case the initial check fails under race conditions)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        // Generic server error
        res.status(500).json({ message: 'Error creating user.' });
    }
};

// --- Login User ---
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email (case-insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });

        // Check if user exists and if password matches
        if (!user || !(await user.comparePassword(password))) {
             // 401 Unauthorized - Authentication failed
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
        }

        // Generate JWT upon successful login
        const token = jwt.sign(
            { id: user._id, email: user.email }, // Payload
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } // Token expiration
        );

        console.log(`[Login Controller] User logged in successfully: ${email}, ID: ${user._id}`);

        // Send response with token and user info (exclude password)
        // 200 OK status code
        res.status(200).json({
            token,
            user: { id: user._id, email: user.email } // Return minimal user info
        });

    } catch (error) {
        console.error('[Login Controller Error]', error);
        // Generic server error
        res.status(500).json({ message: 'Error logging in.' });
    }
};


module.exports = {
    signupUser,
    loginUser,
};
