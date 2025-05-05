
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginFormData } from '@/lib/definitions';
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
import { useToast } from '@/hooks/use-toast';
import { handleSignIn } from '@/lib/auth/actions'; // Use the auth action
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
   const searchParams = useSearchParams();
   const [isSubmitting, setIsSubmitting] = useState(false);

  // Display message from query params (e.g., after redirect from protected route)
   React.useEffect(() => {
     const message = searchParams.get('message');
     if (message) {
       toast({
         title: 'Info',
         description: message,
         variant: 'default' // or another appropriate variant
       });
       // Optionally remove the message from URL after showing
       // router.replace('/login', undefined); // This causes navigation loop issues sometimes
     }
   }, [searchParams, toast, router]);


  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormData) {
    setIsSubmitting(true);
    form.clearErrors(); // Clear previous errors
     console.log("Attempting login for:", values.email); // Don't log password

    try {
      const result = await handleSignIn(values);

      console.log("Login action result:", result);

      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/dashboard'); // Redirect to dashboard on success
         router.refresh(); // Ensures layout re-renders with logged-in state
      } else {
        console.error("Login action error:", result.error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid credentials or server error. Please try again.',
        });
         form.setError('root', { // Set a general form error
            type: 'manual',
            message: result.error || 'Invalid credentials or server error.',
         });
      }
    } catch (error) {
      console.error('Login form submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
      });
        form.setError('root', {
            type: 'manual',
            message: 'An unexpected error occurred during login.',
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} autoComplete="email" />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} autoComplete="current-password" />
              </FormControl>
               {/* Optional: Add Forgot Password link here */}
              {/* <FormDescription>
                 <Link href="/forgot-password" >Forgot password?</Link>
              </FormDescription> */}
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
              <LogIn className="mr-2 h-4 w-4" /> Login
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
