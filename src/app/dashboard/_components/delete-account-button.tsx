
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react'; // Using Trash2 icon for deletion, Loader2 for loading
import { useToast } from '@/hooks/use-toast';
// REMOVE import of deleteAccountAction
// Import handleSignOut instead
import { handleSignOut } from '@/lib/auth/actions';

export default function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Keep loading state for sign out

  const handleDeleteConfirm = async () => {
    setIsDeleting(true); // Start loading
    setConfirmOpen(false); // Close dialog immediately

    try {
        // REMOVE call to deleteAccountAction()
        // ADD call to handleSignOut()
        await handleSignOut();

        toast({
            title: 'Signed Out', // Update message
            description: 'You have been signed out. Redirecting...',
        });
        // Redirect to homepage after sign out
        setTimeout(() => {
            router.push('/');
            router.refresh(); // Force refresh to clear any potentially cached user state
        }, 1500);

    } catch (error) {
        console.error("Sign out error (from Delete Account button):", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred while signing out.',
        });
        setIsDeleting(false); // Stop loading on error
    }
    // Do not set isDeleting to false on success path because of redirect
  };

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}> {/* Disable button while signing out */}
          {isDeleting ? (
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing Out...
              </>
          ) : (
              <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account {/* Keep UI text same for now */}
              </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          {/* Update description to reflect the actual action (sign out) */}
          <AlertDialogDescription>
             This action will sign you out of your current session and redirect you to the homepage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleDeleteConfirm}
             className="bg-destructive hover:bg-destructive/90"
            >
             {/* Update action button text to reflect sign out */}
             Yes, Sign Me Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    