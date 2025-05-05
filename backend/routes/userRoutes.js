
const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount
} = require('../controllers/userController');
// Removed authenticateToken import

const router = express.Router();

// --- User Profile Routes (Now Public or Context-less) ---
// Note: Without user authentication, these routes lose their context.
// They might need to be adapted or removed depending on requirements.
// Example: getUserProfile might return generic info or be removed.

// GET /api/users/profile - Get generic profile info (if needed) or remove
// router.get('/profile', getUserProfile); // Commented out - needs re-evaluation

// PUT /api/users/profile - Update generic profile info (if needed) or remove
// router.put('/profile', updateUserProfile); // Commented out - needs re-evaluation

// DELETE /api/users/profile - Delete generic profile info (if needed) or remove
// router.delete('/profile', deleteUserAccount); // Commented out - needs re-evaluation


module.exports = router;
