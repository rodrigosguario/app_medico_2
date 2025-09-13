import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';

type SyncDirection = 'import' | 'export' | 'bidirectional';
type SyncStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

interface SyncProvider {
  id: string;
  name: string;
  icon: string;
  status: SyncStatus;
  lastSync?: string;
  eventsCount?: number;
  isEnabled?: boolean;
  syncDirection?: SyncDirection;
}

interface SyncSettings {
  id: string;
  provider: string;
  is_enabled: boolean;
  sync_direction: string;
  last_sync?: string;
  sync_frequency_minutes: number;
}

export const useCalendarSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<SyncProvider[]>([
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      status: 'disconnected',
      syncDirection: 'bidirectional'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📧',
      status: 'disconnected',
      syncDirection: 'bidirectional'
    },
    {
      id: 'icloud',
      name: 'iCloud Calendar',
      icon: '☁️',
      status: 'disconnected',
      syncDirection: 'import'
    }
  ]);
  
  const [syncSettings, setSyncSettings] = useState<SyncSettings[]>([]);
  const [loading, setLoading] = useState(false);

  // Load sync settings on component mount
  useEffect(() => {
    if (user) {
      loadSyncSettings();
    }
  }, [user]);

  const loadSyncSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      setSyncSettings(data || []);
      
      // Update providers status based on settings
      setProviders(prev => prev.map(provider => {
        const setting = data?.find(s => s.provider === provider.id);
        const validSyncDirection = ['import', 'export', 'bidirectional'].includes(setting?.sync_direction || '') 
          ? (setting?.sync_direction as SyncDirection)
          : 'bidirectional';
        
        return {
          ...provider,
          status: setting?.is_enabled ? 'connected' : 'disconnected',
          isEnabled: setting?.is_enabled || false,
          lastSync: setting?.last_sync,
          syncDirection: validSyncDirection
        };
      }));
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      toast({
        title: 'Configuração necessária',
        description: 'Configure as credenciais OAuth no Google Cloud Console primeiro',
        variant: 'default'
      });
      
      // For production, implement OAuth flow
      console.log('Google Calendar connection would be implemented here');
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com Google Calendar',
        variant: 'destructive'
      });
    }
  };

  const connectOutlookCalendar = async () => {
    try {
      toast({
        title: 'Configuração necessária',
        description: 'Configure as credenciais OAuth no Azure Portal primeiro',
        variant: 'default'
      });
      
      // For production, implement OAuth flow
      console.log('Outlook Calendar connection would be implemented here');
    } catch (error) {
      console.error('Error connecting Outlook Calendar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com Outlook Calendar',
        variant: 'destructive'
      });
    }
  };

  const syncCalendar = async (providerId: string, accessToken: string, action: SyncDirection = 'bidirectional') => {
    if (!user) return;

    setLoading(true);
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, status: 'syncing' } : p));

    try {
      const functionName = providerId === 'google' ? 'google-calendar-sync' : 'outlook-calendar-sync';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: action === 'bidirectional' ? 'sync_bidirectional' : `${action}_events`,
          [`${providerId}AccessToken`]: accessToken,
          userId: user.id
        }
      });

      if (error) throw error;

      // Update sync settings
      await updateSyncSettings(providerId, {
        is_enabled: true,
        last_sync: new Date().toISOString(),
        sync_direction: action
      });

      // Update provider status
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { 
              ...p, 
              status: 'connected', 
              lastSync: new Date().toLocaleString('pt-BR'),
              eventsCount: data.imported || data.exported || 0
            } 
          : p
      ));

      toast({
        title: 'Sincronização concluída',
        description: data.message || `Calendário ${providerId} sincronizado com sucesso`,
      });

    } catch (error) {
      console.error(`Error syncing ${providerId}:`, error);
      
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, status: 'error' } : p));
      
      toast({
        title: 'Erro na sincronização',
        description: `Falha ao sincronizar com ${providerId}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSyncSettings = async (provider: string, updates: Partial<SyncSettings>) => {
    try {
      const existingSetting = syncSettings.find(s => s.provider === provider);
      
      if (existingSetting) {
        const { error } = await supabase
          .from('calendar_sync_settings')
          .update(updates)
          .eq('id', existingSetting.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendar_sync_settings')
          .insert([{
            user_id: user?.id,
            provider,
            ...updates
          }]);
        
        if (error) throw error;
      }
      
      await loadSyncSettings();
    } catch (error) {
      console.error('Error updating sync settings:', error);
    }
  };

  const disconnectProvider = async (providerId: string) => {
    try {
      await updateSyncSettings(providerId, { is_enabled: false });
      
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, status: 'disconnected', isEnabled: false, lastSync: undefined }
          : p
      ));

      toast({
        title: 'Desconectado',
        description: `${providerId} foi desconectado com sucesso`,
      });
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar o provedor',
        variant: 'destructive'
      });
    }
  };

  const getSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync history:', error);
      return [];
    }
  };

  const exportToICS = async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MedicoAgenda//Calendar//PT',
        'CALSCALE:GREGORIAN'
      ].join('\n') + '\n';

      events?.forEach(event => {
        const startDate = new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent += [
          'BEGIN:VEVENT',
          `UID:${event.id}@medicoagenda.com`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description || ''}`,
          `LOCATION:${event.location || ''}`,
          `STATUS:${event.status?.toUpperCase()}`,
          `CATEGORIES:${event.event_type}`,
          'END:VEVENT'
        ].join('\n') + '\n';
      });

      icsContent += 'END:VCALENDAR';

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicoagenda-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: 'Arquivo ICS baixado com sucesso',
      });
    } catch (error) {
      console.error('Error exporting to ICS:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Falha ao exportar calendário',
        variant: 'destructive'
      });
    }
  };

  return {
    providers,
    syncSettings,
    loading,
    connectGoogleCalendar,
    connectOutlookCalendar,
    syncCalendar,
    disconnectProvider,
    updateSyncSettings,
    getSyncHistory,
    exportToICS,
    loadSyncSettings
  };
};