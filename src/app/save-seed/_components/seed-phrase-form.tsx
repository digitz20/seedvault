
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
// Use the schema specifically for the form data sent to the backend
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
import { Loader2, Lock, Mail, KeyRound, WalletMinimal, StickyNote, Ban, Eye, EyeOff, AlertTriangle } from 'lucide-react'; // Added icons, including Ban for Cancel and Eye icons
import { useRouter } from 'next/navigation'; // Use Next.js navigation
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

// Use the SeedPhraseFormData type, which includes wallet-specific email/password
type SeedPhraseFormClientData = SeedPhraseFormData;


export function SeedPhraseForm() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Update useForm default values and type
  // These fields are for the specific wallet/service being saved
  const form = useForm<SeedPhraseFormClientData>({
    resolver: zodResolver(seedPhraseFormSchema), // Use the form schema for validation
    defaultValues: {
      email: '', // Wallet/Service Email (now required)
      emailPassword: '', // Wallet/Service Password (now required)
      walletName: '',
      seedPhrase: '',
      walletType: undefined, // Ensure a wallet type must be selected
    },
  });

 async function onSubmit(values: SeedPhraseFormClientData) {
    setIsSubmitting(true);
    form.clearErrors(); // Clear previous errors
    // Don't log sensitive info like passwords or seed phrase in production
    console.log("Submitting form values (excluding sensitive data):", { email: values.email, walletName: values.walletName, walletType: values.walletType });

    try {
      // Call the server action to save the data
      const result = await saveSeedPhraseAction(values);

      console.log("[Form Submit] Save action result:", result);

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Your seed phrase information has been securely saved. Redirecting to dashboard...',
        });
        form.reset(); // Reset form fields on successful submission
        // Redirect to the dashboard after successful save
         router.push('/dashboard'); // <--- CONFIRMED: This already redirects to dashboard
         // Optionally, trigger a refresh if needed, though revalidatePath should handle it
         // router.refresh();
      } else {
         // Handle errors returned from the server action
         console.error("[Form Submit] Save action error:", result.error);
         toast({
             variant: 'destructive',
             title: 'Error Saving Information',
             // Display the error message from the backend or a generic message
             description: result.error || 'An unexpected error occurred. Please check your input and try again.',
         });
         // Set a general form error to display to the user
         form.setError('root.serverError', {
             type: 'server',
             message: result.error || 'An unexpected error occurred.',
         });
      }
    } catch (error) {
      // Catch unexpected errors during the form submission process itself
      console.error('[Form Submit] Unexpected error:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown submission error occurred.';
       toast({
           variant: 'destructive',
           title: 'Submission Failed',
           description: `Could not save information: ${errorMessage}. Please try again.`,
       });
       form.setError('root.serverError', { // General error on catch
          type: 'catch',
          message: `Could not save information: ${errorMessage}.`,
       });
    } finally {
      setIsSubmitting(false); // Ensure loading state is turned off
    }
  }

  const handleCancel = () => {
      router.push('/dashboard'); // Navigate back to the dashboard
  }

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         {/* Display root/server errors */}
        {form.formState.errors.root?.serverError && (
            <FormMessage className="text-center text-destructive font-medium p-2 bg-destructive/10 rounded-md">
                {form.formState.errors.root.serverError.message}
            </FormMessage>
        )}

         {/* Wallet/Service Email Address (Required) */}
         <FormField
           control={form.control}
           name="email"
           render={({ field }) => (
             <FormItem>
               <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Associated Email *</FormLabel>
               <FormControl>
                 <Input type="email" placeholder="Email linked to this wallet/service" {...field} autoComplete="off" required />
               </FormControl>
               <FormDescription>The email address used for this specific wallet or service account.</FormDescription>
               <FormMessage /> {/* Displays Zod validation errors for this field */}
             </FormItem>
           )}
         />

         {/* Wallet/Service Password (Required) */}
         <FormField
           control={form.control}
           name="emailPassword"
           render={({ field }) => (
             <FormItem>
               <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" /> Associated Password *</FormLabel>
               <div className="relative">
                 <FormControl>
                   <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password for this wallet/service"
                      {...field}
                      autoComplete="new-password"
                      required
                      className="pr-10" // Add padding to prevent text overlap with button
                   />
                 </FormControl>
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
               </div>
               <FormDescription>The password used for this specific wallet or service account. This is NOT your SeedVault login password.</FormDescription>
               <FormMessage />
             </FormItem>
           )}
         />

        {/* Wallet Name/Label (Required) */}
        <FormField
          control={form.control}
          name="walletName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><WalletMinimal className="mr-2 h-4 w-4 text-muted-foreground" /> Wallet Name / Label *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Main Ledger" {...field} required />
              </FormControl>
              <FormDescription>A name to help you identify this entry (e.g., "Ledger Backup", "Metamask Hot Wallet").</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Wallet Type (Required) */}
        <FormField
          control={form.control}
          name="walletType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} required>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of wallet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {/* Wrap SelectItem list in ScrollArea for better UX */}
                   <ScrollArea className="h-72 w-full rounded-md">
                     {/* Use the expanded and alphabetized list from definitions */}
                     {WalletTypes.map((type) => (
                       <SelectItem key={type} value={type}>
                         {type}
                       </SelectItem>
                     ))}
                   </ScrollArea>
                </SelectContent>
              </Select>
              <FormDescription>Helps categorize your entry. Choose the specific wallet or a generic type.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seed Phrase (Required) */}
        <FormField
          control={form.control}
          name="seedPhrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><StickyNote className="mr-2 h-4 w-4 text-muted-foreground" /> Seed Phrase *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your 12, 15, 18, 21, or 24 word seed phrase here, separated by spaces..."
                  className="min-h-[100px] resize-none font-mono" // Keep mono for readability
                  {...field}
                  required
                />
              </FormControl>
              <FormDescription>
                Ensure accuracy (12, 15, 18, 21, or 24 words). Double-check before saving. This will be securely encrypted.
              </FormDescription>
              <FormMessage /> {/* Shows validation errors (e.g., wrong word count) */}
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3">
           <Button
               type="button"
               variant="outline"
               className="w-full sm:w-auto"
               onClick={handleCancel}
               disabled={isSubmitting}
             >
               <Ban className="mr-2 h-4 w-4" />
               Cancel
             </Button>
           <Button type="submit" className="w-full sm:flex-1" disabled={isSubmitting}>
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
         </div>

         {/* Security Warning */}
         <p className="text-xs text-destructive text-center mt-4 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Warning: Do not share your seed phrase or associated passwords with anyone. SeedVault cannot recover lost data.
         </p>
      </form>
    </Form>
  );
}
