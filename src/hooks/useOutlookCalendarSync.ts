import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';

export function useOutlookCalendarSync() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Microsoft OAuth URLs
  const MICROSOFT_CLIENT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Será substituído pelos secrets do Supabase
  const REDIRECT_URI = `${window.location.origin}/oauth/callback`;
  const SCOPES = 'https://graph.microsoft.com/Calendars.ReadWrite offline_access';
  
  const AUTH_URL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${MICROSOFT_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `response_mode=query&` +
    `state=outlook_calendar`;

  // Verificar conexão existente
  const checkConnection = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'outlook')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar conexão Outlook:', error);
        return;
      }

      const now = new Date();
      const hasValidToken = data?.access_token && 
        data?.token_expires_at && 
        new Date(data.token_expires_at) > now;

      setIsConnected(hasValidToken);
      setLastSync(data?.last_sync || null);

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Conectar ao Outlook
  const connect = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Abrir popup para OAuth
      const popup = window.open(
        AUTH_URL,
        'outlook_oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup bloqueado. Permita popups para este site.');
      }

      // Aguardar callback do OAuth
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OUTLOOK_OAUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          toast({
            title: 'Sucesso',
            description: 'Outlook Calendar conectado com sucesso!',
          });
          
          checkConnection();
        } else if (event.data.type === 'OUTLOOK_OAUTH_ERROR') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          toast({
            title: 'Erro na conexão',
            description: event.data.error || 'Falha ao conectar com Outlook',
            variant: 'destructive',
          });
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout para fechar popup se necessário
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          window.removeEventListener('message', handleMessage);
          toast({
            title: 'Timeout',
            description: 'Conexão cancelada por timeout',
            variant: 'destructive',
          });
        }
      }, 300000); // 5 minutos

    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, AUTH_URL, checkConnection]);

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('calendar_sync_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'outlook');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setLastSync(null);

      toast({
        title: 'Desconectado',
        description: 'Outlook Calendar desconectado com sucesso',
      });

    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar do Outlook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Sincronizar
  const sync = useCallback(async () => {
    if (!user || !isConnected) return;

    try {
      setIsLoading(true);

      // Buscar token atual
      const { data: settings, error: settingsError } = await supabase
        .from('calendar_sync_settings')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'outlook')
        .single();

      if (settingsError || !settings?.access_token) {
        throw new Error('Token de acesso não encontrado');
      }

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
        body: {
          action: 'sync_bidirectional',
          outlookAccessToken: settings.access_token,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setLastSync(new Date().toISOString());
        toast({
          title: 'Sincronização concluída',
          description: data.message || 'Eventos sincronizados com sucesso',
        });
      } else {
        throw new Error(data?.error || 'Erro na sincronização');
      }

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  // Verificar conexão na inicialização
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isLoading,
    isConnected,
    lastSync,
    connect,
    disconnect,
    sync,
    checkConnection
  };
}