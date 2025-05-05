
const mongoose = require('mongoose');

// Define allowed wallet types - ensure this matches frontend definitions
// You might want to import this from a shared file in a larger project
const WalletTypes = [
    'AlphaWallet', 'Argent Wallet', 'Argent X', 'Atomic Wallet', 'Binance Wallet (custodial)',
    'BitBox02', 'BlueWallet', 'BRD Wallet (Breadwallet)', 'Braavos', 'Brain Wallet (Not Recommended)',
    'Cake Wallet', 'Coin98 Wallet', 'Coinbase (custodial)', 'Coinbase Wallet', 'Coinomi',
    'Coldcard Mk4', 'CoolWallet Pro', 'Core Wallet', 'Cosmostation Wallet', 'Crypto.com DeFi Wallet',
    'Daedalus Wallet', 'Desktop Wallet (Generic)', 'Edge Wallet', 'Electrum', 'Ellipal Titan',
    'Enkrypt', 'Eternl Wallet', 'Exodus', 'Exodus Desktop', 'Exodus Mobile', 'Exodus Web3 Wallet',
    'Feather Wallet', 'Foundation Passport', 'Frame', 'Glow', 'Green Wallet (Blockstream Green)',
    'Guarda Wallet', 'Hardware Wallet (Generic)', 'Jaxx Liberty', 'KeepKey', 'Keplr Wallet',
    'Keystone Pro (formerly Cobo Vault)', 'Kraken Wallet (custodial)', 'Kukai Wallet', 'Ledger Nano S',
    'Ledger Nano S Plus', 'Ledger Nano X', 'Ledger Stax', 'Loopring Wallet', 'MathWallet',
    'Metamask', 'MetaMask Extension', 'MetaMask Mobile', 'Mobile Wallet (Generic)', 'Monero GUI Wallet',
    'Multisig Wallet (Generic)', 'MyCrypto', 'MyEtherWallet (MEW)', 'Nami Wallet', 'Ngrave Zero',
    'Nunchuk', 'Other', 'Paper Wallet', 'Phantom', 'Polkadot{.js}', 'Rabby Wallet', 'Ronin Wallet',
    'SafePal S1', 'Safe{Wallet}', 'Samourai Wallet', 'SeedSigner', 'Software Wallet (Generic)',
    'Solflare', 'Sparrow Wallet', 'SubWallet', 'Talisman', 'Temple Wallet', 'Terra Station',
    'Trezor Model One', 'Trezor Model T', 'Trezor Safe 3', 'TronLink', 'Trust Wallet',
    'Trust Wallet Mobile', 'Wasabi Wallet', 'Web Wallet (Generic)', 'XDEFI Wallet', 'Yoroi Wallet',
    'Zelcore'
];


// Seed Phrase Schema linked to a User
const SeedPhraseSchema = new mongoose.Schema({
   userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User', // Reference to the User model
       required: true, // Each seed phrase must belong to a user
       index: true, // Index for faster lookups by user
   },
  // Store encrypted email and password directly (associated with the wallet/service, NOT the user's login)
  encryptedEmail: {
    type: String,
    required: [true, 'Encrypted wallet/service email is required.'],
  },
  encryptedEmailPassword: {
      type: String,
      required: [true, 'Encrypted wallet/service password is required.'],
  },
  walletName: {
    type: String,
    required: [true, 'Wallet name/label is required.'],
    trim: true,
    maxlength: [50, 'Wallet name cannot exceed 50 characters.']
  },
  // Storing the encrypted seed phrase
  encryptedSeedPhrase: {
    type: String,
    required: [true, 'Encrypted seed phrase is required.'],
  },
  walletType: {
    type: String,
    required: [true, 'Wallet type is required.'],
    enum: { // Use enum validator
      values: WalletTypes,
      message: 'Invalid wallet type selected.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Add index on userId and createdAt for sorting user's phrases
SeedPhraseSchema.index({ userId: 1, createdAt: -1 });

const SeedPhrase = mongoose.model('SeedPhrase', SeedPhraseSchema);

module.exports = SeedPhrase;
