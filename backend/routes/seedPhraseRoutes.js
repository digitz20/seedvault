
const express = require('express');
const {
    saveSeedPhrase,
    getSeedPhraseMetadata,
    revealSeedPhrase,
    deleteSeedPhrase
} = require('../controllers/seedPhraseController');
const authenticateToken = require('../middleware/authMiddleware'); // Import authentication middleware

const router = express.Router();

// --- Seed Phrase Routes (Protected) ---
// All routes require the user to be authenticated

// POST /api/seed-phrases - Save a new seed phrase entry for the logged-in user
router.post('/', authenticateToken, saveSeedPhrase);

// GET /api/seed-phrases/metadata - Get metadata (list) of all seed phrases for the logged-in user
// Changed route from '/api/dashboard/seed-phrases' for consistency
router.get('/metadata', authenticateToken, getSeedPhraseMetadata);

// GET /api/seed-phrases/:id/reveal - Get encrypted details for a specific seed phrase
router.get('/:id/reveal', authenticateToken, revealSeedPhrase);

// DELETE /api/seed-phrases/:id - Delete a specific seed phrase entry
router.delete('/:id', authenticateToken, deleteSeedPhrase);


module.exports = router;
