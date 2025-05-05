
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Restore bcrypt import

// User Schema (Restored Password Handling)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true, // Keep unique constraint
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'], // Make password required again
    minlength: [8, 'Password must be at least 8 characters long.'], // Restore minlength validation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Restore Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  // Also ensure password is not null/undefined before hashing
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error("Error hashing password:", err); // Log the error
    next(err); // Pass error to the next middleware or error handler
  }
});


// Restore Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Ensure candidatePassword is a string before comparing
    if (typeof candidatePassword !== 'string') {
        return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error("Error comparing password:", err); // Log the error
    throw new Error('Error during password comparison.'); // Throw a generic error
  }
};


const User = mongoose.model('User', UserSchema);

module.exports = User;
