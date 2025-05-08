
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LoginFormData } from '@/lib/definitions';
import { LoginSchema } from '@/lib/definitions';
import { handleLogin } from '@/lib/auth/actions'; // Import the login server action
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, LogIn, Mail, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react'; // Import icons

// No need for NEXT_PUBLIC_BACKEND_API_URL here as the action handles the URL
// const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Display message from query params (e.g., after redirect from protected route or signup)
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

  async function onSubmit(values: LoginFormData) {
    setIsSubmitting(true);
    form.clearErrors();
    console.log('[LoginForm] onSubmit starting...');

    try {
      console.log('[LoginForm] Calling handleLogin server action...');
      const result = await handleLogin(values);
      // Log the result from the server action
      console.log('[LoginForm] Server action result:', JSON.stringify(result, null, 2));

       // handleLogin action now directly redirects on success, so we primarily handle errors here.
       // If the action was successful, the redirect should have happened server-side.
       // If we reach here AND result.success is somehow true (it shouldn't be due to redirect),
       // it indicates an unexpected state, but we still try to navigate.
      if (result.success) {
        console.warn("[LoginForm] Reached success block unexpectedly after handleLogin. Redirect should have happened in action. Attempting client-side redirect.");
        // Optional: Show success toast briefly before client-side redirect attempt
         toast({
           title: 'Login Successful!',
           description: 'Redirecting to dashboard...',
           duration: 1500, // Shorter duration as redirect might be immediate
         });
        router.push('/dashboard'); // Fallback redirect
      } else {
         // Handle login failure reported by the action
         const failureReason = result.error || 'Invalid email or password.';
         console.error('[LoginForm] Action reported failure:', failureReason);

         toast({
           variant: 'destructive',
           title: 'Login Failed',
           description: failureReason,
         });

         // Set specific field errors if applicable, otherwise set a root error
         if (failureReason.toLowerCase().includes('invalid email or password')) {
             form.setError('email', { type: 'server', message: 'Invalid email or password.' });
             form.setError('password', { type: 'server', message: ' ' }); // Add space to trigger message display if needed
         } else if (failureReason.includes('connect to the backend')) {
              form.setError('root.serverError', { type: 'server', message: 'Could not reach the login server. Please try again later.' });
         }
         else {
            form.setError('root.serverError', { type: 'server', message: failureReason });
         }
         setIsSubmitting(false); // Stop loading on error
      }
    } catch (error: any) {
        // Catch unexpected errors during the form submission process itself OR if redirect throws
        console.error('[LoginForm] Unexpected error in onSubmit catch block:', error);

        // Specifically handle NEXT_REDIRECT errors which are expected
        if (error.message === 'NEXT_REDIRECT') {
            console.log('[LoginForm] Caught NEXT_REDIRECT. Navigation should be handled by Next.js.');
            // Don't show an error toast for expected redirects
            // setIsSubmitting should ideally remain true until navigation completes,
            // but we might need to set it false if navigation hangs. For now, let Next handle it.
            return; // Exit the function
        }

        // Handle other unexpected errors
        let detailedError = 'An unknown error occurred during login.';
        // Use the backend URL from the action for the error message if applicable
        // (Though actions.ts handles this now)
        // if (error instanceof TypeError && error.message.includes('fetch failed')) {
        //     detailedError = `Could not connect to the backend server. Please ensure it's running.`;
        // } else
        if (error instanceof Error) {
            detailedError = error.message;
        }

        toast({
            variant: 'destructive',
            title: 'Login Error',
            description: `An unexpected error occurred: ${detailedError}`,
        });
        form.setError('root.serverError', { type: 'catch', message: 'An unexpected error occurred.' });
        setIsSubmitting(false); // Stop loading on unexpected errors
    }
     // Do not set isSubmitting to false here universally if redirecting
     // console.log('[LoginForm] onSubmit finished.');
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Login Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} required />
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
                     autoComplete="current-password" // Help password managers
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging In...
            </>
          ) : (
             <>
               <LogIn className="mr-2 h-4 w-4" /> Log In
             </>
          )}
        </Button>
         {/* Security Warning */}
        <p className="text-xs text-destructive text-center mt-4 flex items-center justify-center gap-1">
           <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Warning: Do not share your login password with anyone.
        </p>
      </form>
    </Form>
  );
}
