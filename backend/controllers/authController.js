
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const User = require('../models/User'); // Import User model

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token expiration time

// --- Signup (Register User) ---
const signupUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
     if (password.length < 8) {
         return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
     }
     if (!/.+@.+\..+/.test(email)) {
          return res.status(400).json({ message: 'Please enter a valid email address.' });
     }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.warn(`[Signup Controller] Attempt to signup with existing email: ${email}`);
            return res.status(409).json({ message: 'Email already exists. Please log in or use a different email.' }); // 409 Conflict
        }

        // Create new user instance (password will be hashed by pre-save hook in User model)
        const newUser = new User({
            email: email.toLowerCase(), // Store email in lowercase
            password,
        });

        // Save the new user
        await newUser.save();
        console.log(`[Signup Controller] User registered successfully: ${newUser.email}`);

        // Respond with success (don't send back password hash)
        res.status(201).json({
            message: 'User registered successfully.',
            user: { id: newUser._id, email: newUser.email } // Send back minimal user info
        });

    } catch (error) {
        console.error('[Signup Controller Error]', error);
        if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => el.message);
             return res.status(400).json({ message: 'Validation Error', errors });
        }
        // Handle potential duplicate key error during save just in case findOne check misses a race condition
        if (error.code === 11000) {
             return res.status(409).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Error registering user.' });
    }
};

// --- Login User ---
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email (case-insensitive search)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.warn(`[Login Controller] Login attempt failed: User not found for email ${email}`);
            return res.status(401).json({ message: 'Invalid email or password.' }); // 401 Unauthorized
        }

        // Compare provided password with the stored hash
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.warn(`[Login Controller] Login attempt failed: Incorrect password for email ${email}`);
            return res.status(401).json({ message: 'Invalid email or password.' }); // 401 Unauthorized
        }

        // If credentials are correct, generate a JWT
        const payload = {
            userId: user._id, // Include user ID in the token payload
            email: user.email // Optionally include email
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        console.log(`[Login Controller] User logged in successfully: ${user.email}`);
        // Send the token back to the client
        res.status(200).json({
            message: 'Login successful.',
            token: token,
            user: { id: user._id, email: user.email } // Send minimal user info
        });

    } catch (error) {
        console.error('[Login Controller Error]', error);
        res.status(500).json({ message: 'Error logging in user.' });
    }
};

module.exports = {
    signupUser,
    loginUser,
};
