
const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount // Use the actual delete function
} = require('../controllers/userController');
// authenticateToken middleware is applied in server.js for '/api/users' base path

const router = express.Router();

// --- User Profile Routes (Protected by authenticateToken in server.js) ---

// GET /api/users/profile - Get the authenticated user's profile
// The user ID comes from req.user set by the middleware
router.get('/profile', getUserProfile);

// PUT /api/users/profile - Update the authenticated user's profile
router.put('/profile', updateUserProfile);

// DELETE /api/users/profile - Delete the authenticated user's account AND associated data
router.delete('/profile', deleteUserAccount);


module.exports = router;
