
const mongoose = require('mongoose');
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model

// --- Placeholder Encryption Function ---
// IMPORTANT: Replace this with your actual robust encryption logic.
const encryptPlaceholder = (data) => {
    if (data === undefined || data === null || data === '') return '';
    // Basic "encryption" for placeholder - REPLACE THIS
    try {
        // Example: Convert to string, reverse it, and wrap
        return `ENCRYPTED(${data.toString().split('').reverse().join('')})`;
    } catch (e) {
        console.error("Encryption placeholder error:", e);
        return ''; // Return empty on error
    }
};

// --- Save Seed Phrase (Requires Auth) ---
const saveSeedPhrase = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

     console.log(`[Save Seed Controller] Attempting save for User ID: ${userId}, Wallet: ${walletName}`);

    // Basic validation
    if (!walletName || !seedPhrase || !walletType) {
        return res.status(400).json({ message: 'Missing required fields (walletName, seedPhrase, walletType).' });
    }
    // Frontend should already validate word count, but add a basic backend check
    if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
         return res.status(400).json({ message: 'Invalid seed phrase format (must be at least 12 words).' });
    }
     // Add basic check for email/password presence if they become required by frontend logic again
     if (!email || !emailPassword) {
          return res.status(400).json({ message: 'Associated email and password are required.' });
     }

    try {
        // Encrypt sensitive data using the placeholder function
        const encryptedEmail = encryptPlaceholder(email);
        const encryptedEmailPassword = encryptPlaceholder(emailPassword);
        const encryptedSeedPhrase = encryptPlaceholder(seedPhrase);

        // Validate that essential encryption didn't fail (return empty)
        if (!encryptedSeedPhrase) {
            console.error(`[Save Seed Controller] CRITICAL: Seed Phrase encryption failed for User ID: ${userId}, Wallet: ${walletName}`);
            return res.status(500).json({ message: 'Failed to secure submitted seed phrase.' });
        }
        // Validate optional fields if provided
         if (email && !encryptedEmail) {
             console.error(`[Save Seed Controller] Optional Email encryption failed for User ID: ${userId}, Wallet: ${walletName}`);
             return res.status(500).json({ message: 'Failed to secure submitted email data.' });
         }
          if (emailPassword && !encryptedEmailPassword) {
              console.error(`[Save Seed Controller] Optional Password encryption failed for User ID: ${userId}, Wallet: ${walletName}`);
             return res.status(500).json({ message: 'Failed to secure submitted password data.' });
         }

        // Create new seed phrase instance associated with the authenticated user
        const newSeed = new SeedPhrase({
            userId: userId, // Link to the authenticated user
            encryptedEmail,
            encryptedEmailPassword,
            walletName,
            encryptedSeedPhrase,
            walletType,
        });

        await newSeed.save();

        console.log(`[Save Seed Controller] Seed phrase saved for User ID: ${userId}, Wallet: ${walletName}, DB ID: ${newSeed._id}`);
        res.status(201).json({
            message: 'Seed phrase information saved successfully.',
            id: newSeed._id // Return the ID of the newly created entry
        });

    } catch (error) {
        console.error(`[Save Seed Controller Error] User ID: ${userId}, Wallet: ${walletName}`, error);
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

// --- Reveal Seed Phrase Details by ID (Requires Auth) ---
const revealSeedPhrase = async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated request
    const phraseId = req.params.id; // Get the specific phrase ID from the URL path
     console.log(`[Reveal Controller Attempt] User ID: ${userId}, Phrase ID: ${phraseId}`);

    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find the specific seed phrase by ID AND ensure it belongs to the authenticated user
        const phrase = await SeedPhrase.findOne({ _id: phraseId, userId: userId });

        if (!phrase) {
             // This means either the phrase doesn't exist OR it doesn't belong to this user
             console.warn(`[Reveal Controller Denied] Phrase ID: ${phraseId} not found or not owned by User ID: ${userId}`);
             // Use 404 Not Found for security (don't reveal if it exists but belongs to someone else)
             return res.status(404).json({ message: 'Seed phrase not found.' });
        }

        // If found and owned by the user, return the (still encrypted) details
        console.log(`[Reveal Controller Success] Returning encrypted data for User ID: ${userId}, Phrase ID: ${phraseId}`);
        res.status(200).json({
             _id: phrase._id,
             encryptedEmail: phrase.encryptedEmail || '', // Handle potentially missing optional fields
             encryptedEmailPassword: phrase.encryptedEmailPassword || '',
             encryptedSeedPhrase: phrase.encryptedSeedPhrase,
             walletName: phrase.walletName,
             walletType: phrase.walletType,
             // Do NOT return the userId field
        });

    } catch (error) {
        console.error(`[Reveal Controller Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
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
