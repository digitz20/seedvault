'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { signupSchema } from '@/lib/definitions';
import type { SignupFormData } from '@/lib/definitions';
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
import { signupAction } from '../_actions/signup-action';
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Add state for confirm password if client-side matching is desired
  // const [confirmPassword, setConfirmPassword] = useState('');

 async function onSubmit(values: SignupFormData) {
    setIsSubmitting(true);
    console.log("Submitting signup form values:", values);

    // Client-side password confirmation check (optional but good UX)
    // const password = form.getValues('password');
    // if (password !== confirmPassword) {
    //   form.setError('root', { // Or set error on confirm password field if you add it
    //     type: 'manual',
    //     message: 'Passwords do not match.',
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    try {
      const result = await signupAction(values);
      console.log("Signup action result:", result);

      if (result.success) {
        toast({
          title: 'Signup Successful!',
          description: 'Your account has been created. Please log in.',
        });
        // Redirect to login page on successful signup
        router.push('/login');
        form.reset();
      } else {
        // Removed console.error here as it's an expected outcome (e.g., email exists)
        // console.error("Signup action error:", result.error);
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: result.error || 'An unexpected error occurred. Please try again.',
        });
         // Optionally set form error based on specific backend messages
         if (result.error?.includes('Email already exists')) {
            form.setError('email', { type: 'manual', message: 'This email is already registered.' });
         } else {
             form.setError('root', { // General error
                type: 'manual',
                message: result.error || 'An unexpected error occurred.',
             });
         }
      }
    } catch (error) {
      console.error('Signup form submission error:', error); // Keep this for unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: `Could not create account: ${errorMessage}. Please try again.`,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Display root errors */}
        {form.formState.errors.root && (
            <FormMessage className="text-center">
                {form.formState.errors.root.message}
            </FormMessage>
        )}
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormDescription>
                Must be at least 8 characters long.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password (Optional Frontend Check) */}
         {/* <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
            <Input
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            </FormControl>
            <FormMessage />
         </FormItem> */}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing Up...
            </>
          ) : (
             <>
               <UserPlus className="mr-2 h-4 w-4" /> Create Account
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
