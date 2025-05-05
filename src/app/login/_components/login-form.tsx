'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { loginSchema } from '@/lib/definitions';
import type { LoginFormData } from '@/lib/definitions';
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
import { loginAction } from '../_actions/login-action';
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

 async function onSubmit(values: LoginFormData) {
    setIsSubmitting(true);
    console.log("Submitting login form values:", values);

    try {
      const result = await loginAction(values);
      console.log("Login action result:", result);

      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Welcome back!',
        });
        // Redirect to dashboard or another protected route on successful login
        router.push('/dashboard');
        // Optionally reset form, though redirection often makes this unnecessary
        // form.reset();
      } else {
        console.error("Login action error:", result.error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid email or password. Please try again.',
        });
        // Set a general form error
         form.setError('root', {
            type: 'manual',
            message: result.error || 'Invalid email or password.',
         });
      }
    } catch (error) {
      console.error('Login form submission error:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: `Could not log in: ${errorMessage}. Please try again.`,
      });
       // Set a general form error on catch
        form.setError('root', {
            type: 'manual',
            message: `Could not log in: ${errorMessage}.`,
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
              <FormMessage />
              {/* Optional: Add forgot password link here */}
              {/* <div className="text-right">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                  <Link href="/forgot-password">Forgot password?</Link>
                </Button>
              </div> */}
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
