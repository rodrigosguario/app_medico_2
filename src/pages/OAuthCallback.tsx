import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const googleConnected = searchParams.get('google_connected');
    const error = searchParams.get('error');
    
    if (googleConnected === 'true') {
      toast({
        title: 'Google Calendar Conectado',
        description: 'Sua conta foi conectada com sucesso!',
      });
      navigate('/settings?tab=calendar');
    } else if (error) {
      toast({
        title: 'Erro na Conexão',
        description: `Falha ao conectar: ${error}`,
        variant: 'destructive',
      });
      navigate('/settings?tab=calendar');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Processando conexão...</p>
      </div>
    </div>
  );
}

export default OAuthCallback;