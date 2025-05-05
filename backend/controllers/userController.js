
const mongoose = require('mongoose');
const User = require('../models/User'); // Import User model
// Removed SeedPhrase import as cascading deletes are no longer directly tied to user deletion this way

// Note: User creation (Signup) and login are removed.
// These functions now lack their original context and may need removal or adaptation.

// --- Get User Profile (Context Lost) ---
// Needs re-evaluation: What profile to get without a logged-in user?
// Maybe fetch by ID passed in params, or remove.
const getUserProfile = async (req, res) => {
    // const userId = req.user.id; // No longer available
    const userId = req.params.id; // Example: Get ID from URL like /api/users/:id
     console.warn(`[User Controller] Getting profile requires re-evaluation without auth. Attempting for ID: ${userId}`);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Valid User ID parameter is required.' });
    }

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            console.warn(`[User Controller] User not found for ID: ${userId}`);
            return res.status(404).json({ message: 'User not found.' });
        }
        console.log(`[User Controller] Profile retrieved for user: ${user.email}`);
        res.status(200).json({
            id: user._id,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error(`[User Controller GetProfile Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching user profile.' });
    }
};

// --- Update User Profile (Context Lost) ---
// Needs re-evaluation: Which user to update without auth?
// Maybe update by ID passed in params.
const updateUserProfile = async (req, res) => {
    // const userId = req.user.id; // No longer available
     const userId = req.params.id; // Example: Get ID from URL like /api/users/:id
    const { email } = req.body;

     console.warn(`[User Controller] Updating profile requires re-evaluation without auth. Attempting for ID: ${userId}`);

     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Valid User ID parameter is required.' });
    }
    if (!email) {
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

        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            // Ensure the found existing user isn't the same user we are updating
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(409).json({ message: 'Email address is already in use by another account.' });
            }
            user.email = email.toLowerCase();
        }

        const updatedUser = await user.save();
        console.log(`[User Controller] Profile updated successfully for user ID: ${userId}`);
        res.status(200).json({
            id: updatedUser._id,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
        });
    } catch (error) {
        console.error(`[User Controller UpdateProfile Error] User ID: ${userId}`, error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ message: 'Validation Error', errors });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email address is already in use.' });
        }
        res.status(500).json({ message: 'Error updating user profile.' });
    }
};

// --- Delete User Account (Context Lost) ---
// Needs re-evaluation: Which user to delete? Use ID from params.
// Removed cascading delete of SeedPhrases as they are no longer linked by userId.
const deleteUserAccount = async (req, res) => {
    // const userId = req.user.id; // No longer available
     const userId = req.params.id; // Example: Get ID from URL like /api/users/:id

     console.warn(`[User Controller] Deleting account requires re-evaluation without auth. Attempting for ID: ${userId}`);

     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Valid User ID parameter is required.' });
    }

    // Removed transaction logic as SeedPhrase deletion is decoupled
    // const session = await mongoose.startSession();

    try {
        // Removed transaction start
        // session.startTransaction();

        // Step 1: Delete Seed Phrases - No longer applicable here, must be deleted individually via seedPhraseRoutes

        // Step 2: Delete the user account by ID
        const deleteUserResult = await User.findByIdAndDelete(userId);

        if (!deleteUserResult) {
             // Removed session abort
             console.warn(`[User Controller] User not found during deletion for ID: ${userId}`);
             return res.status(404).json({ message: 'User not found.' });
        }

        // Removed transaction commit and end
        // await session.commitTransaction();
        // session.endSession();

        console.log(`[User Controller] Account deleted successfully for user ID: ${userId}`);
        res.status(200).json({ message: 'User account deleted successfully.' }); // Removed "and associated data"

    } catch (error) {
        // Removed transaction abort and end
        // await session.abortTransaction();
        // session.endSession();
        console.error(`[User Controller DeleteAccount Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error deleting user account.' });
    }
};


module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
};
