
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupSchema, type SignupFormData } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleSignUp } from '@/lib/auth/actions'; // Use the auth action
import { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
     form.clearErrors(); // Clear previous errors
     console.log("Attempting signup for:", values.email); // Don't log password

    try {
      const result = await handleSignUp(values);

      console.log("Signup action result:", result);

      if (result.success) {
        toast({
          title: 'Signup Successful!',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/dashboard'); // Redirect to dashboard on successful signup
        router.refresh(); // Ensures layout re-renders with logged-in state
      } else {
        console.error("Signup action error:", result.error);
        // Check for specific "email exists" error
        if (result.error?.includes('Email already exists')) {
             form.setError('email', {
                 type: 'manual',
                 message: result.error,
             });
             toast({
               variant: 'destructive',
               title: 'Signup Failed',
               description: result.error, // Use the specific error message
             });
        } else {
             // General error handling
             toast({
               variant: 'destructive',
               title: 'Signup Failed',
               description: result.error || 'Could not create account. Please try again.',
             });
              form.setError('root', { // Set a general form error
                type: 'manual',
                message: result.error || 'Could not create account.',
             });
        }
      }
    } catch (error) {
      console.error('Signup form submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Error',
        description: 'An unexpected error occurred. Please try again.',
      });
       form.setError('root', {
          type: 'manual',
          message: 'An unexpected error occurred during signup.',
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
                <Input type="password" placeholder="Choose a strong password" {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage /> {/* Will show length validation error */}
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
             <>
               <UserPlus className="mr-2 h-4 w-4" /> Sign Up
             </>
          )}
        </Button>
      </form>
    </Form>
  );
}
