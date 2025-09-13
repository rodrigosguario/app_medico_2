import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, type PendingAction } from '@/utils/offlineStorage';
import { toast } from 'sonner';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingActions: number;
  error: string | null;
}

export const useSupabaseSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingActions: 0,
    error: null
  });

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true, error: null }));
      // Auto-sync when coming back online
      if (offlineStorage.getPendingActions().length > 0) {
        syncPendingActions();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial stats
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateSyncStatus = useCallback(() => {
    const stats = offlineStorage.getStorageStats();
    setSyncStatus(prev => ({
      ...prev,
      lastSync: stats.lastSync,
      pendingActions: stats.pendingActions
    }));
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus(prev => ({ ...prev, error: 'Sem conexão com a internet' }));
      return false;
    }

    const pendingActions = offlineStorage.getPendingActions();
    if (pendingActions.length === 0) {
      return true;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      let syncedCount = 0;
      const errors: string[] = [];

      for (const action of pendingActions) {
        try {
          await executePendingAction(action);
          offlineStorage.removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error('Error executing pending action:', error);
          errors.push(`${action.type} ${action.resource}: ${error}`);
        }
      }

      if (errors.length === 0) {
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date(),
          pendingActions: 0,
          error: null
        }));
        toast.success(`${syncedCount} ações sincronizadas com sucesso!`);
        return true;
      } else {
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          pendingActions: pendingActions.length - syncedCount,
          error: `Alguns itens não foram sincronizados: ${errors.slice(0, 2).join(', ')}`
        }));
        toast.warning(`${syncedCount} itens sincronizados, ${errors.length} com erro`);
        return false;
      }

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização'
      }));
      toast.error('Erro na sincronização');
      return false;
    }
  }, []);

  const executePendingAction = async (action: PendingAction): Promise<void> => {
    const { type, resource, data } = action;

    switch (resource.toLowerCase()) {
      case 'event':
        await syncEvent(type, data);
        break;
      case 'calendar':
        await syncCalendar(type, data);
        break;
      case 'financial_event':
        await syncFinancialEvent(type, data);
        break;
      case 'profile':
        await syncProfile(type, data);
        break;
      default:
        throw new Error(`Tipo de recurso não suportado: ${resource}`);
    }
  };

  const syncEvent = async (type: PendingAction['type'], data: any) => {
    switch (type) {
      case 'CREATE':
        const { error: createError } = await supabase
          .from('events')
          .insert([{
            ...data,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);
        if (createError) throw createError;
        break;

      case 'UPDATE':
        const { error: updateError } = await supabase
          .from('events')
          .update(data)
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (deleteError) throw deleteError;
        break;
    }
  };

  const syncCalendar = async (type: PendingAction['type'], data: any) => {
    switch (type) {
      case 'CREATE':
        const { error: createError } = await supabase
          .from('calendars')
          .insert([{
            ...data,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);
        if (createError) throw createError;
        break;

      case 'UPDATE':
        const { error: updateError } = await supabase
          .from('calendars')
          .update(data)
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('calendars')
          .delete()
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (deleteError) throw deleteError;
        break;
    }
  };

  const syncFinancialEvent = async (type: PendingAction['type'], data: any) => {
    switch (type) {
      case 'CREATE':
        const { error: createError } = await supabase
          .from('financial_events')
          .insert([{
            ...data,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);
        if (createError) throw createError;
        break;

      case 'UPDATE':
        const { error: updateError } = await supabase
          .from('financial_events')
          .update(data)
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('financial_events')
          .delete()
          .eq('id', data.id)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (deleteError) throw deleteError;
        break;
    }
  };

  const syncProfile = async (type: PendingAction['type'], data: any) => {
    switch (type) {
      case 'UPDATE':
        const { error: updateError } = await supabase
          .from('profiles')
          .update(data)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        if (updateError) throw updateError;
        break;
    }
  };

  const addOfflineAction = useCallback((
    type: PendingAction['type'],
    resource: string,
    data: any
  ) => {
    try {
      const actionId = offlineStorage.addPendingAction({ type, resource, data });
      updateSyncStatus();
      
      // Try to sync immediately if online
      if (navigator.onLine) {
        setTimeout(() => syncPendingActions(), 1000);
      }
      
      return actionId;
    } catch (error) {
      console.error('Error adding offline action:', error);
      throw error;
    }
  }, [syncPendingActions, updateSyncStatus]);

  const clearOfflineData = useCallback(() => {
    offlineStorage.clearAllData();
    updateSyncStatus();
    toast.success('Dados offline limpos');
  }, [updateSyncStatus]);

  return {
    syncStatus,
    syncPendingActions,
    addOfflineAction,
    clearOfflineData,
    updateSyncStatus
  };
};