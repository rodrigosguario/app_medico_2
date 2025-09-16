import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/utils/offlineStorage';
import { useSupabaseSync } from './useSupabaseSync';
import { useZapierSync } from './useZapierSync';
import type { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

export const useSupabaseEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addOfflineAction, syncStatus } = useSupabaseSync();
  const { syncCreateEvent, syncUpdateEvent, syncDeleteEvent } = useZapierSync();

  // Load events from Supabase or offline storage
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify user session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro de sessão:', sessionError);
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      if (syncStatus.isOnline) {
        console.log('🔄 Carregando eventos do Supabase...');
        
        const { data, error: supabaseError } = await supabase
          .from('events')
          .select(`
            *,
            calendars(name, color),
            hospitals(name, address)
          `)
          .eq('user_id', session.user.id)
          .order('start_date', { ascending: true });

        if (supabaseError) {
          console.error('❌ Erro ao carregar eventos:', supabaseError);
          
          // Handle specific errors
          if (supabaseError.code === 'PGRST301' || supabaseError.message.includes('JWT')) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          
          throw supabaseError;
        }

        console.log('✅ Eventos carregados:', data?.length || 0);
        
        if (data) {
          setEvents(data as Event[]);
          // Cache events for offline access
          offlineStorage.saveData('events', data);
          offlineStorage.markAsSynced('events');
        }
      } else {
        console.log('📱 Carregando eventos do cache offline...');
        // Load from offline storage
        const cachedEvents = offlineStorage.getData<Event[]>('events');
        if (cachedEvents) {
          setEvents(cachedEvents);
        }
      }
    } catch (error) {
      console.error('💥 Erro ao carregar eventos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar eventos';
      setError(errorMessage);
      
      // Fallback to cached data only if it's not an auth error
      if (!errorMessage.includes('login') && !errorMessage.includes('Sessão')) {
        const cachedEvents = offlineStorage.getData<Event[]>('events');
        if (cachedEvents) {
          setEvents(cachedEvents);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<EventInsert, 'user_id' | 'calendar_id'>) => {
    try {
      console.log('🆕 Criando evento...', eventData);
      
      // Verify user session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro de sessão ao criar evento:', sessionError);
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      // Get user's default calendar
      console.log('📅 Buscando calendário padrão...');
      let { data: calendar, error: calendarError } = await supabase
        .from('calendars')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (calendarError) {
        console.error('❌ Erro ao buscar calendário:', calendarError);
        throw new Error('Erro ao buscar calendário: ' + calendarError.message);
      }

      // If no active calendar exists, create a default one
      if (!calendar) {
        console.log('🆕 Criando calendário padrão...');
        const { data: newCalendar, error: createError } = await supabase
          .from('calendars')
          .insert([{
            user_id: session.user.id,
            name: 'Meu Calendário',
            description: 'Calendário padrão',
            color: '#3B82F6',
            is_active: true
          }])
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Erro ao criar calendário padrão:', createError);
          throw new Error('Erro ao criar calendário padrão: ' + createError.message);
        }
        calendar = newCalendar;
      }

      const fullEventData = {
        ...eventData,
        user_id: session.user.id,
        calendar_id: calendar.id
      };

      console.log('💾 Salvando evento no Supabase...', fullEventData);

      if (syncStatus.isOnline) {
        const { data, error } = await supabase
          .from('events')
          .insert([fullEventData])
          .select(`
            *,
            calendars(name, color),
            hospitals(name, address)
          `)
          .single();

        if (error) {
          console.error('❌ Erro ao inserir evento:', error);
          
          // Handle specific errors
          if (error.code === 'PGRST301' || error.message.includes('JWT')) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          
          throw error;
        }

        if (data) {
          console.log('✅ Evento criado com sucesso:', data.id);
          setEvents(prev => [...prev, data]);
          // Update cache
          const updatedEvents = [...events, data];
          offlineStorage.saveData('events', updatedEvents);
          
          // Sincronizar com Zapier
          try {
            await syncCreateEvent({
              id: data.id,
              title: data.title,
              start_time: data.start_date,
              end_time: data.end_date,
              event_type: data.event_type,
              location: data.location || '',
              description: data.description || '',
              value: data.value || 0,
              status: data.status || 'CONFIRMADO'
            });
          } catch (zapierError) {
            console.warn('⚠️ Erro na sincronização Zapier:', zapierError);
            // Don't fail the creation if Zapier sync fails
          }
        }
      } else {
        console.log('📱 Adicionando evento para sincronização offline...');
        // Add to pending actions for later sync
        addOfflineAction('CREATE', 'event', fullEventData);
        
        // Add optimistically to local state with temp ID
        const tempEvent: Event = {
          ...fullEventData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Event;
        
        setEvents(prev => [...prev, tempEvent]);
      }
    } catch (error) {
      console.error('💥 Erro ao criar evento:', error);
      throw error;
    }
  };

  // Update event
  const updateEvent = async (id: string, updates: EventUpdate) => {
    try {
      if (syncStatus.isOnline) {
        const { data, error } = await supabase
          .from('events')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setEvents(prev => prev.map(event => 
            event.id === id ? data : event
          ));
          // Update cache
          const updatedEvents = events.map(event => 
            event.id === id ? data : event
          );
          offlineStorage.saveData('events', updatedEvents);
          
          // Sincronizar com Zapier
          syncUpdateEvent({
            id: data.id,
            title: data.title,
            start_time: data.start_date,
            end_time: data.end_date,
            event_type: data.event_type,
            location: data.location || '',
            description: data.description || '',
            value: data.value || 0,
            status: data.status || 'CONFIRMADO'
          });
        }
      } else {
        // Add to pending actions
        addOfflineAction('UPDATE', 'event', { id, ...updates });
        
        // Update optimistically
        setEvents(prev => prev.map(event => 
          event.id === id ? { ...event, ...updates } : event
        ));
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      if (syncStatus.isOnline) {
        // Obter o evento antes de deletar para sincronizar
        const eventToDelete = events.find(event => event.id === id);
        
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEvents(prev => prev.filter(event => event.id !== id));
        // Update cache
        const updatedEvents = events.filter(event => event.id !== id);
        offlineStorage.saveData('events', updatedEvents);
        
        // Sincronizar com Zapier se o evento foi encontrado
        if (eventToDelete) {
          syncDeleteEvent({
            id: eventToDelete.id,
            title: eventToDelete.title,
            start_time: eventToDelete.start_date,
            end_time: eventToDelete.end_date,
            event_type: eventToDelete.event_type,
            location: eventToDelete.location || '',
            description: eventToDelete.description || '',
            value: eventToDelete.value || 0,
            status: eventToDelete.status || 'CONFIRMADO'
          });
        }
      } else {
        // Add to pending actions
        addOfflineAction('DELETE', 'event', { id });
        
        // Remove optimistically
        setEvents(prev => prev.filter(event => event.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!syncStatus.isOnline) return;

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Real-time event change:', payload);
          // Reload events when changes occur
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncStatus.isOnline]);

  // Load events on mount and when online status changes
  useEffect(() => {
    // Add a small delay to ensure auth is ready
    const timeoutId = setTimeout(() => {
      loadEvents();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [syncStatus.isOnline]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: loadEvents
  };
};