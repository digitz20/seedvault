
const mongoose = require('mongoose');
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model

// --- REMOVED Placeholder Encryption Function ---
// const encryptPlaceholder = (data) => { ... };

// --- Save Seed Phrase (Requires Auth) - Stores data in plain text ---
const saveSeedPhrase = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    // Receive plain text data from the request body
    const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

    console.log(`[Save Seed Controller] Attempting plain text save for User ID: ${userId}, Wallet: ${walletName}`);

    // Basic validation
    if (!walletName || !seedPhrase || !walletType) {
        return res.status(400).json({ message: 'Missing required fields (walletName, seedPhrase, walletType).' });
    }
    if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
        return res.status(400).json({ message: 'Invalid seed phrase format (must be at least 12 words).' });
    }
    if (!email || !emailPassword) {
        return res.status(400).json({ message: 'Associated email and password are required.' });
    }

    try {
        // Create new seed phrase instance associated with the authenticated user
        // Store data directly as plain text
        const newSeed = new SeedPhrase({
            userId: userId, // Link to the authenticated user
            email: email, // Store plain text email
            emailPassword: emailPassword, // Store plain text password
            walletName,
            seedPhrase: seedPhrase, // Store plain text seed phrase
            walletType,
        });

        await newSeed.save();

        console.log(`[Save Seed Controller] Plain text seed phrase saved for User ID: ${userId}, Wallet: ${walletName}, DB ID: ${newSeed._id}`);
        res.status(201).json({
            message: 'Seed phrase information saved successfully.',
            id: newSeed._id // Return the ID of the newly created entry
        });

    } catch (error) {
        console.error(`[Save Seed Controller Error - Plain Text] User ID: ${userId}, Wallet: ${walletName}`, error);
        if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => el.message);
             return res.status(400).json({ message: 'Validation Error', errors });
        }
        res.status(500).json({ message: 'Error saving seed phrase information.' });
    }
};

// --- Get User's Seed Phrase Metadata (Requires Auth) ---
const getSeedPhraseMetadata = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
     console.log(`[Get Metadata Controller] Fetching metadata for User ID: ${userId}`);

    try {
        // Find seed phrases belonging only to the authenticated user
        const phrases = await SeedPhrase.find({ userId: userId })
                                      .select('walletName walletType createdAt _id') // Select only metadata fields
                                      .sort({ createdAt: -1 }); // Sort by newest first

        console.log(`[Get Metadata Controller] Found ${phrases.length} phrases for User ID: ${userId}`);
        res.status(200).json(phrases); // Return the list of metadata

    } catch (error) {
        console.error(`[Get Metadata Controller Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching seed phrase information.' });
    }
};

// --- Reveal Seed Phrase Details by ID (Requires Auth) - Returns plain text ---
const revealSeedPhrase = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    const phraseId = req.params.id; // Get the specific phrase ID from the URL path
     console.log(`[Reveal Controller Attempt - Plain Text] User ID: ${userId}, Phrase ID: ${phraseId}`);

    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find the specific seed phrase by ID AND ensure it belongs to the authenticated user
        const phrase = await SeedPhrase.findOne({ _id: phraseId, userId: userId });

        if (!phrase) {
             console.warn(`[Reveal Controller Denied - Plain Text] Phrase ID: ${phraseId} not found or not owned by User ID: ${userId}`);
             return res.status(404).json({ message: 'Seed phrase not found.' });
        }

        // If found and owned by the user, return the plain text details
        console.log(`[Reveal Controller Success - Plain Text] Returning plain text data for User ID: ${userId}, Phrase ID: ${phraseId}`);
        res.status(200).json({
             _id: phrase._id,
             email: phrase.email || '', // Return plain text email
             emailPassword: phrase.emailPassword || '', // Return plain text password
             seedPhrase: phrase.seedPhrase, // Return plain text seed phrase
             walletName: phrase.walletName,
             walletType: phrase.walletType,
             // Do NOT return the userId field
        });

    } catch (error) {
        console.error(`[Reveal Controller Error - Plain Text] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error revealing seed phrase information.' });
    }
};

// --- Delete Seed Phrase by ID (Requires Auth) ---
// Note: This performs a HARD delete. Consider soft delete for production.
const deleteSeedPhrase = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    const phraseId = req.params.id; // Get the specific phrase ID from the URL path
     console.warn(`[Delete Seed Controller Attempt] HARD DELETE initiated by User ID: ${userId} for Phrase ID: ${phraseId}`);

    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find and delete the seed phrase ONLY if it matches the ID AND belongs to the authenticated user
        const result = await SeedPhrase.findOneAndDelete({ _id: phraseId, userId: userId });

        if (!result) {
            // Phrase not found or doesn't belong to the user
            console.warn(`[Delete Seed Controller Failed] Phrase ID: ${phraseId} not found or not owned by User ID: ${userId}`);
            return res.status(404).json({ message: 'Seed phrase not found or you do not have permission to delete it.' });
        }

        console.log(`[Delete Seed Controller Success] Phrase ID: ${phraseId} deleted successfully by User ID: ${userId}`);
        res.status(200).json({ message: 'Seed phrase deleted successfully.' });

    } catch (error) {
        console.error(`[Delete Seed Controller Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error deleting seed phrase information.' });
    }
};


module.exports = {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase, // Expose the delete function
};
