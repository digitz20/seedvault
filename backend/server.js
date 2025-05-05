
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
// Note: Validation here should ideally mirror Zod schemas on the frontend/actions
// For simplicity, we'll keep them basic for now.

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SeedPhraseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster lookups by user
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

const User = mongoose.model('User', UserSchema);
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

// --- JWT Verification Middleware (Placeholder) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    console.log('[Auth Middleware] No token provided');
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[Auth Middleware] Token verification failed:', err.message);
      return res.sendStatus(403); // Forbidden (invalid token)
    }
    console.log('[Auth Middleware] Token verified for userId:', user.userId);
    req.user = user; // Add the decoded payload (e.g., { userId: '...' }) to the request
    next(); // pass the execution off to whatever request the client intended
  });
};


// --- API Routes ---

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists.' }); // 409 Conflict
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email: email.toLowerCase(),
      passwordHash,
    });

    await newUser.save();

    // Don't log user info here, just success
    console.log(`[Signup] User registered successfully: ${email}`);
    res.status(201).json({ message: 'User created successfully.' });

  } catch (error) {
    console.error('[Signup Error]', error);
    res.status(500).json({ message: 'Error creating user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn(`[Login] User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' }); // Unauthorized
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      console.warn(`[Login] Password mismatch for user: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const payload = { userId: user._id }; // Include user ID in the token payload
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day

    console.log(`[Login] User logged in successfully: ${email}`);
    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: { id: user._id, email: user.email } // Send back minimal user info
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: 'Error during login.' });
  }
});

// --- Protected Routes (require authentication) ---

app.get('/api/dashboard/seed-phrases', authenticateToken, async (req, res) => {
   // req.user is populated by authenticateToken middleware
   const userId = req.user?.userId;

   if (!userId) {
       // This should technically not happen if authenticateToken works correctly
       return res.status(403).json({ message: 'User ID not found in token.' });
   }

   try {
       // Fetch seed phrases belonging ONLY to the authenticated user
       const seedPhrases = await SeedPhrase.find({ userId: userId })
           .select('-encryptedSeedPhrase') // Exclude encrypted phrase by default
           .sort({ createdAt: -1 }); // Sort by newest first

        console.log(`[Dashboard] Fetched ${seedPhrases.length} seed phrases for userId: ${userId}`);

       // You might want to re-encrypt the phrases here with a *session-specific* key
       // or send only necessary metadata and decrypt on the client (less ideal).
       // For now, sending without the encrypted phrase. Client needs to request reveal.
       res.status(200).json(seedPhrases);

   } catch (error) {
       console.error('[Dashboard Fetch Error]', error);
       res.status(500).json({ message: 'Error fetching seed phrases.' });
   }
});


// Placeholder for saving a new seed phrase (protected)
app.post('/api/seed-phrases', authenticateToken, async (req, res) => {
  const userId = req.user?.userId;
  const { walletName, seedPhrase, walletType } = req.body; // Raw seed phrase from client

   if (!userId) {
     return res.status(403).json({ message: 'User ID not found in token.' });
   }

   if (!walletName || !seedPhrase || !walletType) {
     return res.status(400).json({ message: 'Missing required fields (walletName, seedPhrase, walletType).' });
   }

   // TODO: Add validation similar to Zod schema (word count, format) here

   try {
       // --- !!! ENCRYPTION LOGIC NEEDED HERE !!! ---
       // Encrypt the seedPhrase before saving it as encryptedSeedPhrase
       // This should use a robust method (e.g., AES-GCM) with a key derived
       // securely, potentially per-user or using a master key managed by a KMS.
       // **NEVER store the raw seed phrase directly.**
       // Placeholder:
       const encryptedSeedPhrase = `ENCRYPTED(${seedPhrase})`; // Replace with actual encryption call
       // --- !!! END ENCRYPTION LOGIC !!! ---

       if (!encryptedSeedPhrase || encryptedSeedPhrase === `ENCRYPTED()`) {
           console.error(`[Save Seed] Encryption failed for user ${userId}`);
           return res.status(500).json({ message: 'Failed to secure seed phrase data.' });
       }

       const newSeed = new SeedPhrase({
           userId,
           walletName,
           encryptedSeedPhrase, // Save the *encrypted* phrase
           walletType,
       });

       await newSeed.save();
       console.log(`[Save Seed] Seed phrase saved successfully for user: ${userId}, wallet: ${walletName}`);

       // Return the newly created object, excluding the encrypted phrase by default
       const savedData = newSeed.toObject();
       delete savedData.encryptedSeedPhrase;

       res.status(201).json(savedData);

   } catch (error) {
       console.error(`[Save Seed Error] User: ${userId}`, error);
       // Handle potential validation errors from Mongoose
       if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
       }
       res.status(500).json({ message: 'Error saving seed phrase.' });
   }
});

// Placeholder for revealing a seed phrase (protected) - Requires careful security
app.get('/api/seed-phrases/:id/reveal', authenticateToken, async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        return res.status(403).json({ message: 'User ID not found in token.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

    try {
        const seed = await SeedPhrase.findOne({ _id: id, userId: userId });

        if (!seed) {
            console.warn(`[Reveal Seed] Seed phrase not found or user mismatch. ID: ${id}, User: ${userId}`);
            return res.status(404).json({ message: 'Seed phrase not found or permission denied.' });
        }

        // --- !!! DECRYPTION LOGIC NEEDED HERE !!! ---
        // Decrypt seed.encryptedSeedPhrase using the appropriate key/method.
        // This is highly sensitive and requires extreme care.
        // Placeholder:
        const decryptedSeedPhrase = seed.encryptedSeedPhrase.replace('ENCRYPTED(', '').replace(')', ''); // Replace with actual decryption
        // --- !!! END DECRYPTION LOGIC !!! ---

        if (!decryptedSeedPhrase) {
            console.error(`[Reveal Seed] Decryption failed for ID: ${id}, User: ${userId}`);
            return res.status(500).json({ message: 'Failed to decrypt seed phrase.' });
        }

        console.log(`[Reveal Seed] Seed phrase revealed for ID: ${id}, User: ${userId}`);
        res.status(200).json({ seedPhrase: decryptedSeedPhrase });

    } catch (error) {
        console.error(`[Reveal Seed Error] ID: ${id}, User: ${userId}`, error);
        res.status(500).json({ message: 'Error revealing seed phrase.' });
    }
});


// Placeholder for deleting a seed phrase (protected)
app.delete('/api/seed-phrases/:id', authenticateToken, async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

     if (!userId) {
        return res.status(403).json({ message: 'User ID not found in token.' });
    }
     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid seed phrase ID format.' });
    }

     try {
        const result = await SeedPhrase.deleteOne({ _id: id, userId: userId });

        if (result.deletedCount === 1) {
            console.log(`[Delete Seed] Seed phrase deleted successfully. ID: ${id}, User: ${userId}`);
            res.status(200).json({ message: 'Seed phrase deleted successfully.' });
        } else {
             console.warn(`[Delete Seed] Seed phrase not found or user mismatch. ID: ${id}, User: ${userId}`);
            res.status(404).json({ message: 'Seed phrase not found or permission denied.' });
        }
     } catch (error) {
        console.error(`[Delete Seed Error] ID: ${id}, User: ${userId}`, error);
        res.status(500).json({ message: 'Error deleting seed phrase.' });
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
