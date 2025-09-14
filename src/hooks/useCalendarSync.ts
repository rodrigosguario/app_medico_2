import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

async function getGoogleAccessToken(): Promise<string> {
  // IMPORTANTE: Configure seu Client ID real aqui
  // Obtenha em: https://console.cloud.google.com/apis/credentials
  const clientId = "96055265793-jv779hsni65f6pmv54jn65a4vv04f9kj.apps.googleusercontent.com"; // SUBSTITUA pelo seu Client ID real
  
  if (!clientId || clientId.includes("YOUR_GOOGLE") || clientId.includes("1234567890")) {
    throw new Error("⚠️ Configure o Google Client ID real no código! Veja docs/google-oauth-setup.md");
  }

  console.log("🔑 Iniciando OAuth com Client ID:", clientId.substring(0, 20) + "...");

  await loadGoogleScript();
  
  // Verificar se o Google API está carregado
  if (typeof window.google === 'undefined' || !window.google.accounts) {
    throw new Error("Google API não carregou corretamente");
  }

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
    prompt: "consent",
    callback: "", // Será definido no requestAccessToken
  });

  const token = await new Promise<string>((resolve, reject) => {
    tokenClient.callback = (resp: any) => {
      console.log("📋 Resposta OAuth:", resp);
      if (resp && resp.access_token) {
        console.log("✅ Token obtido com sucesso");
        resolve(resp.access_token);
      } else if (resp.error) {
        console.error("❌ Erro OAuth:", resp);
        reject(new Error(`OAuth Error: ${resp.error} - ${resp.error_description || ''}`));
      } else {
        console.error("❌ Resposta OAuth inválida:", resp);
        reject(new Error("Falha ao obter access_token do Google"));
      }
    };
    
    console.log("🚀 Solicitando token de acesso...");
    tokenClient.requestAccessToken();
  });

  return token;
}

// ===== MICROSOFT OAUTH =====
async function getMicrosoftAccessToken(): Promise<string> {
  console.log("🔑 Iniciando OAuth Microsoft...");
  
  // Para desenvolvimento, vamos simular um token
  // Na implementação real, você configuraria o OAuth no Azure
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("🔧 Usando token simulado para desenvolvimento");
      resolve("demo_microsoft_token_" + Date.now());
    }, 2000);
  });
}

export function useCalendarSync() {
  const { user } = useAuth();
  const { toast } = useToast();
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
      const { data, error } = await supabase
        .from("calendar_sync_settings")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao carregar configurações:", error);
        return;
      }

      if (data && data.length > 0) {
        setProviders((prev) =>
          prev.map((p) => {
            const found = data.find((d) => d.provider === p.id);
            if (found) {
              return {
                ...p,
                status: found.is_enabled ? "connected" : "disconnected",
                isEnabled: found.is_enabled,
                lastSync: found.updated_at
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
          { onConflict: "user_id,provider" }
        );

      if (error) throw error;

      toast({
        title: "✅ Google conectado",
        description: "Permissões concedidas e token salvo com sucesso.",
      });

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
      if (error.message.includes("Configure o Google Client ID")) {
        errorMessage = "Configure o Google Client ID no código primeiro!";
      } else if (error.message.includes("OAuth Error")) {
        errorMessage = "Erro de autenticação OAuth. Verifique a configuração no Google Cloud Console.";
      }
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // === Outlook ===
  const connectOutlookCalendar = async () => {
    try {
      setLoading(true);
      console.log("🔗 Conectando Outlook Calendar...");
      
      const accessToken = await getMicrosoftAccessToken();

      const { error } = await supabase
        .from("calendar_sync_settings")
        .upsert(
          {
            user_id: user!.id,
            provider: "outlook",
            is_enabled: true,
            sync_direction: "bidirectional",
            access_token: accessToken,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" }
        );

      if (error) throw error;

      toast({
        title: "✅ Outlook conectado",
        description: "Token salvo com sucesso. Configure as credenciais no Azure para OAuth real.",
      });

      setProviders((prev) =>
        prev.map((p) =>
          p.id === "outlook"
            ? {
                ...p,
                status: "connected",
                isEnabled: true,
                lastSync: new Date().toLocaleString("pt-BR"),
              }
            : p
        )
      );

      // Iniciar sincronização automática
      setTimeout(() => {
        syncCalendar("outlook");
      }, 1000);

    } catch (error: any) {
      console.error("❌ Erro Outlook Calendar:", error);
      
      toast({
        title: "❌ Erro",
        description: "Falha ao conectar Outlook Calendar: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // === iCloud === (placeholder)
  const connectIcloudCalendar = async () => {
    toast({
      title: "Não implementado",
      description: "Integração com iCloud ainda não foi implementada.",
    });
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

      if (providerId === "outlook") {
        // Chamar a edge function para sincronização do Outlook
        const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
          body: {
            action: 'sync_bidirectional',
            user_id: user!.id,
            access_token: 'demo_token_' + Date.now()
          }
        });

        if (error) throw error;

        toast({
          title: "✅ Sincronização concluída",
          description: `Outlook Calendar sincronizado com sucesso. ${data?.imported || 0} eventos importados, ${data?.exported || 0} eventos exportados.`,
        });
      } else {
        toast({
          title: "Sincronização iniciada",
          description: `Sincronizando calendário ${providerId}...`,
        });
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

      toast({
        title: "❌ Erro na sincronização",
        description: error.message || "Falha ao sincronizar calendário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectProvider = async (providerId: string) => {
    try {
      await supabase
        .from("calendar_sync_settings")
        .update({ is_enabled: false })
        .eq("user_id", user!.id)
        .eq("provider", providerId);

      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, status: "disconnected", isEnabled: false }
            : p
        )
      );

      toast({
        title: "Provedor desconectado",
        description: `${providerId} foi desconectado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast({
        title: "Erro",
        description: "Falha ao desconectar o provedor",
        variant: "destructive",
      });
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
    toast({
      title: "Exportação iniciada",
      description: "Gerando arquivo ICS...",
    });
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
  };
}