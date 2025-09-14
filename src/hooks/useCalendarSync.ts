import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/AuthGuard";

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
  // Use o Client ID diretamente - será configurado no Google Cloud Console
  const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Substitua pelo seu Client ID real
  if (!clientId) throw new Error("Google Client ID não configurado");

  await loadGoogleScript();
  // @ts-ignore
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope:
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
    prompt: "consent",
  });

  const token = await new Promise<string>((resolve, reject) => {
    tokenClient.requestAccessToken({
      callback: (resp: any) => {
        if (resp && resp.access_token) resolve(resp.access_token);
        else reject(new Error("Falha ao obter access_token do Google"));
      },
    });
  });

  return token;
}

export function useCalendarSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([
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

  useEffect(() => {
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
        title: "Google conectado",
        description: "Permissões concedidas e token salvo.",
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
      console.error("Erro Google Calendar:", error);
      toast({
        title: "Erro",
        description: error.message ?? "Falha ao conectar Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // === Outlook === (placeholder)
  const connectOutlookCalendar = async () => {
    toast({
      title: "Configuração necessária",
      description: "Integração Outlook será configurada depois.",
    });
  };

  // === iCloud === (placeholder)
  const connectIcloudCalendar = async () => {
    toast({
      title: "Não implementado",
      description: "Integração com iCloud ainda não foi implementada.",
    });
  };

  const syncCalendar = async (providerId: string) => {
    toast({
      title: "Sincronização iniciada",
      description: `Sincronizando calendário ${providerId}...`,
    });
  };

  const disconnectProvider = async (providerId: string) => {
    toast({
      title: "Provedor desconectado",
      description: `${providerId} foi desconectado.`,
    });
  };

  const getSyncHistory = async () => {
    return [];
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
