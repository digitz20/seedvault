
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// Removed AlertDialog imports as delete confirmation is removed
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
// Removed Trash2 icon
import { Eye, Loader2, Copy, Check, AlertTriangle, LockKeyhole, EyeOff } from "lucide-react";
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from "@/lib/definitions";
import { useToast } from '@/hooks/use-toast';
// Removed deleteSeedPhraseAction import
import { revealSeedPhraseAction } from '../_actions/dashboard-actions';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input'; // For displaying revealed data
import { Label } from '@/components/ui/label'; // For labeling revealed data
import { Badge } from '@/components/ui/badge'; // To show wallet type nicely
import { Skeleton } from '@/components/ui/skeleton'; // For loading state in modal
import { Textarea } from '@/components/ui/textarea'; // Import Textarea


interface SeedPhraseTableProps {
  phrases: SeedPhraseMetadata[];
}

export default function SeedPhraseTable({ phrases: initialPhrases }: SeedPhraseTableProps) {
  const { toast } = useToast();
  const [phrases, setPhrases] = useState<SeedPhraseMetadata[]>(initialPhrases);
  // Adjusted isLoading state to only track reveal
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isRevealing, setIsRevealing] = useState(false); // Track loading state specifically for the modal reveal action
  const [revealedData, setRevealedData] = useState<RevealedSeedPhraseData | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({}); // Track copy status per field
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  // Avoid hydration mismatch for Date formatting
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- Decryption Placeholder ---
  // Replace this with your actual client-side decryption logic.
  // This should involve a key derived securely, likely something the user enters
  // or manages, as storing the key alongside the data defeats the purpose.
  const decryptData = (encryptedData: string | undefined | null): string => {
    // *** WARNING: THIS IS A PLACEHOLDER - IMPLEMENT REAL DECRYPTION ***
    if (!encryptedData) {
        return "[Not Provided]"; // Handle cases where optional fields weren't saved
    }
    // This basic placeholder just removes the "ENCRYPTED(...)" wrapper.
    // A real implementation would use a cryptographic library (e.g., SubtleCrypto)
    // and a securely derived key.
    if (encryptedData.startsWith('ENCRYPTED(') && encryptedData.endsWith(')')) {
        return encryptedData.substring(10, encryptedData.length - 1);
    }
    // If it's not in the expected encrypted format, return an error/indicator.
    // This might happen if data was saved before the encryption logic or if encryption failed.
    console.warn("Decryption attempt failed for data:", encryptedData); // Log unexpected format
    return "[Decryption Error]";
    // *** END PLACEHOLDER ***
  };
  // --- End Decryption Placeholder ---

  const handleReveal = async (phraseId: string) => {
    // Use row-specific loading for the button, modal-specific for the fetch
    setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: true }));
    setIsRevealing(true); // Show loading state inside the modal trigger
    setRevealedData(null); // Clear previous data immediately
    setIsRevealModalOpen(true); // Open the modal to show loading state

    try {
      const result = await revealSeedPhraseAction(phraseId);
      if (result.data) {
        setRevealedData(result.data); // Set data only on success
        // Modal is already open
      } else {
        toast({
          variant: 'destructive',
          title: 'Reveal Failed',
          description: result.error || 'Could not retrieve seed phrase details.',
        });
        setIsRevealModalOpen(false); // Close modal if reveal fails
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while revealing the phrase.',
      });
      console.error("Reveal error:", error);
      setIsRevealModalOpen(false); // Close modal on unexpected error
    } finally {
      setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: false }));
      setIsRevealing(false); // Stop modal loading state
    }
  };

  // Removed handleDelete function

  const handleCopyToClipboard = (text: string | undefined | null, fieldName: string) => {
     const textToCopy = text || ""; // Handle null/undefined
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyStatus(prev => ({ ...prev, [fieldName]: true }));
        setTimeout(() => setCopyStatus(prev => ({ ...prev, [fieldName]: false })), 1500); // Reset icon after 1.5s
        toast({ title: `${fieldName} copied to clipboard!`});
    }).catch(err => {
        console.error('Failed to copy:', err);
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy text to clipboard.' });
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Wallet Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phrases.length === 0 && (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No seed phrases found.
                </TableCell>
            </TableRow>
          )}
          {phrases.map((phrase) => (
            <TableRow key={phrase._id}>
              <TableCell className="font-medium">{phrase.walletName}</TableCell>
              <TableCell>
                 <Badge variant="secondary" className="whitespace-nowrap">{phrase.walletType}</Badge>
              </TableCell>
              <TableCell>
                 {/* Format date only on client-side */}
                 {isClient ? format(new Date(phrase.createdAt), "PPp") : <Skeleton className="h-4 w-32" />}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {/* Reveal Button */}
                <Button
                   variant="outline"
                   size="icon" // Changed to icon size for consistency
                   onClick={() => handleReveal(phrase._id)}
                   disabled={isLoading[`reveal-${phrase._id}`] || isRevealing} // Disable while modal is loading too
                   aria-label={`Reveal details for ${phrase.walletName}`}
                   title={`Reveal details for ${phrase.walletName}`}
                 >
                  {isLoading[`reveal-${phrase._id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                 </Button>

                {/* Delete Button and AlertDialog Removed */}

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

       {/* Reveal Modal using Dialog */}
      <Dialog open={isRevealModalOpen} onOpenChange={setIsRevealModalOpen}>
         <DialogContent className="sm:max-w-[550px] w-[95vw]"> {/* Adjust width */}
            <DialogHeader>
              <DialogTitle className="flex items-center">
                 <LockKeyhole className="mr-2 h-5 w-5 text-primary"/> Revealed Details
              </DialogTitle>
               {!isRevealing && revealedData && (
                 <DialogDescription>
                   Details for: <span className="font-semibold">{revealedData.walletName}</span> (<Badge variant="outline" className="text-xs">{revealedData.walletType}</Badge>).
                   <br />
                   <span className="text-destructive font-semibold mt-2 block flex items-center">
                     <AlertTriangle className="mr-1 h-4 w-4 flex-shrink-0" /> SECURITY WARNING: Keep this information private. Avoid screenshots or sharing.
                   </span>
                 </DialogDescription>
               )}
               {isRevealing && (
                  <DialogDescription>Loading details...</DialogDescription>
               )}
            </DialogHeader>
             {isRevealing ? (
                 <div className="space-y-4 py-4">
                     <Skeleton className="h-8 w-full" />
                     <Skeleton className="h-8 w-full" />
                     <Skeleton className="h-20 w-full" />
                 </div>
             ) : revealedData ? (
                 <div className="grid gap-4 py-4">
                    {/* Decrypted fields will appear here */}
                    {/* Associated Email */}
                     <div className="grid grid-cols-[100px_1fr_auto] items-center gap-3">
                         <Label htmlFor="revealed-email" className="text-right font-medium text-sm pr-2">
                             Assoc. Email
                         </Label>
                         <Input
                             id="revealed-email"
                             value={decryptData(revealedData.encryptedEmail)}
                             readOnly
                             className="col-span-1 font-mono text-xs sm:text-sm h-9" // Smaller font on mobile
                             aria-label="Revealed Associated Email"
                         />
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmail), 'Email')}
                             aria-label="Copy Associated Email"
                             title="Copy Associated Email"
                            >
                             {copyStatus['Email'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                      {/* Associated Password */}
                     <div className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-3">
                         <Label htmlFor="revealed-password" className="text-right font-medium text-sm pr-2">
                            Assoc. Pass
                         </Label>
                         <Input
                             id="revealed-password"
                             type={showPassword ? "text" : "password"}
                             value={decryptData(revealedData.encryptedEmailPassword)}
                             readOnly
                             className="col-span-1 font-mono text-xs sm:text-sm h-9"
                             aria-label="Revealed Associated Password"
                         />
                         {/* Toggle Visibility Button */}
                         <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={togglePasswordVisibility}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                         {/* Copy Button */}
                          <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmailPassword), 'Password')}
                             aria-label="Copy Associated Password"
                             title="Copy Associated Password"
                          >
                             {copyStatus['Password'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                      {/* Seed Phrase */}
                     <div className="grid grid-cols-[100px_1fr_auto] items-start gap-3">
                         <Label htmlFor="revealed-seed" className="text-right font-medium text-sm mt-2 pr-2">
                             Seed Phrase
                         </Label>
                         {/* Use textarea for better formatting of multi-word phrases */}
                         <Textarea
                            id="revealed-seed"
                            value={decryptData(revealedData.encryptedSeedPhrase)}
                            readOnly
                            rows={4} // Adjust rows as needed
                            className="col-span-1 font-mono text-xs sm:text-sm p-2 border rounded-md bg-muted/50 resize-none h-auto" // Allow height adjustment
                            aria-label="Revealed Seed Phrase"
                         />
                          <Button
                             variant="ghost"
                             size="icon"
                             className="mt-1 h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedSeedPhrase), 'Seed Phrase')}
                             aria-label="Copy Seed Phrase"
                             title="Copy Seed Phrase"
                          >
                            {copyStatus['Seed Phrase'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                      {/* Add Disclaimer about decryption */}
                     <p className="text-xs text-muted-foreground text-center pt-2">
                         Data is shown after applying placeholder decryption. Implement robust client-side decryption using a secure key derivation method.
                     </p>
                 </div>
             ) : (
                 // Handle case where reveal succeeded but data is missing (shouldn't happen with validation)
                  <div className="text-center py-4 text-muted-foreground">
                      Could not load seed phrase details.
                  </div>
             )}
             {/* Modal Footer */}
             <DialogFooter>
                 <DialogClose asChild>
                     <Button type="button" variant="secondary">
                         Close
                     </Button>
                 </DialogClose>
             </DialogFooter>
         </DialogContent>
     </Dialog>
    </>
  );
}
