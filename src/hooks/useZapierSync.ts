import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EventData {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: string;
  description?: string;
  value?: number;
  status?: string;
}

export const useZapierSync = () => {
  const { toast } = useToast();

  const triggerZapierWebhook = useCallback(async (
    action: 'create' | 'update' | 'delete',
    eventData: EventData
  ) => {
    const webhookUrl = localStorage.getItem('zapier_webhook_url');
    const syncEnabled = localStorage.getItem('zapier_sync_enabled') === 'true';

    if (!webhookUrl || !syncEnabled) {
      return;
    }

    try {
      const payload = {
        action,
        event: eventData,
        timestamp: new Date().toISOString(),
        source: 'MediSync',
        user_id: 'current_user' // Pode ser substituído pelo ID real do usuário
      };

      console.log(`Enviando evento ${action} para Zapier:`, payload);

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      // Não mostramos toast para cada sincronização automática para não ser intrusivo
      console.log(`Evento ${action} sincronizado com sucesso via Zapier`);
    } catch (error) {
      console.error('Erro ao sincronizar com Zapier:', error);
      
      // Só mostra erro se for algo crítico
      if (error instanceof TypeError) {
        toast({
          title: 'Erro de Sincronização',
          description: 'Falha ao sincronizar com Zapier. Verifique sua conexão.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const syncCreateEvent = useCallback((eventData: EventData) => {
    triggerZapierWebhook('create', eventData);
  }, [triggerZapierWebhook]);

  const syncUpdateEvent = useCallback((eventData: EventData) => {
    triggerZapierWebhook('update', eventData);
  }, [triggerZapierWebhook]);

  const syncDeleteEvent = useCallback((eventData: EventData) => {
    triggerZapierWebhook('delete', eventData);
  }, [triggerZapierWebhook]);

  return {
    syncCreateEvent,
    syncUpdateEvent,
    syncDeleteEvent,
  };
};