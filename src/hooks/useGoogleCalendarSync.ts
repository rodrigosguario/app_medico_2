import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Configurações do Google OAuth
const GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'; // Substitua pelo seu Client ID
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ');

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

export function useGoogleCalendarSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Carregar script do Google API
  const loadGoogleAPI = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES
          }).then(() => {
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  // Verificar se já está conectado
  const checkConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_credentials')
        .select('last_sync_at, expires_at')
        .eq('user_id', user.id)
        .eq('provider_id', 'google')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar conexão:', error);
        return;
      }

      if (data) {
        setIsConnected(true);
        setLastSync(data.last_sync_at);
        
        // Verificar se o token expirou
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setIsConnected(false);
          toast({
            title: 'Token expirado',
            description: 'Reconecte sua conta do Google Calendar',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  }, []);

  // Conectar com Google Calendar
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Carregar API do Google
      await loadGoogleAPI();
      
      // Fazer login
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      if (!user.isSignedIn()) {
        throw new Error('Falha na autenticação');
      }

      // Obter token de acesso
      const authResponse = user.getAuthResponse();
      const accessToken = authResponse.access_token;
      const expiresAt = new Date(Date.now() + (authResponse.expires_in * 1000)).toISOString();

      // Salvar credenciais no banco
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('calendar_credentials')
        .upsert({
          user_id: currentUser.id,
          provider_id: 'google',
          access_token: accessToken,
          refresh_token: user.getAuthResponse().refresh_token || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider_id' });

      if (error) throw error;

      setIsConnected(true);
      toast({
        title: 'Conectado com sucesso!',
        description: 'Google Calendar foi conectado ao seu aplicativo'
      });

    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro na conexão',
        description: error.message || 'Falha ao conectar com Google Calendar',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadGoogleAPI]);

  // Desconectar
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Remover credenciais do banco
      const { error } = await supabase
        .from('calendar_credentials')
        .delete()
        .eq('user_id', user.id)
        .eq('provider_id', 'google');

      if (error) throw error;

      // Desconectar do Google
      if (window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
      }

      setIsConnected(false);
      setLastSync(null);
      
      toast({
        title: 'Desconectado',
        description: 'Google Calendar foi desconectado'
      });

    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro ao desconectar',
        description: error.message || 'Falha ao desconectar',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronizar eventos
  const sync = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter token de acesso
      const { data: credentials, error: credError } = await supabase
        .from('calendar_credentials')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider_id', 'google')
        .maybeSingle();

      if (credError || !credentials) {
        throw new Error('Credenciais não encontradas. Reconecte sua conta.');
      }

      // Buscar eventos do Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expirado. Reconecte sua conta.');
        }
        throw new Error('Falha ao buscar eventos do Google Calendar');
      }

      const data = await response.json();
      const events: GoogleCalendarEvent[] = data.items || [];

      // Aqui você pode processar os eventos e salvá-los no seu banco
      console.log('Eventos do Google Calendar:', events);

      // Atualizar última sincronização
      await supabase
        .from('calendar_credentials')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('provider_id', 'google');

      setLastSync(new Date().toISOString());

      toast({
        title: 'Sincronização concluída',
        description: `${events.length} eventos encontrados no Google Calendar`
      });

      return events;

    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      
      if (error.message.includes('Token expirado')) {
        setIsConnected(false);
      }
      
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Falha ao sincronizar eventos',
        variant: 'destructive'
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
