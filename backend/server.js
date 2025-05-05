
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001; // Use a different port than Next.js
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file');
  process.exit(1);
}
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
    process.exit(1);
}

// --- Mongoose Schemas ---

// User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);


// Seed Phrase Schema linked to a User
const SeedPhraseSchema = new mongoose.Schema({
   userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: true, // Each seed phrase must belong to a user
       index: true, // Index for faster lookups by user
   },
  // Store encrypted email and password directly (associated with the wallet/service, NOT the user's login)
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

const SeedPhrase = mongoose.model('SeedPhrase', SeedPhraseSchema);

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json()); // Parse JSON request bodies

// --- JWT Verification Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.sendStatus(403); // Invalid token
        }
        // Add user payload to request object
        // The payload typically contains user ID, maybe email or roles
        req.user = user;
        console.log("[Auth Middleware] Token verified for user ID:", user.id);
        next(); // pass the execution off to whatever request the client intended
    });
};


// --- Database Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if cannot connect to DB
  });


// --- API Routes ---

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Basic password strength check (example: min 8 chars)
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists. Please log in or use a different email.' }); // 409 Conflict
        }

        // Create new user
        const user = new User({ email, password });
        await user.save();

        // Generate JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' }); // Expires in 1 day

        console.log(`[Signup] User created successfully: ${email}`);
        // Return token and minimal user info (excluding password)
        res.status(201).json({
            token,
            user: { id: user._id, email: user.email }
        });

    } catch (error) {
        console.error('[Signup Error]', error);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Error creating user.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Incorrect password
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' }); // Expires in 1 day

        console.log(`[Login] User logged in successfully: ${email}`);
        // Return token and minimal user info
        res.status(200).json({
            token,
            user: { id: user._id, email: user.email }
        });

    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});


// --- Seed Phrase Saving Route (Protected) ---
app.post('/api/seed-phrases', authenticateToken, async (req, res) => {
  // Destructure fields including the userId from the authenticated token
  const userId = req.user.id; // Get user ID from verified JWT payload
  const { email, emailPassword, walletName, seedPhrase, walletType } = req.body;

   // Validate all required fields are present
   if (!email || !emailPassword || !walletName || !seedPhrase || !walletType) {
     return res.status(400).json({ message: 'Missing required fields (email, emailPassword, walletName, seedPhrase, walletType).' });
   }

   // TODO: Add more robust validation if needed

   try {
       // --- !!! ENCRYPTION LOGIC NEEDED HERE !!! ---
       // Encrypt email, emailPassword, and seedPhrase before saving.
       // Use a robust method (e.g., AES-GCM) with a STRONG, securely managed key.
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
           userId, // Associate with the logged-in user
           encryptedEmail,
           encryptedEmailPassword,
           walletName,
           encryptedSeedPhrase, // Save the *encrypted* phrase
           walletType,
       });

       await newSeed.save();
       console.log(`[Save Seed] Seed phrase information saved successfully for user ${userId}, wallet: ${walletName}`);

       // Return a simple success message - DO NOT return the saved data
       res.status(201).json({ message: 'Information saved successfully.' });

   } catch (error) {
       console.error(`[Save Seed Error] User: ${userId}, Wallet: ${walletName}`, error);
       // Handle potential validation errors from Mongoose
       if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
       }
       res.status(500).json({ message: 'Error saving seed phrase information.' });
   }
});

// --- Protected Routes for Dashboard ---

// GET User's Seed Phrase Metadata (Protected)
// Returns list of wallets (name, type, id) for the logged-in user, without revealing sensitive info.
app.get('/api/dashboard/seed-phrases', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`[Dashboard] Fetching seed phrase metadata for user ID: ${userId}`);

    try {
        // Find all seed phrases associated with the user ID
        // Select only the fields needed for the dashboard list view
        const phrases = await SeedPhrase.find({ userId })
                                      .select('walletName walletType createdAt _id') // Only return non-sensitive metadata
                                      .sort({ createdAt: -1 }); // Sort by newest first

        console.log(`[Dashboard] Found ${phrases.length} phrases for user ID: ${userId}`);
        res.status(200).json(phrases); // Return the list of metadata objects

    } catch (error) {
        console.error(`[Dashboard Error] User ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching seed phrase information.' });
    }
});

// GET Reveal a Specific Seed Phrase (Protected and Highly Sensitive)
// This route would typically require additional security measures (e.g., re-authentication, 2FA)
// For now, it just uses the JWT and returns the *encrypted* data.
// **DECRYPTION should happen CLIENT-SIDE after user confirmation.**
app.get('/api/seed-phrases/:id/reveal', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const phraseId = req.params.id;
    console.log(`[Reveal Attempt] User ID: ${userId}, Phrase ID: ${phraseId}`);

    try {
        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(phraseId)) {
            return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
        }

        // Find the specific seed phrase belonging to the authenticated user
        const phrase = await SeedPhrase.findOne({ _id: phraseId, userId });

        if (!phrase) {
            console.warn(`[Reveal Denied] Phrase ID: ${phraseId} not found or does not belong to User ID: ${userId}`);
            return res.status(404).json({ message: 'Seed phrase not found or access denied.' });
        }

        console.log(`[Reveal Success] Returning encrypted data for Phrase ID: ${phraseId}, User ID: ${userId}`);
        // **Return ENCRYPTED data.** Decryption must happen securely on the client.
        res.status(200).json({
             _id: phrase._id,
             encryptedEmail: phrase.encryptedEmail,
             encryptedEmailPassword: phrase.encryptedEmailPassword,
             encryptedSeedPhrase: phrase.encryptedSeedPhrase,
             walletName: phrase.walletName, // Wallet name is less sensitive, can be returned
             walletType: phrase.walletType, // Wallet type is less sensitive
        });

    } catch (error) {
        console.error(`[Reveal Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error revealing seed phrase information.' });
    }
});


// DELETE a Seed Phrase Entry (Protected)
app.delete('/api/seed-phrases/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const phraseId = req.params.id;
     console.log(`[Delete Attempt] User ID: ${userId}, Phrase ID: ${phraseId}`);

    try {
         // Validate the ID format
         if (!mongoose.Types.ObjectId.isValid(phraseId)) {
             return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
         }

        // Find and delete the seed phrase belonging to the authenticated user
        const result = await SeedPhrase.findOneAndDelete({ _id: phraseId, userId });

        if (!result) {
             console.warn(`[Delete Failed] Phrase ID: ${phraseId} not found or does not belong to User ID: ${userId}`);
            return res.status(404).json({ message: 'Seed phrase not found or access denied.' });
        }

         console.log(`[Delete Success] Phrase ID: ${phraseId} deleted for User ID: ${userId}`);
        res.status(200).json({ message: 'Seed phrase deleted successfully.' }); // Or 204 No Content

    } catch (error) {
        console.error(`[Delete Error] User ID: ${userId}, Phrase ID: ${phraseId}`, error);
        res.status(500).json({ message: 'Error deleting seed phrase information.' });
    }
});


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
