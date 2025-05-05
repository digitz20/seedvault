

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
     }
     if (error && !message) {
        toast({
           title: 'Error',
           description: error,
           variant: 'destructive',
        });
     }
   }, [searchParams, toast]);

  async function onSubmit(values: LoginAndSaveFormData) {
    setIsSubmitting(true);
    form.clearErrors();

    try {
      // Call the combined login and save action
      const result = await handleLoginAndSave(values);

      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Logged in and seed phrase saved. Redirecting to dashboard...',
        });
        // Redirect to dashboard on successful login and save
        // Using push for navigation and refresh to update server component state
        router.push('/dashboard');
        router.refresh(); // Crucial for potentially updating session state recognized by server components/layout
      } else {
         console.error('Login & Save action error:', result.error);
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
         } else {
             form.setError('root.serverError', { type: 'server', message: result.error || 'An unexpected error occurred.' });
         }
      }
    } catch (error) {
      console.error('Unexpected login & save form error:', error);
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
    } finally {
      setIsSubmitting(false);
    }
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
                <Input placeholder="e.g., My Main Ledger" {...field} required />
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
