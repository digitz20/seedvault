
import { z } from 'zod';

// --- Wallet Types ---
// Expanded and alphabetized list of wallet types
export const WalletTypes = [
  'AlphaWallet', // Ethereum Mobile
  'Argent Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'Argent X', // StarkNet focus
  'Atomic Wallet',
  'Binance Wallet (custodial)',
  'BitBox02', // Bitcoin specific option available
  'BlueWallet', // Bitcoin specific
  'BRD Wallet (Breadwallet)',
  'Braavos', // StarkNet focus
  'Brain Wallet (Not Recommended)',
  'Cake Wallet', // Monero & Bitcoin focus
  'Coin98 Wallet', // Multi-chain DeFi focus
  'Coinbase (custodial)',
  'Coinbase Wallet',
  'Coinomi',
  'Coldcard Mk4', // Bitcoin specific
  'CoolWallet Pro',
  'Core Wallet', // Avalanche focus
  'Cosmostation Wallet', // Cosmos ecosystem focus
  'Crypto.com DeFi Wallet', // Non-custodial part
  'Daedalus Wallet', // Cardano focus
  'Desktop Wallet (Generic)',
  'Edge Wallet',
  'Electrum',
  'Ellipal Titan',
  'Enkrypt', // Polkadot/Multichain
  'Eternl Wallet', // Cardano focus
  'Exodus',
  'Exodus Desktop',
  'Exodus Mobile',
  'Exodus Web3 Wallet',
  'Feather Wallet', // Monero focus
  'Foundation Passport', // Bitcoin specific
  'Frame', // Desktop multi-chain
  'Glow', // Solana focus
  'Green Wallet (Blockstream Green)', // Bitcoin specific
  'Guarda Wallet',
  'Hardware Wallet (Generic)',
  'Jaxx Liberty',
  'KeepKey',
  'Keplr Wallet', // Cosmos ecosystem focus
  'Keystone Pro (formerly Cobo Vault)',
  'Kraken Wallet (custodial)',
  'Kukai Wallet', // Tezos focus
  'Ledger Nano S',
  'Ledger Nano S Plus',
  'Ledger Nano X',
  'Ledger Stax',
  'Loopring Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'MathWallet', // Multi-chain
  'Metamask',
  'MetaMask Extension',
  'MetaMask Mobile',
  'Mobile Wallet (Generic)',
  'Monero GUI Wallet', // Monero focus
  'Multisig Wallet (Generic)',
  'MyCrypto',
  'MyEtherWallet (MEW)',
  'Nami Wallet', // Cardano focus
  'Ngrave Zero',
  'Nunchuk', // Bitcoin specific, multisig focus
  'Other',
  'Paper Wallet',
  'Phantom', // Solana focus
  'Polkadot{.js}', // Polkadot/Kusama focus
  'Rabby Wallet', // Extension focus
  'Ronin Wallet', // Axie Infinity/Ronin chain
  'SafePal S1',
  'Safe{Wallet}', // Formerly Gnosis Safe (Multisig)
  'Samourai Wallet', // Bitcoin specific
  'SeedSigner', // DIY Bitcoin Hardware Wallet
  'Software Wallet (Generic)',
  'Solflare', // Solana focus
  'Sparrow Wallet', // Bitcoin specific
  'SubWallet', // Polkadot/Kusama focus
  'Talisman', // Polkadot/Kusama focus
  'Temple Wallet', // Tezos focus
  'Terra Station', // Terra ecosystem focus
  'Trezor Model One',
  'Trezor Model T',
  'Trezor Safe 3',
  'TronLink', // Tron focus
  'Trust Wallet',
  'Trust Wallet Mobile',
  'Wasabi Wallet', // Bitcoin specific
  'Web Wallet (Generic)',
  'XDEFI Wallet', // Multi-chain focus
  'Yoroi Wallet', // Cardano focus
  'Zelcore', // Multi-asset
] as const;

// --- Seed Phrase Schema ---
// Schema for data sent FROM the frontend form TO the backend API
export const seedPhraseFormSchema = z.object({
  // userId is added server-side via the authenticated token
  email: z.string().email({ message: 'Please enter a valid email address.' })
    .optional() // Make email optional
    .or(z.literal('')) // Allow empty string
    .describe('The email address associated with the specific wallet or service, if applicable.'),
  emailPassword: z.string()
    .max(100, { message: 'Password seems too long.'}) // Basic check
    .optional() // Make password optional
    .or(z.literal('')) // Allow empty string
    .describe('The password associated with the specific wallet or service, if applicable. Not your SeedVault login password.'),
  walletName: z
    .string()
    .min(1, { message: 'Wallet name cannot be empty.' })
    .max(50, { message: 'Wallet name cannot exceed 50 characters.' })
    .describe('A descriptive name for this wallet entry (e.g., "My Main Ledger").'),
  seedPhrase: z
    .string()
    .min(1, { message: 'Seed phrase cannot be empty.'}) // Ensure it's not completely empty
    .transform(value => value.trim().toLowerCase()) // Trim and convert to lowercase before validation
    .refine(
      (value) => {
        // Allow phrases with numbers or symbols during input, but validate word count
        const words = value.split(/\s+/).filter(Boolean); // Split by space and remove empty strings
        // BIP-39 standard word counts
        return [12, 15, 18, 21, 24].includes(words.length);
      },
      {
        message:
          'Seed phrase must contain 12, 15, 18, 21, or 24 words.',
      }
    )
     // Optional: Add regex check after refinement if needed, but might be too strict during user input
    // .regex(/^[a-z]+(\s[a-z]+)*$/, {
    //    message: 'Seed phrase should ideally only contain lowercase words separated by single spaces.',
    // })
    .describe('The 12, 15, 18, 21, or 24 word recovery phrase.'),
  walletType: z.enum(WalletTypes, {
    errorMap: () => ({ message: 'Please select a valid wallet type.' }),
  }).describe('The type of wallet or service this seed phrase belongs to.'),
});

export type SeedPhraseFormData = z.infer<typeof seedPhraseFormSchema>;

// Schema for the metadata returned for the dashboard list
export const seedPhraseMetadataSchema = z.object({
  _id: z.string(), // MongoDB ObjectId as string
  walletName: z.string(),
  walletType: z.enum(WalletTypes),
  createdAt: z.string().datetime(), // Date as ISO string
});

export type SeedPhraseMetadata = z.infer<typeof seedPhraseMetadataSchema>;

// Schema for the data returned when revealing a seed phrase (contains encrypted fields)
export const revealedSeedPhraseSchema = z.object({
  _id: z.string(),
  encryptedEmail: z.string().optional(), // Reflect that it might be optional/empty when saved
  encryptedEmailPassword: z.string().optional(), // Reflect that it might be optional/empty when saved
  encryptedSeedPhrase: z.string(),
  walletName: z.string(),
  walletType: z.enum(WalletTypes),
});

export type RevealedSeedPhraseData = z.infer<typeof revealedSeedPhraseSchema>;


// --- Authentication Schemas ---
export const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' }),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Expected user data shape (excluding sensitive info like password hash)
export const userClientDataSchema = z.object({
  id: z.string(), // User ID from database (_id)
  email: z.string().email(),
});

export type UserClientData = z.infer<typeof userClientDataSchema>;

// Schema for the response from login/signup backend endpoints
export const authResponseSchema = z.object({
  token: z.string(),
  user: userClientDataSchema,
});

export type AuthResponseData = z.infer<typeof authResponseSchema>;
