'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { seedPhraseSchema, WalletTypes } from '@/lib/definitions';
// Update the type import to exclude email and userId initially from the form
import type { Omit } from 'utility-types'; // You might need to install utility-types: npm install utility-types

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
import { Loader2, Lock } from 'lucide-react';

// Define the form data type without email and userId
type SeedPhraseFormClientData = Omit<z.infer<typeof seedPhraseSchema>, 'email' | 'userId'>;


export function SeedPhraseForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update useForm default values and type
  const form = useForm<SeedPhraseFormClientData>({
    // Use a resolver that ignores the missing fields initially
    // OR adjust the schema used here if Zod allows partials easily
    resolver: zodResolver(seedPhraseSchema.omit({ email: true, userId: true })),
    defaultValues: {
      walletName: '',
      seedPhrase: '',
      walletType: undefined,
    },
  });

 async function onSubmit(values: SeedPhraseFormClientData) {
    setIsSubmitting(true);
    console.log("Submitting form values:", values);

    try {
      // The server action `saveSeedPhraseAction` will need to be updated
      // to accept this partial data and add the userId from the session.
      const result = await saveSeedPhraseAction(values);

      console.log("Action result:", result);

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Your seed phrase has been securely saved.',
        });
        form.reset(); // Reset form on successful submission
      } else {
         console.error("Action error:", result.error);
        toast({
          variant: 'destructive',
          title: 'Error Saving Seed Phrase',
          description: result.error || 'An unexpected error occurred. Please try again.',
        });
         form.setError('root', { // General error
            type: 'manual',
            message: result.error || 'An unexpected error occurred.',
         });
      }
    } catch (error) {
      console.error('Form submission error:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: `Could not save seed phrase: ${errorMessage}. Please check the console for details and try again.`,
      });
        form.setError('root', { // General error on catch
          type: 'manual',
          message: `Could not save seed phrase: ${errorMessage}.`,
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
            <FormMessage className="text-center">
                {form.formState.errors.root.message}
            </FormMessage>
        )}
        {/* Email Field Removed */}

        {/* Wallet Name/Label */}
        <FormField
          control={form.control}
          name="walletName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Name / Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Main Wallet" {...field} />
              </FormControl>
              <FormDescription>A name to help you identify this wallet.</FormDescription>
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
                    <SelectValue placeholder="Select a wallet type" />
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
              <FormDescription>Helps categorize your entry.</FormDescription>
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
              <FormLabel>Seed Phrase</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your 12, 15, 18, 21, or 24 word seed phrase here..."
                  className="min-h-[100px] resize-none font-mono"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ensure accuracy. Double-check your phrase before saving.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
             <>
               <Lock className="mr-2 h-4 w-4" /> Securely Save Seed Phrase
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
