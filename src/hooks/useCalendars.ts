import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';

// Temporary types until Supabase types are regenerated
type Calendar = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CalendarInsert = Omit<Calendar, 'id' | 'created_at' | 'updated_at'>;
type CalendarUpdate = Partial<Omit<Calendar, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

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
        console.log('👤 Usuário não encontrado, limpando calendários');
        setCalendars([]);
        return;
      }

      console.log('🔄 Carregando calendários para usuário:', user.id);

      const { data, error: supabaseError } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      console.log('📋 Resposta dos calendários:', { data, error: supabaseError });

      if (supabaseError) throw supabaseError;

      if (data) {
        // If no calendars exist, create a default one
        if (data.length === 0) {
          console.log('🆕 Nenhum calendário encontrado, criando padrão...');
          const { data: newCalendar, error: createError } = await supabase
            .from('calendars')
            .insert([{
              user_id: user.id,
              name: 'Meu Calendário',
              description: 'Calendário padrão',
              color: '#3B82F6',
              is_active: true
            }])
            .select('*')
            .single();

          if (createError) {
            throw createError;
          }
          
          if (newCalendar) {
            setCalendars([newCalendar]);
          }
        } else {
          setCalendars(data);
        }
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