
const express = require('express');
const {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase
} = require('../controllers/seedPhraseController');
// Removed authenticateToken import

const router = express.Router();

// --- Seed Phrase Routes (Now Public) ---

// POST /api/seed-phrases - Save a new seed phrase entry (publicly)
// Note: Consider if userId association is still needed or if it becomes anonymous/global
router.post('/', saveSeedPhrase);

// GET /api/seed-phrases/metadata - Get metadata (list) of all seed phrases (publicly)
// Note: This will now fetch ALL phrases unless backend controller logic changes.
router.get('/metadata', getSeedPhraseMetadata);

// GET /api/seed-phrases/:id/reveal - Get encrypted details for a specific seed phrase (publicly, by ID)
router.get('/:id/reveal', revealSeedPhrase);

// DELETE /api/seed-phrases/:id - Delete a specific seed phrase entry (publicly, by ID)
router.delete('/:id', deleteSeedPhrase);


module.exports = router;
