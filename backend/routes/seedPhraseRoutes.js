
const express = require('express');
const {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase // Use the actual delete function
} = require('../controllers/seedPhraseController');
// authenticateToken middleware is applied in server.js for '/api/seed-phrases' base path

const router = express.Router();

// --- Seed Phrase Routes (Protected by authenticateToken in server.js) ---

// POST /api/seed-phrases - Save a new seed phrase entry for the authenticated user
router.post('/', saveSeedPhrase);

// GET /api/seed-phrases/metadata - Get metadata list for the authenticated user's seed phrases
router.get('/metadata', getSeedPhraseMetadata);

// GET /api/seed-phrases/:id/reveal - Get encrypted details for a specific seed phrase owned by the user
router.get('/:id/reveal', revealSeedPhrase);

// DELETE /api/seed-phrases/:id - Delete a specific seed phrase entry owned by the user
router.delete('/:id', deleteSeedPhrase);


module.exports = router;
