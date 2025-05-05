
const mongoose = require('mongoose');
// Removed bcrypt import as password hashing is no longer needed here

// User Schema (Simplified)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true, // Still useful if users are created through other means
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address.'],
  },
  password: {
    type: String,
    // Removed required and minlength validation as password handling is removed
    // required: [true, 'Password is required.'],
    // minlength: [8, 'Password must be at least 8 characters long.'],
    // Consider removing the password field entirely if users are never created with one now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Removed Pre-save hook to hash password
/*
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err); // Pass error to the next middleware or error handler
  }
});
*/

// Removed Method to compare password for login
/*
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    throw new Error(err); // Throw error to be caught by the calling function
  }
};
*/

const User = mongoose.model('User', UserSchema);

module.exports = User;
