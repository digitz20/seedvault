import { z } from 'zod';

// --- Wallet Types ---
export const WalletTypes = [
  'Metamask',
  'Trust Wallet',
  'Ledger',
  'Trezor',
  'Exodus',
  'Coinbase Wallet',
  'Other',
] as const;

// --- Seed Phrase Schemas ---
export const seedPhraseSchema = z.object({
  // Removed email field, assuming user context will provide it later
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
   // Add userId to associate with the logged-in user
  userId: z.string().min(1, { message: 'User association is required.' }),
});

export type SeedPhraseFormData = z.infer<typeof seedPhraseSchema>;

// Data structure potentially including database ID and timestamp
export type SeedPhraseData = SeedPhraseFormData & {
  _id?: string; // Optional ID from MongoDB or other DB
  createdAt?: Date;
};


// --- User Authentication Schemas ---

export const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  // Add confirm password if needed on the frontend, but validation happens here
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;


// --- User Data Structure ---
export type User = {
  id: string; // Typically from database
  email: string;
  // Do NOT include password hash here for client-side use
  createdAt?: Date;
};
