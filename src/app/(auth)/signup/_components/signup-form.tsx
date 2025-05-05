
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import { signupSchema } from '@/lib/definitions';
import type { SignupFormData } from '@/lib/definitions';
import { handleSignUp } from '@/lib/auth/actions';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react'; // Import icons

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

   async function onSubmit(values: SignupFormData) {
     setIsSubmitting(true);
     console.log('Attempting signup for:', values.email); // Avoid logging password

     try {
       const result = await handleSignUp(values);
       console.log('Signup action result:', result);

       if (result.success) {
         toast({
           title: 'Signup Successful!',
           description: 'Welcome! Please log in to continue.',
         });
         form.reset();
         // Redirect to login page after successful signup
         router.push('/login?message=Signup successful! Please log in.');
       } else {
          console.error("Signup action error:", result.error);
           // Display specific error from backend if available
          toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: result.error || 'Could not create account. Please try again.',
          });
           form.setError('root', { // General error
             type: 'manual',
             message: result.error || 'Could not create account.',
          });
           // Optionally set specific field errors if the backend provides them
           if (result.error?.toLowerCase().includes('email already exists')) {
               form.setError('email', { type: 'manual', message: 'This email is already registered. Please log in or use a different email.' });
           }
       }
     } catch (error) {
       console.error('Form submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected network error occurred.';
       toast({
         variant: 'destructive',
         title: 'Signup Failed',
         description: `Could not create account: ${errorMessage}. Please try again later.`,
       });
       form.setError('root', { // General error on catch
          type: 'manual',
          message: `Could not create account: ${errorMessage}.`,
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
              <FormDescription>
                We'll use this to log you in.
              </FormDescription>
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
                <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
              </FormControl>
               <FormDescription>
                 Must be at least 8 characters long.
               </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
           {isSubmitting ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
             </>
           ) : (
             <>
               <UserPlus className="mr-2 h-4 w-4" /> Create Account
             </>
           )}
        </Button>
         <FormDescription className="text-center">
           Already have an account?{' '}
           <Link href="/login" className="font-medium text-primary hover:underline">
             Sign in
           </Link>
         </FormDescription>
      </form>
    </Form>
  );
}
