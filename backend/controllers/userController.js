
const mongoose = require('mongoose');
const User = require('../models/User'); // Import User model
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model for cascading deletes

// Note: User creation (Signup) is handled in authController.js

// --- Get User Profile ---
// Fetches basic profile information for the logged-in user.
const getUserProfile = async (req, res) => {
    const userId = req.user.id; // User ID from authenticated request

    console.log(`[User Controller] Getting profile for user ID: ${userId}`);

    try {
        // Find user by ID, excluding the password field
        const user = await User.findById(userId).select('-password'); // Exclude password hash

        if (!user) {
            console.warn(`[User Controller] User not found for ID: ${userId}`);
            // 404 Not Found - Should not happen if token is valid, but good practice
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log(`[User Controller] Profile retrieved for user: ${user.email}`);
        // 200 OK status code
        res.status(200).json({
            id: user._id,
            email: user.email,
            createdAt: user.createdAt, // Include other non-sensitive fields if needed
        });

    } catch (error) {
        console.error(`[User Controller GetProfile Error] User ID: ${userId}`, error);
        // Generic server error
        res.status(500).json({ message: 'Error fetching user profile.' });
    }
};

// --- Update User Profile ---
// Allows updating user details (e.g., email - though often discouraged, or adding other fields).
// Currently only handles email update as an example. Password updates should have a dedicated flow.
const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { email } = req.body; // Only allow updating specific fields

    console.log(`[User Controller] Attempting profile update for user ID: ${userId}`);

    // Validate input: Ensure at least one updatable field is provided
    if (!email) { // Add checks for other fields if they become updatable
        return res.status(400).json({ message: 'No update information provided.' });
    }

    // Validate email format if provided
    if (email && !/.+@.+\..+/.test(email)) {
         return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the new email is already taken by another user
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({ message: 'Email address is already in use.' });
            }
            user.email = email.toLowerCase(); // Update email if valid and different
        }

        // Add logic for other updatable fields here...
        // Example: user.someOtherField = req.body.someOtherField;

        // Save the updated user document
        const updatedUser = await user.save();

        console.log(`[User Controller] Profile updated successfully for user ID: ${userId}`);

        // Return updated user info (excluding password)
        // 200 OK status code
        res.status(200).json({
            id: updatedUser._id,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            // Include other updated fields
        });

    } catch (error) {
        console.error(`[User Controller UpdateProfile Error] User ID: ${userId}`, error);
        // Handle validation errors from Mongoose save
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ message: 'Validation Error', errors });
        }
         // Handle duplicate key errors during save (e.g., if email check had a race condition)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email address is already in use.' });
        }
        // Generic server error
        res.status(500).json({ message: 'Error updating user profile.' });
    }
};

// --- Delete User Account ---
// Permanently deletes the user and all associated data (like seed phrases).
// This is a critical operation and should ideally require password re-confirmation.
const deleteUserAccount = async (req, res) => {
    const userId = req.user.id;

    // **Security Enhancement:** Ideally, require current password confirmation here
    // const { currentPassword } = req.body;
    // if (!currentPassword) return res.status(400).json({ message: 'Current password required for deletion.'});
    // const user = await User.findById(userId);
    // if (!user || !(await user.comparePassword(currentPassword))) {
    //     return res.status(403).json({ message: 'Incorrect password. Account deletion denied.' });
    // }

    console.log(`[User Controller] Attempting account deletion for user ID: ${userId}`);

    const session = await mongoose.startSession(); // Use transaction for atomicity

    try {
        session.startTransaction();

        // Step 1: Delete all seed phrases associated with the user
        const deletePhrasesResult = await SeedPhrase.deleteMany({ userId }, { session });
        console.log(`[User Controller] Deleted ${deletePhrasesResult.deletedCount} seed phrases for user ID: ${userId}`);

        // Step 2: Delete the user account
        const deleteUserResult = await User.findByIdAndDelete(userId, { session });

        if (!deleteUserResult) {
             // This case should be rare if the user was authenticated, but handle it.
             await session.abortTransaction();
             session.endSession();
             console.warn(`[User Controller] User not found during deletion for ID: ${userId}`);
             return res.status(404).json({ message: 'User not found.' });
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        console.log(`[User Controller] Account deleted successfully for user ID: ${userId}`);

        // 200 OK status code (or 204 No Content)
        res.status(200).json({ message: 'User account and associated data deleted successfully.' });

    } catch (error) {
        // If anything fails, abort the transaction
        await session.abortTransaction();
        session.endSession();
        console.error(`[User Controller DeleteAccount Error] User ID: ${userId}`, error);
        // Generic server error
        res.status(500).json({ message: 'Error deleting user account.' });
    }
};


module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    // createUser is implicitly handled by signupUser in authController
};
