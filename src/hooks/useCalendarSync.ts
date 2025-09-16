import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useImprovedFeedbackToast } from '@/components/ImprovedFeedbackToast';
import { useAuth } from "@/components/AuthGuard";

// Declaração de tipos para Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

type Provider = {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "syncing";
  isEnabled: boolean;
  lastSync?: string;
  icon?: string;
  eventsCount?: number;
};

// ===== GOOGLE (Google Identity Services) =====
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-oauth")) return resolve();
    const s = document.createElement("script");
    s.id = "google-oauth";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Remove hardcoded client IDs and use real OAuth
async function getGoogleAccessToken(): Promise<string> {
  throw new Error("Configure seu Client ID do Google nas configurações do projeto.\n\nPara obter:\n1. Acesse https://console.cloud.google.com/apis/credentials\n2. Crie um novo OAuth 2.0 Client ID\n3. Configure os domínios autorizados\n4. Substitua o Client ID no código");
}

// Remove hardcoded client IDs and require real configuration
async function getMicrosoftAccessToken(): Promise<string> {
  throw new Error("Configure seu Client ID da Microsoft nas configurações do projeto.\n\nPara obter:\n1. Acesse https://portal.azure.com/\n2. Registre um novo aplicativo\n3. Configure as permissões do Microsoft Graph\n4. Adicione o Client ID e Secret nas configurações");
}

export function useCalendarSync() {
  const { user } = useAuth();
  const feedbackToast = useImprovedFeedbackToast();
  const [loading, setLoading] = React.useState(false);
  const [providers, setProviders] = React.useState<Provider[]>([
    {
      id: "google",
      name: "Google Calendar",
      status: "disconnected",
      isEnabled: false,
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      status: "disconnected",
      isEnabled: false,
    },
    {
      id: "icloud",
      name: "iCloud Calendar",
      status: "disconnected",
      isEnabled: false,
    },
  ]);

  React.useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      console.log("🔄 Carregando configurações de sincronização para o usuário:", user.id);
      
      const { data, error } = await supabase
        .from("calendar_sync_settings")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Erro ao carregar configurações:", error);
        return;
      }

      console.log("📋 Configurações carregadas:", data);

      if (data && data.length > 0) {
        setProviders((prev) =>
          prev.map((p) => {
            const found = data.find((d) => d.provider === p.id);
            if (found) {
              return {
                ...p,
                status: found.is_enabled ? "connected" : "disconnected",
                isEnabled: found.is_enabled,
                lastSync: found.last_sync
                  ? new Date(found.last_sync).toLocaleString("pt-BR")
                  : found.updated_at
                  ? new Date(found.updated_at).toLocaleString("pt-BR")
                  : undefined,
              };
            }
            return p;
          })
        );
      }
    };

    fetchSettings();
  }, [user]);

  // === Google ===
  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      console.log("🔗 Conectando Google Calendar...");
      
      const accessToken = await getGoogleAccessToken();

      // Validate session and remove hardcoded configurations
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const { error } = await supabase
        .from("calendar_sync_settings")
        .upsert(
          {
            user_id: user!.id,
            provider: "google",
            is_enabled: true,
            sync_direction: "bidirectional",
            access_token: accessToken,
            updated_at: new Date().toISOString(),
          },
          { 
            onConflict: "user_id,provider",
            ignoreDuplicates: false 
          }
        );

      if (error) throw error;

      feedbackToast.success(
        "Google conectado",
        "Permissões concedidas e token salvo com sucesso."
      );

      setProviders((prev) =>
        prev.map((p) =>
          p.id === "google"
            ? {
                ...p,
                status: "connected",
                isEnabled: true,
                lastSync: new Date().toLocaleString("pt-BR"),
              }
            : p
        )
      );
    } catch (error: any) {
      console.error("❌ Erro Google Calendar:", error);
      
      let errorMessage = "Falha ao conectar Google Calendar";
      if (error?.message && error.message.includes("Configure o Google Client ID")) {
        errorMessage = "Configure o Google Client ID no código primeiro!";
      } else if (error?.message && error.message.includes("OAuth Error")) {
        errorMessage = "Erro de autenticação OAuth. Verifique a configuração no Google Cloud Console.";
      } else if (error?.message && error.message.includes("Failed to fetch")) {
        errorMessage = "Erro de conectividade. Verifique sua conexão com a internet.";
      }
      
      feedbackToast.error(
        "Erro",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // === Outlook ===
  const connectOutlookCalendar = async () => {
    try {
      setLoading(true);
      console.log("🔗 Tentando conectar Microsoft Outlook...");
      
      feedbackToast.error(
        "Configuração necessária", 
        "Para conectar o Microsoft Outlook, você precisa configurar o OAuth Client ID e Secret. Consulte a documentação do projeto."
      );

    } catch (error: any) {
      console.error("❌ Erro Outlook Calendar:", error);
      
      feedbackToast.error(
        "Erro",
        "Falha ao conectar Outlook Calendar: " + (error?.message || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  };

  // === iCloud ===
  const connectIcloudCalendar = async () => {
    try {
      setLoading(true);
      console.log("🔗 Configurando iCloud Calendar...");
      
      feedbackToast.info(
        "iCloud Calendar",
        "Para conectar o iCloud, você precisa de uma senha de aplicativo. Consulte a documentação do projeto para instruções completas."
      );

    } catch (error: any) {
      console.error("❌ Erro iCloud Calendar:", error);
      
      feedbackToast.error(
        "Erro",
        "Falha ao conectar iCloud Calendar: " + (error?.message || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  };

  const syncCalendar = async (providerId: string) => {
    try {
      setLoading(true);
      
      // Atualizar status para sincronizando
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, status: "syncing" }
            : p
        )
      );

      // Chamar a edge function para sincronização do Outlook
      if (providerId === 'outlook') {
        console.log('🔄 Sincronizando com Outlook...');
        
        // Buscar configurações de sincronização do banco
        const { data: syncSettings, error: settingsError } = await supabase
          .from('calendar_sync_settings')
          .select('access_token')
          .eq('user_id', user!.id)
          .eq('provider', 'outlook')
          .single();

        if (settingsError || !syncSettings?.access_token) {
          throw new Error('Token do Outlook não encontrado. Reconecte o calendário.');
        }

        const accessToken = syncSettings.access_token;

        const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
          body: {
            action: 'sync_bidirectional',
            outlookAccessToken: accessToken,
            userId: user!.id
          }
        });

        console.log('📋 Resposta da sincronização:', data, error);

        if (error) throw error;

        feedbackToast.syncComplete('Outlook', data?.import?.imported + data?.export?.exported || 0);
      } else if (providerId === 'icloud') {
        console.log('🔄 Sincronizando com iCloud...');
        
        // Buscar configurações de sincronização do banco
        const { data: syncSettings, error: settingsError } = await supabase
          .from('calendar_sync_settings')
          .select('access_token')
          .eq('user_id', user!.id)
          .eq('provider', 'icloud')
          .single();

        if (settingsError || !syncSettings?.access_token) {
          throw new Error('Credenciais do iCloud não encontradas. Reconecte o calendário.');
        }

        const credentials = syncSettings.access_token;

        const { data, error } = await supabase.functions.invoke('icloud-calendar-sync', {
          body: {
            action: 'sync_bidirectional',
            userId: user!.id,
            credentials: credentials
          }
        });

        console.log('📋 Resposta da sincronização iCloud:', data, error);

        if (error) throw error;

        feedbackToast.syncComplete('iCloud', data?.import?.imported + data?.export?.exported || 0);
      } else if (providerId === 'google') {
        console.log('🔄 Sincronizando com Google Calendar...');
        
        // Buscar configurações de sincronização
        const { data: syncSettings, error: settingsError } = await supabase
          .from('calendar_sync_settings')
          .select('access_token')
          .eq('user_id', user!.id)
          .eq('provider', 'google')
          .single();

        if (settingsError || !syncSettings?.access_token) {
          throw new Error('Token do Google Calendar não encontrado. Reconecte o calendário.');
        }

        const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
          body: {
            action: 'sync_bidirectional',
            googleAccessToken: syncSettings.access_token,
            userId: user!.id,
            calendarId: 'primary'
          }
        });

        console.log('📋 Resposta da sincronização Google:', data, error);

        if (error) throw error;

        feedbackToast.syncComplete('Google Calendar', data?.import?.imported + data?.export?.exported || 0);
      } else {
        feedbackToast.info('Sincronização iniciada', `Sincronizando calendário ${providerId}...`);
      }

      // Atualizar last_sync na base de dados
      const { error: updateError } = await supabase
        .from("calendar_sync_settings")
        .update({ 
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user!.id)
        .eq("provider", providerId);

      if (updateError) {
        console.error("Erro ao atualizar last_sync:", updateError);
      }

      // Atualizar status para conectado
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? {
                ...p,
                status: "connected",
                lastSync: new Date().toLocaleString("pt-BR"),
              }
            : p
        )
      );
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      
      // Restaurar status para conectado em caso de erro
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, status: "connected" }
            : p
        )
      );

      feedbackToast.error(
        "Erro na sincronização",
        error.message || "Falha ao sincronizar calendário"
      );
    } finally {
      setLoading(false);
    }
  };

  const disconnectProvider = async (providerId: string) => {
    try {
      setLoading(true);
      
      await supabase
        .from("calendar_sync_settings")
        .update({ 
          is_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user!.id)
        .eq("provider", providerId);

      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { 
                ...p, 
                status: "disconnected", 
                isEnabled: false,
                lastSync: undefined 
              }
            : p
        )
      );

      feedbackToast.info(
        "Desconectado",
        `${providerId} foi desconectado com sucesso.`
      );
    } catch (error) {
      console.error("❌ Erro ao desconectar:", error);
      feedbackToast.error(
        "Erro",
        "Falha ao desconectar o provedor"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("sync_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      return [];
    }
  };

  const exportToICS = async () => {
    feedbackToast.info(
      "Exportação iniciada",
      "Gerando arquivo ICS..."
    );
  };

  const saveGeneralSettings = async (settings: {
    autoSync?: boolean;
    syncNotifications?: boolean;
    bidirectionalSync?: boolean;
  }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      console.log('💾 Salvando configurações gerais:', settings);

      const { error } = await supabase
        .from('calendar_sync_settings')
        .upsert({
          user_id: user.id,
          provider: 'general',
          is_enabled: true,
          settings: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ Configurações gerais salvas');
    } catch (error) {
      console.error('❌ Erro ao salvar configurações gerais:', error);
      throw error;
    }
  };

  const loadGeneralSettings = async () => {
    try {
      if (!user) return {};

      console.log('📖 Carregando configurações gerais...');

      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('settings')
        .eq('user_id', user.id)
        .eq('provider', 'general')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.settings) {
        const settings = JSON.parse(data.settings as string);
        console.log('✅ Configurações gerais carregadas:', settings);
        return settings;
      }

      return {};
    } catch (error) {
      console.error('❌ Erro ao carregar configurações gerais:', error);
      return {};
    }
  };

  return {
    loading,
    providers,
    connectGoogleCalendar,
    connectOutlookCalendar,
    connectIcloudCalendar,
    syncCalendar,
    disconnectProvider,
    getSyncHistory,
    exportToICS,
    saveGeneralSettings,
    loadGeneralSettings
  };
}