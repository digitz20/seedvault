
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
// Simulating no auth, no sign out action needed
// import { handleSignOut } from '@/lib/auth/actions';

export default function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Keep loading state for redirect visual feedback

  const handleDeleteConfirm = async () => {
    setIsDeleting(true); // Start loading
    setConfirmOpen(false); // Close dialog immediately

    // Simulate sign-out/delete process (no backend call)
    toast({
        title: 'Action Simulated', // Keep title less alarming
        description: 'Returning to homepage...',
        duration: 1500,
    });
    // Redirect to homepage
    setTimeout(() => {
        router.push('/'); // Redirect to the homepage
        // No need to refresh, homepage is public
        // setIsDeleting(false); // No need to set here due to redirect
    }, 1500); // Short delay for toast visibility

  };

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}> {/* Disable button while redirecting */}
          {isDeleting ? (
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Returning...
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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle> {/* Less alarming title */}
          {/* Update description to reflect the actual action (return home) */}
          <AlertDialogDescription>
             This action will return you to the homepage. Your account data will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleDeleteConfirm}
             className="bg-destructive hover:bg-destructive/90" // Keep style for consistency? Or change to default? Keep for now.
            >
             {/* Update action button text to reflect return home */}
             Yes, Return to Home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
