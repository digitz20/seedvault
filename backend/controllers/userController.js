
const mongoose = require('mongoose');
const User = require('../models/User'); // Import User model
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model for cascading delete

// --- Get User Profile (Requires Auth) ---
const getUserProfile = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request (set by authenticateToken middleware)
    console.log(`[User Controller] Getting profile for User ID: ${userId}`);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         // This should ideally not happen if authenticateToken middleware is working
         console.error(`[User Controller GetProfile Error] Invalid User ID found in authenticated request: ${userId}`);
         return res.status(401).json({ message: 'Authentication error.' });
    }

    try {
        // Find user by ID from the token and select fields to return (exclude password)
        const user = await User.findById(userId).select('-password');
        if (!user) {
            // This case might occur if the user was deleted after the token was issued
            console.warn(`[User Controller GetProfile] User not found for authenticated ID: ${userId}`);
            return res.status(404).json({ message: 'User not found.' });
        }
        console.log(`[User Controller] Profile retrieved for user: ${user.email}`);
        res.status(200).json({
            id: user._id,
            email: user.email,
            createdAt: user.createdAt,
            // Add any other non-sensitive fields you want to return
        });
    } catch (error) {
        console.error(`[User Controller GetProfile Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching user profile.' });
    }
};

// --- Update User Profile (Requires Auth) ---
const updateUserProfile = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    const { email } = req.body; // Allow updating email for now (consider password updates separately)

    console.log(`[User Controller] Attempting profile update for User ID: ${userId}`);

    // Validate input
    if (!email) { // Only updating email in this example
        return res.status(400).json({ message: 'No update information provided (e.g., email).' });
    }
     if (email && !/.+@.+\..+/.test(email)) {
          return res.status(400).json({ message: 'Invalid email format.' });
     }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update email if provided and different
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
             // Check if the new email is already taken by another user
             const existingUser = await User.findOne({ email: email.toLowerCase() });
             if (existingUser && existingUser._id.toString() !== userId) {
                 console.warn(`[User Controller UpdateProfile] Email conflict for User ID: ${userId}. Email ${email} already in use.`);
                 return res.status(409).json({ message: 'Email address is already in use by another account.' }); // 409 Conflict
             }
            user.email = email.toLowerCase();
            console.log(`[User Controller UpdateProfile] Updating email for User ID: ${userId} to ${email}`);
        }
        // Add logic here if you want to allow password updates (would require current password verification and hashing the new one)

        const updatedUser = await user.save();
        console.log(`[User Controller] Profile updated successfully for User ID: ${userId}`);
        res.status(200).json({
            id: updatedUser._id,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            // Return updated non-sensitive fields
        });
    } catch (error) {
        console.error(`[User Controller UpdateProfile Error] User ID: ${userId}`, error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ message: 'Validation Error', errors });
        }
         // Catch potential duplicate key error during save if the initial check fails due to race conditions
         if (error.code === 11000) {
             return res.status(409).json({ message: 'Email address is already in use.' });
         }
        res.status(500).json({ message: 'Error updating user profile.' });
    }
};

// --- Delete User Account (Requires Auth, includes Seed Phrase Deletion) ---
// Note: This performs a HARD delete. Consider soft delete (adding an 'isDeleted' flag) for production.
const deleteUserAccount = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    console.warn(`[User Controller] Initiating HARD DELETE for User ID: ${userId} and associated seed phrases.`);

    const session = await mongoose.startSession(); // Start a MongoDB transaction session

    try {
        session.startTransaction(); // Begin the transaction

        // Step 1: Delete all seed phrases associated with the user within the transaction
        const deletePhrasesResult = await SeedPhrase.deleteMany({ userId: userId }, { session });
        console.log(`[User Controller DeleteAccount] Deleted ${deletePhrasesResult.deletedCount} seed phrase(s) for User ID: ${userId}`);

        // Step 2: Delete the user account itself within the transaction
        const deleteUserResult = await User.findByIdAndDelete(userId, { session });

        if (!deleteUserResult) {
            // If user not found (might be already deleted or an issue), abort transaction
             await session.abortTransaction();
             session.endSession();
             console.warn(`[User Controller DeleteAccount] User not found during deletion for ID: ${userId}. Transaction aborted.`);
             return res.status(404).json({ message: 'User not found.' });
        }

        // If both operations were successful, commit the transaction
        await session.commitTransaction();
        session.endSession();

        console.log(`[User Controller] Account and associated data deleted successfully for user ID: ${userId}`);
        // Respond with success, maybe clear client-side session/token here too
        res.status(200).json({ message: 'User account and associated data deleted successfully.' });

    } catch (error) {
        // If any error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();
        console.error(`[User Controller DeleteAccount Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error deleting user account. Operation rolled back.' });
    }
};


module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount, // Expose the delete function
};
