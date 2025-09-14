import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSync } from './useSupabaseSync';

// Temporary types until Supabase types are regenerated
type FinancialEvent = {
  id: string;
  user_id: string;
  event_id?: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  date: string;
  type: string; // Changed from 'income' | 'expense' to string for compatibility
  category?: string;
  status: string;
  is_paid?: boolean;
  payment_method?: string;
  created_at: string;
  updated_at: string;
};

type FinancialEventInsert = Omit<FinancialEvent, 'id' | 'created_at' | 'updated_at'>;
type FinancialEventUpdate = Partial<Omit<FinancialEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export const useFinancialEvents = () => {
  const [financialEvents, setFinancialEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncStatus } = useSupabaseSync();

  const syncEventsToFinancial = async () => {
    try {
      console.log('🔄 Sincronizando eventos para financeiro...');
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Buscar eventos com valor
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.data.user.id)
        .not('value', 'is', null)
        .gt('value', 0);

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        console.log('📋 Nenhum evento com valor encontrado');
        return;
      }

      // Verificar quais eventos já existem na tabela financial_events
      const { data: existingFinancial, error: financialError } = await supabase
        .from('financial_events')
        .select('event_id')
        .eq('user_id', user.data.user.id)
        .not('event_id', 'is', null);

      if (financialError) throw financialError;

      const existingEventIds = new Set(existingFinancial?.map(f => f.event_id) || []);

      // Criar transações financeiras para eventos que ainda não existem
      const eventsToSync = events.filter(event => !existingEventIds.has(event.id));
      
      if (eventsToSync.length === 0) {
        console.log('✅ Todos os eventos já estão sincronizados');
        return;
      }

      console.log(`💰 Sincronizando ${eventsToSync.length} eventos`);

      const financialEventsToInsert = eventsToSync.map(event => ({
        user_id: user.data.user.id,
        event_id: event.id,
        title: `Plantão - ${event.title}`,
        description: event.description || `Plantão de ${event.event_type || 'medicina'} realizado`,
        amount: Number(event.value),
        currency: 'BRL',
        date: event.start_date.split('T')[0], // Extrair apenas a data
        type: 'income',
        category: event.event_type || 'plantao',
        status: 'confirmed',
        is_paid: true,
        payment_method: 'transferencia'
      }));

      const { error: insertError } = await supabase
        .from('financial_events')
        .insert(financialEventsToInsert);

      if (insertError) throw insertError;

      console.log(`✅ ${financialEventsToInsert.length} eventos sincronizados com sucesso`);
      
      // Recarregar dados financeiros
      await loadFinancialEvents();
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar eventos:', error);
    }
  };

  const loadFinancialEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading financial events...');

      if (syncStatus.isOnline) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          throw new Error('Usuário não autenticado');
        }

        console.log('👤 User authenticated:', user.data.user.id);

        const { data, error: supabaseError } = await supabase
          .from('financial_events')
          .select('*')
          .eq('user_id', user.data.user.id)
          .order('date', { ascending: false });

        if (supabaseError) throw supabaseError;

        console.log('💰 Financial events loaded:', data?.length || 0, 'items');

        if (data) {
          setFinancialEvents(data);
        }
      }
    } catch (error) {
      console.error('❌ Error loading financial events:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar eventos financeiros');
    } finally {
      setLoading(false);
      console.log('✅ Financial events loading completed');
    }
  };

  const createFinancialEvent = async (eventData: Omit<FinancialEventInsert, 'user_id'>) => {
    try {
      console.log('💰 Creating financial event:', eventData);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuário não autenticado');
      }

      const fullEventData = {
        ...eventData,
        user_id: user.data.user.id
      };

      console.log('📝 Full event data:', fullEventData);

      const { data, error } = await supabase
        .from('financial_events')
        .insert([fullEventData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Financial event created successfully:', data);

      if (data) {
        setFinancialEvents(prev => [data, ...prev]);
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating financial event:', error);
      throw error;
    }
  };

  const updateFinancialEvent = async (id: string, updates: FinancialEventUpdate) => {
    try {
      const { data, error } = await supabase
        .from('financial_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFinancialEvents(prev => prev.map(event => 
          event.id === id ? data : event
        ));
      }

      return data;
    } catch (error) {
      console.error('Error updating financial event:', error);
      throw error;
    }
  };

  const deleteFinancialEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFinancialEvents(prev => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting financial event:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (syncStatus.isOnline) {
      loadFinancialEvents();
      // Sincronizar eventos automaticamente após carregar
      syncEventsToFinancial();
    }
  }, [syncStatus.isOnline]);

  return {
    financialEvents,
    loading,
    error,
    createFinancialEvent,
    updateFinancialEvent,
    deleteFinancialEvent,
    refreshFinancialEvents: loadFinancialEvents,
    syncEventsToFinancial
  };
};