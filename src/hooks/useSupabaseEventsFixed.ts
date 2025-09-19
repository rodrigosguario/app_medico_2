import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status: string;
  value?: number | null;
  location?: string;
  description?: string;
  calendar_id?: string;
  hospital_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateEventData {
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status?: string;
  value?: number | null;
  location?: string;
  description?: string;
  calendar_id?: string;
  hospital_id?: string;
  user_id: string;
}

export const useSupabaseEventsFixed = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Função para buscar eventos
  const fetchEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando eventos para o usuário:', user.id);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          calendars(name, color),
          hospitals(name, address)
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (fetchError) {
        console.error('❌ Erro ao buscar eventos:', fetchError);
        setError(fetchError.message);
        
        // Mostrar erro específico baseado no tipo
        if (fetchError.message.includes('Invalid API key')) {
          setError('Configuração do Supabase inválida. Verifique as chaves de API.');
        } else if (fetchError.message.includes('relation "events" does not exist')) {
          setError('Tabela de eventos não encontrada. Verifique a estrutura do banco.');
        } else {
          setError(`Erro ao carregar eventos: ${fetchError.message}`);
        }
      } else {
        console.log('✅ Eventos carregados:', data?.length || 0);
        setEvents(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('💥 Erro inesperado ao buscar eventos:', err);
      setError('Erro inesperado ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar evento
  const createEvent = async (eventData: CreateEventData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('📝 Criando evento:', eventData);

      // Validação dos dados obrigatórios
      if (!eventData.title || !eventData.start_date || !eventData.end_date) {
        throw new Error('Título, data de início e data de fim são obrigatórios');
      }

      // Garantir que as datas estão no formato correto
      const startDate = new Date(eventData.start_date);
      const endDate = new Date(eventData.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Formato de data inválido');
      }

      if (startDate >= endDate) {
        throw new Error('A data de início deve ser anterior à data de fim');
      }

      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          user_id: user.id,
          status: eventData.status || 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar evento:', error);
        throw new Error(`Erro ao criar evento: ${error.message}`);
      }

      console.log('✅ Evento criado com sucesso:', data);
      
      // Atualizar a lista de eventos
      await fetchEvents();
      
      return data;
    } catch (err) {
      console.error('💥 Erro inesperado ao criar evento:', err);
      throw err;
    }
  };

  // Função para atualizar evento
  const updateEvent = async (eventId: string, eventData: Partial<CreateEventData>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('📝 Atualizando evento:', eventId, eventData);

      const updateData = {
        ...eventData,
        updated_at: new Date().toISOString()
      };

      // Se houver datas, garantir que estão no formato correto
      if (eventData.start_date) {
        updateData.start_date = new Date(eventData.start_date).toISOString();
      }
      if (eventData.end_date) {
        updateData.end_date = new Date(eventData.end_date).toISOString();
      }

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar evento:', error);
        throw new Error(`Erro ao atualizar evento: ${error.message}`);
      }

      console.log('✅ Evento atualizado com sucesso:', data);
      
      // Atualizar a lista de eventos
      await fetchEvents();
      
      return data;
    } catch (err) {
      console.error('💥 Erro inesperado ao atualizar evento:', err);
      throw err;
    }
  };

  // Função para deletar evento
  const deleteEvent = async (eventId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🗑️ Deletando evento:', eventId);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro ao deletar evento:', error);
        throw new Error(`Erro ao deletar evento: ${error.message}`);
      }

      console.log('✅ Evento deletado com sucesso');
      
      // Atualizar a lista de eventos
      await fetchEvents();
      
    } catch (err) {
      console.error('💥 Erro inesperado ao deletar evento:', err);
      throw err;
    }
  };

  // Carregar eventos quando o usuário mudar
  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Configurar realtime subscription para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configurando subscription em tempo real para eventos');

    const subscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Mudança detectada nos eventos:', payload);
          fetchEvents(); // Recarregar eventos quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando subscription de eventos');
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents
  };
};
