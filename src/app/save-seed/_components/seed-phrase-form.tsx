
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
// Use the schema specifically for the form data sent to the backend
// This schema still includes email/emailPassword, but they now refer to the wallet's credentials, not the user's login.
import { seedPhraseFormSchema, WalletTypes } from '@/lib/definitions';
import type { SeedPhraseFormData } from '@/lib/definitions'; // Use the form data type

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveSeedPhraseAction } from '../_actions/save-seed-action';
import { useState } from 'react';
import { Loader2, Lock, Mail, KeyRound, WalletMinimal, StickyNote } from 'lucide-react'; // Added icons
import { useRouter } from 'next/navigation';

// Use the SeedPhraseFormData type, which includes wallet-specific email/password
type SeedPhraseFormClientData = SeedPhraseFormData;


export function SeedPhraseForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update useForm default values and type
  // User email/password are removed, these are for the wallet/service being saved
  const form = useForm<SeedPhraseFormClientData>({
    resolver: zodResolver(seedPhraseFormSchema), // Use the form schema for validation
    defaultValues: {
      email: '', // Wallet/Service Email
      emailPassword: '', // Wallet/Service Password
      walletName: '',
      seedPhrase: '',
      walletType: undefined, // Make sure a wallet type is selected
    },
  });

 async function onSubmit(values: SeedPhraseFormClientData) {
    setIsSubmitting(true);
    // Don't log passwords or seed phrase
    console.log("Submitting form values:", { email: values.email, walletName: values.walletName, walletType: values.walletType });

    try {
      // Call the server action (which requires user to be logged in)
      const result = await saveSeedPhraseAction(values);

      console.log("Save action result:", result);

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Your seed phrase information has been securely saved.',
        });
        form.reset(); // Reset form on successful submission
        // Redirect to dashboard after successful save
         router.push('/dashboard');
         router.refresh(); // Force refresh to show new entry on dashboard
      } else {
         console.error("Save action error:", result.error);
        // Check if the error is an auth error, suggesting the user needs to log in
        if (result.error?.includes('Authentication required') || result.error?.includes('Authentication failed')) {
             toast({
                 variant: 'destructive',
                 title: 'Login Required',
                 description: `Please log in or sign up to save your seed phrase.`,
             });
             // Redirect to login, potentially passing a redirect back URL if desired
             router.push('/login?redirect=/save-seed');
        } else {
            toast({
                variant: 'destructive',
                title: 'Error Saving Information',
                description: result.error || 'An unexpected error occurred. Please try again.',
            });
             form.setError('root', { // General error
                type: 'manual',
                message: result.error || 'An unexpected error occurred.',
             });
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
       // Check if it's an auth error specifically caught here
        if (errorMessage.includes('Authentication required') || errorMessage.includes('Authentication failed')) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: `You must be logged in to save a seed phrase. Please log in and try again.`,
            });
            router.push('/login?redirect=/save-seed'); // Redirect to login
        } else {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: `Could not save information: ${errorMessage}. Please try again.`,
            });
        }
        form.setError('root', { // General error on catch
          type: 'manual',
          message: `Could not save information: ${errorMessage}.`,
       });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         {/* Display root errors */}
        {form.formState.errors.root && (
            <FormMessage className="text-center text-destructive font-medium">
                {form.formState.errors.root.message}
            </FormMessage>
        )}

         {/* Wallet/Service Email Address */}
         <FormField
           control={form.control}
           name="email"
           render={({ field }) => (
             <FormItem>
               <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Associated Email</FormLabel>
               <FormControl>
                 <Input type="email" placeholder="Email linked to this wallet/service (optional)" {...field} autoComplete="off" />
               </FormControl>
               <FormDescription>The email address used for this specific wallet or service account (if any).</FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />

         {/* Wallet/Service Password */}
         <FormField
           control={form.control}
           name="emailPassword"
           render={({ field }) => (
             <FormItem>
               <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" /> Associated Password</FormLabel>
               <FormControl>
                 <Input type="password" placeholder="Password for this wallet/service (optional)" {...field} autoComplete="new-password" />
               </FormControl>
               <FormDescription>The password used for this specific wallet or service account (if any). This is NOT your SeedVault login password.</FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />

        {/* Wallet Name/Label */}
        <FormField
          control={form.control}
          name="walletName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><WalletMinimal className="mr-2 h-4 w-4 text-muted-foreground" /> Wallet Name / Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Main Ledger" {...field} />
              </FormControl>
              <FormDescription>A name to help you identify this entry (e.g., "Ledger Backup", "Metamask Hot Wallet").</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Wallet Type */}
        <FormField
          control={form.control}
          name="walletType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of wallet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WalletTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Helps categorize your entry. Choose the specific wallet or a generic type.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seed Phrase */}
        <FormField
          control={form.control}
          name="seedPhrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><StickyNote className="mr-2 h-4 w-4 text-muted-foreground" /> Seed Phrase</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your 12, 15, 18, 21, or 24 word seed phrase here, separated by spaces..."
                  className="min-h-[100px] resize-none font-mono"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ensure accuracy. Double-check your phrase before saving. This will be securely encrypted.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
             <>
               <Lock className="mr-2 h-4 w-4" /> Securely Save Information
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
