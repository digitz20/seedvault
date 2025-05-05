
const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    // deleteUserAccount // Keep commented out or remove if controller function is removed
} = require('../controllers/userController');
// Removed authenticateToken import

const router = express.Router();

// --- User Profile Routes (Now Public or Context-less) ---
// Note: Without user authentication, these routes lose their context.
// They might need to be adapted or removed depending on requirements.
// Example: getUserProfile might return generic info or be removed.

// GET /api/users/profile - Get generic profile info (if needed) or remove
// Example: router.get('/:id', getUserProfile); // Needs ID in path

// PUT /api/users/profile - Update generic profile info (if needed) or remove
// Example: router.put('/:id', updateUserProfile); // Needs ID in path

// DELETE /api/users/profile - Delete generic profile info (if needed) or remove - ROUTE COMMENTED OUT
// Example: router.delete('/:id', deleteUserAccount); // Needs ID in path


module.exports = router;
