import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
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
  tax_type?: string | null;
  tax_rate?: number | null;
}

export function useEventActions() {
  const { toast } = useToast();
  const [copiedEvent, setCopiedEvent] = useState<CalendarEvent | null>(null);

  // Função para atualizar status automaticamente baseado na data
  const updateEventStatusBasedOnDate = (event: CalendarEvent): CalendarEvent => {
    const eventEndDate = new Date(event.end_date);
    
    // Se o evento já terminou e não está marcado como realizado ou cancelado
    if (isPast(eventEndDate) && event.status !== 'completed' && event.status !== 'cancelled') {
      return { ...event, status: 'completed' };
    }
    
    return event;
  };

  // Função para copiar evento
  const handleCopyEvent = (event: CalendarEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCopiedEvent(event);
    toast({
      title: "Evento copiado",
      description: `"${event.title}" foi copiado. Clique em uma data para colar.`
    });
  };

  // Função para colar evento em uma data específica
  const handlePasteEvent = async (targetDate: Date, createEvent: Function, profile: any) => {
    if (!copiedEvent) return;

    try {
      const originalStart = new Date(copiedEvent.start_date);
      const originalEnd = new Date(copiedEvent.end_date);
      const duration = originalEnd.getTime() - originalStart.getTime();

      // Manter o mesmo horário, mas na nova data
      const newStartDate = new Date(targetDate);
      newStartDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
      
      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Mapeamento de status para compatibilidade com o banco
      const statusMapping = {
        'completed': 'confirmed',
        'confirmed': 'confirmed',
        'tentative': 'tentative', 
        'pending': 'pending',
        'cancelled': 'cancelled'
      };

      const eventTypeMapping = {
        'plantao': 'plantao',
        'consulta': 'consulta',
        'procedimento': 'procedimento',
        'academico': 'academico',
        'reuniao': 'reuniao',
        'administrativo': 'administrativo'
      };

      const newEventData = {
        title: copiedEvent.title,
        event_type: eventTypeMapping[copiedEvent.event_type as keyof typeof eventTypeMapping] || 'plantao',
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString(),
        location: copiedEvent.location,
        description: copiedEvent.description,
        value: copiedEvent.value,
        status: statusMapping[copiedEvent.status as keyof typeof statusMapping] || 'confirmed',
        user_id: profile?.user_id || profile?.id,
        tax_type: copiedEvent.tax_type,
        tax_rate: copiedEvent.tax_rate
      };

      await createEvent(newEventData);
      
      toast({
        title: "Evento colado",
        description: `"${copiedEvent.title}" foi colado em ${format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}`
      });
      
      setCopiedEvent(null);
    } catch (error) {
      console.error('Erro ao colar evento:', error);
      toast({
        title: "Erro",
        description: "Falha ao colar o evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Limpar evento copiado
  const clearCopiedEvent = () => {
    setCopiedEvent(null);
  };

  return {
    copiedEvent,
    handleCopyEvent,
    handlePasteEvent,
    clearCopiedEvent,
    updateEventStatusBasedOnDate
  };
}