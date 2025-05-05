
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
import { deleteAccountAction } from '@/lib/auth/actions'; // Import the actual delete action

export default function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Add loading state

  const handleDeleteConfirm = async () => {
    setIsDeleting(true); // Start loading
    setConfirmOpen(false); // Close dialog immediately

    try {
        const result = await deleteAccountAction(); // Call the server action

        if (result.success) {
            toast({
                title: 'Account Deleted',
                description: 'Your account and all associated data have been permanently deleted. Redirecting...',
            });
            // Redirect to homepage after successful deletion (sign out is handled in the action)
            // Add a slight delay for the toast to be seen
             setTimeout(() => {
                 router.push('/');
                 router.refresh(); // Force refresh to clear any potentially cached user state
             }, 1500);
        } else {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: result.error || 'Could not delete your account. Please try again.',
            });
            setIsDeleting(false); // Stop loading on failure
        }
    } catch (error) {
        console.error("Delete account error:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred while deleting your account.',
        });
        setIsDeleting(false); // Stop loading on error
    }
    // No finally block needed for setIsDeleting as we handle success/error explicitly
  };

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}> {/* Disable button while deleting */}
          {isDeleting ? (
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
          ) : (
              <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle> {/* Stronger wording */}
          <AlertDialogDescription>
             This action cannot be undone. This will permanently delete your account and all associated seed phrase data from SeedVault servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleDeleteConfirm}
             className="bg-destructive hover:bg-destructive/90" // Use destructive color for confirmation
             // No disabled state needed here as the outer button handles it
            >
             Yes, Delete My Account Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
