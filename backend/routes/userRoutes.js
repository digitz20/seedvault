
const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount
} = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// --- User Profile Routes (Protected) ---
// All routes in this file require the user to be authenticated

// GET /api/users/profile - Get the logged-in user's profile information
router.get('/profile', authenticateToken, getUserProfile);

// PUT /api/users/profile - Update the logged-in user's profile information
router.put('/profile', authenticateToken, updateUserProfile);

// DELETE /api/users/profile - Delete the logged-in user's account and associated data
router.delete('/profile', authenticateToken, deleteUserAccount);


module.exports = router;
