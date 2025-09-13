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

  const loadFinancialEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (syncStatus.isOnline) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error: supabaseError } = await supabase
          .from('financial_events')
          .select('*')
          .eq('user_id', user.data.user.id)
          .order('date', { ascending: false });

        if (supabaseError) throw supabaseError;

        if (data) {
          setFinancialEvents(data);
        }
      }
    } catch (error) {
      console.error('Error loading financial events:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar eventos financeiros');
    } finally {
      setLoading(false);
    }
  };

  const createFinancialEvent = async (eventData: Omit<FinancialEventInsert, 'user_id'>) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuário não autenticado');
      }

      const fullEventData = {
        ...eventData,
        user_id: user.data.user.id
      };

      const { data, error } = await supabase
        .from('financial_events')
        .insert([fullEventData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFinancialEvents(prev => [data, ...prev]);
      }

      return data;
    } catch (error) {
      console.error('Error creating financial event:', error);
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
    }
  }, [syncStatus.isOnline]);

  return {
    financialEvents,
    loading,
    error,
    createFinancialEvent,
    updateFinancialEvent,
    deleteFinancialEvent,
    refreshFinancialEvents: loadFinancialEvents
  };
};