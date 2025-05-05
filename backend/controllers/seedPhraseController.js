
const mongoose = require('mongoose');
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model

// --- Placeholder Encryption Function ---
// Replace this with your actual robust encryption logic (e.g., using 'crypto' module with AES-GCM)
// **NEVER use this placeholder in production.**
const encryptPlaceholder = (data) => {
    if (data === undefined || data === null || data === '') return ''; // Handle empty optional fields
    // Basic "encryption" - just wraps the data. Replace with real encryption.
    return `ENCRYPTED(${data.toString()})`;
};

// --- Save Seed Phrase ---
const saveSeedPhrase = async (req, res) => {
    // Get userId from the authenticated request (added by authMiddleware)
    const userId = req.user.id;
    // Destructure all fields, including optional ones
    const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

    // Backend validation: Ensure required fields are present
    if (!walletName || !seedPhrase || !walletType) {
        return res.status(400).json({ message: 'Missing required fields (walletName, seedPhrase, walletType).' });
    }

    // Basic check for phrase structure (more robust validation can be added)
     if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
          return res.status(400).json({ message: 'Invalid seed phrase format (must be 12+ words).' });
     }
     // Consider adding validation for walletType enum here too for robustness

    try {
        // --- !!! ENCRYPTION LOGIC NEEDED HERE !!! ---
        // Encrypt sensitive data before saving. Use a strong, unique key per user, possibly derived from their password during login (handle key management carefully!).
        // This is a placeholder, replace with real encryption.
        // Encrypt optional fields only if they are provided
        const encryptedEmail = email ? encryptPlaceholder(email) : '';
        const encryptedEmailPassword = emailPassword ? encryptPlaceholder(emailPassword) : '';
        const encryptedSeedPhrase = encryptPlaceholder(seedPhrase); // This one is required
        // --- !!! END ENCRYPTION LOGIC !!! ---

        // Basic check if required placeholder encryption produced something (adjust for real encryption)
        if (!encryptedSeedPhrase || encryptedSeedPhrase === 'ENCRYPTED()') {
            console.error(`[Save Seed Controller] Required Seed Phrase encryption failed for user ${userId}.`);
            return res.status(500).json({ message: 'Failed to secure submitted seed phrase.' });
        }
        // Check optional fields didn't fail if they were provided
        if (email && (!encryptedEmail || encryptedEmail === 'ENCRYPTED()')) {
             console.error(`[Save Seed Controller] Optional Email encryption failed for user ${userId}.`);
            return res.status(500).json({ message: 'Failed to secure submitted email data.' });
        }
         if (emailPassword && (!encryptedEmailPassword || encryptedEmailPassword === 'ENCRYPTED()')) {
             console.error(`[Save Seed Controller] Optional Password encryption failed for user ${userId}.`);
            return res.status(500).json({ message: 'Failed to secure submitted password data.' });
        }


        // Create new seed phrase instance
        const newSeed = new SeedPhrase({
            userId, // Link to the logged-in user
            encryptedEmail, // Save potentially empty encrypted string if not provided
            encryptedEmailPassword, // Save potentially empty encrypted string if not provided
            walletName,
            encryptedSeedPhrase, // Save the *encrypted* phrase
            walletType,
        });

        // Save to database
        await newSeed.save();

        console.log(`[Save Seed Controller] Seed phrase saved for user ${userId}, wallet: ${walletName}, ID: ${newSeed._id}`);

        // Respond with success message (avoid sending back sensitive data)
        // 201 Created status code
        res.status(201).json({ message: 'Information saved successfully.', id: newSeed._id }); // Optionally return the new ID

    } catch (error) {
        console.error(`[Save Seed Controller Error] User: ${userId}, Wallet: ${walletName}`, error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => el.message);
             return res.status(400).json({ message: 'Validation Error', errors });
        }
        // Generic server error
        res.status(500).json({ message: 'Error saving seed phrase information.' });
    }
};

// --- Get Seed Phrase Metadata ---
// Returns a list of wallet names, types, and IDs for the user's dashboard.
const getSeedPhraseMetadata = async (req, res) => {
    const userId = req.user.id; // User ID from authenticated request
    console.log(`[Get Metadata Controller] Fetching metadata for user ID: ${userId}`);

    try {
        // Find all seed phrases associated with the user ID
        // Select only the fields needed for the dashboard list view
        const phrases = await SeedPhrase.find({ userId })
                                      .select('walletName walletType createdAt _id') // Only return non-sensitive metadata
                                      .sort({ createdAt: -1 }); // Sort by newest first

        console.log(`[Get Metadata Controller] Found ${phrases.length} phrases for user ID: ${userId}`);

        // Return the list of metadata objects
        // 200 OK status code
        res.status(200).json(phrases);

    } catch (error) {
        console.error(`[Get Metadata Controller Error] User ID: ${userId}`, error);
        // Generic server error
        res.status(500).json({ message: 'Error fetching seed phrase information.' });
    }
};

// --- Reveal Seed Phrase Details (Encrypted) ---
// Fetches a specific seed phrase entry, returning the *encrypted* data.
// Decryption MUST happen securely on the client-side.
const revealSeedPhrase = async (req, res) => {
    const userId = req.user.id;
    const phraseId = req.params.id; // Get phrase ID from URL parameters

    console.log(`[Reveal Controller Attempt] User ID: ${userId}, Phrase ID: ${phraseId}`);

    // Validate the ID format before querying
    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find the specific seed phrase belonging ONLY to the authenticated user
        const phrase = await SeedPhrase.findOne({ _id: phraseId, userId });

        if (!phrase) {
            console.warn(`[Reveal Controller Denied] Phrase ID: ${phraseId} not found or doesn't belong to User ID: ${userId}`);
            // 404 Not Found - The specific resource was not found for this user
            return res.status(404).json({ message: 'Seed phrase not found or access denied.' });
        }

        console.log(`[Reveal Controller Success] Returning encrypted data for Phrase ID: ${phraseId}, User ID: ${userId}`);

        // **Return ENCRYPTED data.**
        // 200 OK status code
        res.status(200).json({
             _id: phrase._id, // Include ID for client reference
             // Return optional fields, they might be empty strings if not saved
             encryptedEmail: phrase.encryptedEmail || '',
             encryptedEmailPassword: phrase.encryptedEmailPassword || '',
             encryptedSeedPhrase: phrase.encryptedSeedPhrase,
             walletName: phrase.walletName, // Less sensitive, OK to return
             walletType: phrase.walletType, // Less sensitive, OK to return
        });

    } catch (error) {
        console.error(`[Reveal Controller Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        // Generic server error
        res.status(500).json({ message: 'Error revealing seed phrase information.' });
    }
};

// --- Delete Seed Phrase ---
const deleteSeedPhrase = async (req, res) => {
    const userId = req.user.id;
    const phraseId = req.params.id; // Get phrase ID from URL parameters

    console.log(`[Delete Controller Attempt] User ID: ${userId}, Phrase ID: ${phraseId}`);

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find and delete the seed phrase belonging ONLY to the authenticated user
        const result = await SeedPhrase.findOneAndDelete({ _id: phraseId, userId });

        if (!result) {
            // If result is null, the document wasn't found or didn't belong to the user
            console.warn(`[Delete Controller Failed] Phrase ID: ${phraseId} not found or doesn't belong to User ID: ${userId}`);
             // 404 Not Found
            return res.status(404).json({ message: 'Seed phrase not found or access denied.' });
        }

        console.log(`[Delete Controller Success] Phrase ID: ${phraseId} deleted for User ID: ${userId}`);

        // Respond with success message or status code
        // 200 OK with message, or 204 No Content
        res.status(200).json({ message: 'Seed phrase deleted successfully.' });
        // Alternatively: res.status(204).send();

    } catch (error) {
        console.error(`[Delete Controller Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        // Generic server error
        res.status(500).json({ message: 'Error deleting seed phrase information.' });
    }
};


module.exports = {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase,
};
