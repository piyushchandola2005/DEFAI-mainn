import { useState } from 'react';
import React from 'react';
import { NameCollectionDialog } from '@/components/NameCollectionDialog';

interface UseUserRegistrationProps {
  onNameCollected?: () => void;
}

export function useUserRegistration({ onNameCollected }: UseUserRegistrationProps = {}) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; wallet_address: string } | null>(null);

  const handleRegistrationComplete = (user: any, isNewUser: boolean) => {
    setCurrentUser(user);
    if (isNewUser) {
      setShowNameDialog(true);
    }
  };

  const handleNameCollected = () => {
    setShowNameDialog(false);
    onNameCollected?.();
  };

  const NameCollectionDialogWrapper: React.FC = () => (
    <NameCollectionDialog
      isOpen={showNameDialog}
      walletAddress={currentUser?.wallet_address || ''}
      onComplete={handleNameCollected}
    />
  );

  return {
    handleRegistrationComplete,
    NameCollectionDialog: NameCollectionDialogWrapper,
  };
}
