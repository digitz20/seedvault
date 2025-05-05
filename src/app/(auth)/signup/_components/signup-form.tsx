
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation'; // Import useRouter
import type { SignupFormData } from '@/lib/definitions';
import { SignupSchema } from '@/lib/definitions';
import { handleSignup } from '@/lib/auth/actions'; // Import the signup server action
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
import { Loader2, UserPlus, Mail, KeyRound, Eye, EyeOff } from 'lucide-react'; // Import icons

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false); // State for password visibility

  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: SignupFormData) {
    setIsSubmitting(true);
    form.clearErrors(); // Clear previous errors

    try {
      const result = await handleSignup(values);

      if (result.success) {
        toast({
          title: 'Signup Successful!',
          description: 'Your account has been created. Please log in.',
        });
        // Redirect to login page with a success message
        router.push('/login?message=Signup successful! Please log in.');
        // form.reset(); // Reset form isn't strictly needed due to redirect
      } else {
        console.error("Signup action error:", result.error);
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: result.error || 'Could not create account. Please try again.',
        });
         form.setError('root.serverError', { type: 'server', message: result.error || 'Could not create account.' });
         // If specific error is "Email already exists", focus the email field
          if (result.error?.toLowerCase().includes('email already exists')) {
              form.setError('email', { type: 'server', message: 'Email already exists.' });
          }
      }
    } catch (error) {
       console.error('Unexpected signup form error:', error);
       toast({
           variant: 'destructive',
           title: 'Signup Error',
           description: 'An unexpected error occurred during signup. Please try again later.',
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
        {form.formState.errors.root?.serverError && !form.formState.errors.email && ( // Show root error only if no specific field error
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
              <FormMessage /> {/* Shows validation errors and server-side email error */}
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
                     placeholder="Choose a strong password (min. 8 characters)"
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
              Creating Account...
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
