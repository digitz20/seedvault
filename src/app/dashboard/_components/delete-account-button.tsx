
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
import { LogOut } from 'lucide-react'; // Using LogOut icon as a metaphor for leaving
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
        <Button variant="destructive">
          <LogOut className="mr-2 h-4 w-4" /> Leave SeedVault
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will redirect you to the homepage. Your stored data will remain saved
            but will only be accessible if you return to the dashboard.
            <br />
            <span className="font-semibold mt-2 block">This action does not delete your account data.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
             onClick={handleRedirect}
             className="bg-primary hover:bg-primary/90" // Use primary color for confirmation
            >
             Yes, Redirect Me
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
