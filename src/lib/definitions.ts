
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
