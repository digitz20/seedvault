
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LoginAndSaveFormData } from '@/lib/definitions';
import { LoginAndSaveSchema, WalletTypes } from '@/lib/definitions';
import { handleLoginAndSave } from '@/lib/auth/actions'; // Import the combined server action
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, LogIn, Mail, KeyRound, Eye, EyeOff, WalletMinimal, StickyNote, Save, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Separator } from '@/components/ui/separator'; // Import Separator

export function LoginAndSaveForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginAndSaveFormData>({
    resolver: zodResolver(LoginAndSaveSchema),
    defaultValues: {
      email: '',
      password: '',
      walletName: '',
      seedPhrase: '',
      walletType: undefined,
    },
  });

  // Display message from query params (e.g., after successful signup)
   React.useEffect(() => {
     const message = searchParams.get('message');
     const error = searchParams.get('error');
     if (message) {
       toast({
         title: 'Notification',
         description: message,
         variant: error ? 'destructive' : 'default',
       });
       // Remove the message from the URL without reloading the page
       router.replace('/login', undefined);
     }
     if (error && !message) {
        toast({
           title: 'Error',
           description: error,
           variant: 'destructive',
        });
        router.replace('/login', undefined);
     }
   }, [searchParams, toast, router]);

  async function onSubmit(values: LoginAndSaveFormData) {
    console.log("[LoginAndSaveForm] onSubmit starting...");
    setIsSubmitting(true);
    console.log("[LoginAndSaveForm] isSubmitting set to true.");
    form.clearErrors();
    console.log("[LoginAndSaveForm] Form errors cleared.");

    try {
      console.log("[LoginAndSaveForm] Calling handleLoginAndSave server action...");
      // Call the combined login and save action
      const result = await handleLoginAndSave(values);
      console.log("[LoginAndSaveForm] Server action result received:", result); // Log received result

      if (result.success) {
         console.log("[LoginAndSaveForm] Action reported successful. Preparing redirection to dashboard...");
        toast({
          title: 'Success!',
          description: 'Logged in and seed phrase saved. Redirecting to dashboard...',
          duration: 2000, // Give user a moment to see the toast
        });
        // Redirect to dashboard on successful login and save
        // Using push for navigation and refresh to update server component state
        // Use setTimeout to allow toast to be seen before navigation potentially clears it
         console.log("[LoginAndSaveForm] Setting timeout for redirection (1 second)...");
         setTimeout(() => {
           console.log("[LoginAndSaveForm] Timeout reached. Executing router.push('/dashboard')...");
           router.push('/dashboard');
           console.log("[LoginAndSaveForm] router.push finished. Executing router.refresh()...");
           // Refresh after push ensures the new page loads fresh data from the server
           // especially important if dashboard relies on session or database reads
           router.refresh();
           console.log("[LoginAndSaveForm] router.refresh finished.");
           // Ensure isSubmitting is false after successful completion and redirection attempt
           console.log("[LoginAndSaveForm] Setting isSubmitting to false after successful redirect attempt.");
           setIsSubmitting(false);
         }, 1000); // Delay redirection slightly to show toast

      } else {
         // Log the specific error received
         console.error('[LoginAndSaveForm] Server action reported error:', result.error);
         toast({
           variant: 'destructive',
           title: 'Operation Failed',
           description: result.error || 'Could not log in or save seed phrase. Please check your details and try again.',
         });
         // Set a root error or try to map specific errors if the action provides details
         if (result.error?.includes('Invalid email or password')) {
            form.setError('email', { type: 'server', message: 'Invalid email or password.' });
            form.setError('password', { type: 'server', message: 'Invalid email or password.' });
         } else if (result.error?.includes('save seed phrase')) {
             form.setError('seedPhrase', { type: 'server', message: 'Failed to save seed phrase.' });
         } else if (result.error?.includes('establish session')) {
              // Display the specific session error
              form.setError('root.serverError', { type: 'server', message: result.error });
         } else {
             form.setError('root.serverError', { type: 'server', message: result.error || 'An unexpected error occurred.' });
         }
         console.log("[LoginAndSaveForm] Setting isSubmitting to false due to action reporting an error.");
         setIsSubmitting(false); // Stop loading on error
      }
    } catch (error) {
      console.error('Unexpected error in LoginAndSaveForm onSubmit catch block:', error);
       let detailedError = 'An unknown error occurred.';
       if (error instanceof TypeError && error.message.includes('fetch failed')) {
           detailedError = `Could not connect to the backend server at ${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}. Please ensure it's running and accessible.`;
       } else if (error instanceof Error) {
           detailedError = error.message;
       }
       toast({
           variant: 'destructive',
           title: 'Error',
           description: `An unexpected error occurred: ${detailedError}`,
       });
       form.setError('root.serverError', { type: 'catch', message: 'An unexpected error occurred.' });
       console.log("[LoginAndSaveForm] Setting isSubmitting to false due to catch block error.");
       setIsSubmitting(false); // Stop loading on catch
    }
    // Don't set submitting to false here universally. It's handled within success (after timeout), error, and catch blocks.
    console.log("[LoginAndSaveForm] onSubmit function finished.");
  }

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         {form.formState.errors.root?.serverError && (
            <FormMessage className="text-center text-destructive font-medium p-2 bg-destructive/10 rounded-md">
                {form.formState.errors.root.serverError.message}
            </FormMessage>
        )}

        {/* Login Fields */}
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">SeedVault Login</h3>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Login Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@seedvault-email.com" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground"/>Login Password</FormLabel>
               <div className="relative">
                 <FormControl>
                   <Input
                     type={showPassword ? "text" : "password"}
                     placeholder="••••••••"
                     {...field}
                     required
                     className="pr-10"
                     autoComplete="current-password"
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
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-6" />

         {/* Save Seed Phrase Fields */}
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">Save Your Seed Phrase</h3>
        <FormField
          control={form.control}
          name="walletName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><WalletMinimal className="mr-2 h-4 w-4 text-muted-foreground" /> Wallet Name / Label *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Main Ledger" {...field} required autoComplete="off" />
              </FormControl>
              <FormDescription>A name to help you identify this entry.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                   <ScrollArea className="h-72 w-full rounded-md">
                     {WalletTypes.map((type) => (
                       <SelectItem key={type} value={type}>
                         {type}
                       </SelectItem>
                     ))}
                   </ScrollArea>
                </SelectContent>
              </Select>
              <FormDescription>Helps categorize your entry.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seedPhrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><StickyNote className="mr-2 h-4 w-4 text-muted-foreground" /> Seed Phrase *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your 12, 15, 18, 21, or 24 word seed phrase here, separated by spaces..."
                  className="min-h-[100px] resize-none font-mono"
                  {...field}
                  required
                  autoComplete="off"
                />
              </FormControl>
              <FormDescription>
                Ensure accuracy (12, 15, 18, 21, or 24 words). Double-check before saving.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Log In & Save Seed Phrase
            </>
          )}
        </Button>
        {/* Security Warning */}
        <p className="text-xs text-destructive text-center mt-4 flex items-center justify-center gap-1">
           <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Warning: Do not share your login password or seed phrase with anyone. SeedVault cannot recover lost data.
        </p>
      </form>
    </Form>
  );
}
