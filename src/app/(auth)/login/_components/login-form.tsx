
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import * as React from 'react'; // Import React
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams

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
import { loginSchema } from '@/lib/definitions';
import type { LoginFormData } from '@/lib/definitions';
import { handleSignIn } from '@/lib/auth/actions';
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react'; // Import icons

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const [isSubmitting, setIsSubmitting] = useState(false);

   // Display message from query params (e.g., after redirect from protected route)
   React.useEffect(() => {
     const message = searchParams.get('message');
     const error = searchParams.get('error'); // Check for error param too
     if (message) {
       toast({
         title: 'Info',
         description: message,
       });
       // Clean the URL, remove the message param
        const nextUrl = `${window.location.pathname}`;
        window.history.replaceState({...window.history.state}, '', nextUrl);
     }
      if (error) {
         toast({
             variant: 'destructive',
             title: 'Error',
             description: error,
         });
          const nextUrl = `${window.location.pathname}`;
          window.history.replaceState({...window.history.state}, '', nextUrl);
     }
   }, [searchParams, toast]);


  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormData) {
    setIsSubmitting(true);
    console.log('Attempting login for:', values.email); // Avoid logging password

    try {
      const result = await handleSignIn(values);
      console.log('Login action result:', result);

      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Welcome back!',
        });
        // Redirect to dashboard or intended page after successful login
         const redirectUrl = searchParams.get('redirect') || '/dashboard'; // Get redirect URL or default to dashboard
         console.log(`Redirecting to: ${redirectUrl}`);
         router.push(redirectUrl);
         router.refresh(); // Force refresh layout/header
      } else {
        console.error('Login action error:', result.error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid credentials or server error. Please try again.',
        });
         form.setError('root', { // General error
            type: 'manual',
            message: result.error || 'Invalid credentials or server error.',
         });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected network error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: `Could not process login: ${errorMessage}. Please try again later.`,
      });
      form.setError('root', { // General error on catch
         type: 'manual',
         message: `Could not process login: ${errorMessage}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
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
              <FormMessage />
              {/* Add Forgot Password link if needed */}
               {/* <FormDescription className="text-right">
                   <Link href="/forgot-password" className="text-sm hover:underline">
                   Forgot password?
                   </Link>
               </FormDescription> */}
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
             </>
           ) : (
             <>
               <LogIn className="mr-2 h-4 w-4" /> Sign In
             </>
           )}
        </Button>
         <FormDescription className="text-center">
           Don't have an account?{' '}
           <Link href="/signup" className="font-medium text-primary hover:underline">
             Sign up
           </Link>
         </FormDescription>
      </form>
    </Form>
  );
}
