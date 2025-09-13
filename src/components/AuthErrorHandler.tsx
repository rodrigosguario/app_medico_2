import React from 'react';
import { translateAuthError } from '@/utils/translations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthErrorHandlerProps {
  error: string | null;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ error }) => {
  if (!error) return null;

  const translatedError = translateAuthError(error);

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {translatedError}
      </AlertDescription>
    </Alert>
  );
};