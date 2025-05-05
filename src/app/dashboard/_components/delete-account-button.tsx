
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
import { Trash2 } from 'lucide-react'; // Using Trash2 icon for deletion
import { useToast } from '@/hooks/use-toast';

export default function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRedirect = () => {
    // Simulate logging out / redirecting without deleting
    console.log('[Delete Account Button] Redirecting to homepage. No data deleted.');
    toast({
      title: 'Redirecting',
      description: 'You are being redirected to the homepage.',
    });
    setIsConfirmOpen(false); // Close the dialog
    router.push('/'); // Redirect to the homepage
  };

  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogTrigger asChild>
        {/* Changed button text */}
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete your account, are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleRedirect}
             className="bg-destructive hover:bg-destructive/90" // Use destructive color for confirmation
            >
            {/* Changed action button text */}
             Yes, Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

