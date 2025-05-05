
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
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
import { Loader2, LogIn, Mail, KeyRound, Eye, EyeOff } from 'lucide-react'; // Import icons

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false); // State for password visibility

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Display message from query params (e.g., after redirect from protected route or successful signup)
   React.useEffect(() => {
     const message = searchParams.get('message');
     const error = searchParams.get('error'); // Check for error param too
     if (message) {
       toast({
         title: 'Notification',
         description: message,
         variant: error ? 'destructive' : 'default', // Use destructive variant if it's an error message
       });
       // Clean the URL? Optional. Can use router.replace(pathname)
       // router.replace(router.pathname);
     }
     if (error && !message) { // Show error even if no explicit message
        toast({
           title: 'Error',
           description: error,
           variant: 'destructive',
        });
     }
   }, [searchParams, toast]); // Add toast to dependency array

  async function onSubmit(values: LoginFormData) {
    setIsSubmitting(true);
    form.clearErrors(); // Clear previous errors

    try {
      const result = await handleLogin(values);

      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Redirecting to save your seed phrase...',
        });
        // Redirect to save-seed page on successful login
        router.push('/save-seed'); // <--- CHANGED REDIRECT TARGET
         router.refresh(); // Force refresh to update layout/session state
      } else {
         console.error('Login action error:', result.error);
         toast({
           variant: 'destructive',
           title: 'Login Failed',
           description: result.error || 'Invalid email or password. Please try again.',
         });
         form.setError('root.serverError', { type: 'server', message: result.error || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Unexpected login form error:', error);
       let detailedError = 'An unknown error occurred.';
       if (error instanceof TypeError && error.message.includes('fetch failed')) {
           detailedError = `Could not connect to the backend server at ${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}. Please ensure it's running and accessible.`;
       } else if (error instanceof Error) {
           detailedError = error.message;
       }
       toast({
           variant: 'destructive',
           title: 'Login Error',
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email</FormLabel>
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
              <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground"/>Password</FormLabel>
               <div className="relative">
                 <FormControl>
                   <Input
                     type={showPassword ? "text" : "password"}
                     placeholder="••••••••"
                     {...field}
                     required
                     className="pr-10" // Add padding for the button
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
      </form>
    </Form>
  );
}
