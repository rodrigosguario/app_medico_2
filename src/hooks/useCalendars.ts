import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import type { Database } from '@/integrations/supabase/types';

type Calendar = Database['public']['Tables']['calendars']['Row'];
type CalendarInsert = Database['public']['Tables']['calendars']['Insert'];
type CalendarUpdate = Database['public']['Tables']['calendars']['Update'];

export const useCalendars = () => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadCalendars = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setCalendars([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;

      if (data) {
        setCalendars(data);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar calendários');
    } finally {
      setLoading(false);
    }
  };

  const createCalendar = async (calendarData: Omit<CalendarInsert, 'user_id'>) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const fullCalendarData = {
        ...calendarData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('calendars')
        .insert([fullCalendarData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCalendars(prev => [...prev, data]);
      }

      return data;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw error;
    }
  };

  const updateCalendar = async (id: string, updates: CalendarUpdate) => {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCalendars(prev => prev.map(calendar => 
          calendar.id === id ? data : calendar
        ));
      }

      return data;
    } catch (error) {
      console.error('Error updating calendar:', error);
      throw error;
    }
  };

  const deleteCalendar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCalendars(prev => prev.filter(calendar => calendar.id !== id));
    } catch (error) {
      console.error('Error deleting calendar:', error);
      throw error;
    }
  };

  const getDefaultCalendar = () => {
    return calendars.find(cal => cal.is_active) || calendars[0] || null;
  };

  useEffect(() => {
    if (user) {
      loadCalendars();
    }
  }, [user]);

  return {
    calendars,
    loading,
    error,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    getDefaultCalendar,
    refreshCalendars: loadCalendars
  };
};