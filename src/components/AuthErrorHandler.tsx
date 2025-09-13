import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';

export const AuthErrorHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (errorParam || errorCode) {
      if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
        setError('Link de confirmação expirado. Por favor, faça login novamente para receber um novo email de confirmação.');
      } else if (errorParam === 'access_denied') {
        setError('Acesso negado. Verifique se o link de confirmação está correto.');
      } else {
        setError('Erro na confirmação do email. Tente fazer login novamente.');
      }
    }
  }, [searchParams]);

  const handleBackToLogin = () => {
    // Clear URL parameters and redirect to home
    navigate('/', { replace: true });
  };

  if (!error) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">
            Erro na Confirmação
          </CardTitle>
          <CardDescription className="text-center">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>O que você pode fazer:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Fazer login novamente para receber um novo email</li>
              <li>Verificar se o email não foi para a pasta de spam</li>
              <li>Aguardar alguns minutos antes de tentar novamente</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleBackToLogin}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = 'mailto:'}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Verificar Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};