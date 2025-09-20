import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Upload,
  Settings,
  Grid3X3,
  List,
  Clock,
  Copy,
  Clipboard,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSupabaseEventsFixed as useSupabaseEvents } from '@/hooks/useSupabaseEventsFixed';
import { useCalendars } from '@/hooks/useCalendars';
import { useHospitals } from '@/hooks/useHospitals';
import { useProfile } from '@/hooks/useProfile';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ZapierIntegration } from '@/components/ZapierIntegration';
import { AIAssistant } from '@/components/AIAssistant';
import { AssistantButton } from '@/components/AssistantButton';
import Navigation from '../components/Navigation';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useImprovedFeedbackToast } from '@/components/ImprovedFeedbackToast';
import { cn } from '@/lib/utils';
import { useEventActions } from '@/hooks/useEventActions';
import { EventActions } from '@/components/EventActions';
import { CopiedEventIndicator } from '@/components/CopiedEventIndicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

type ViewMode = 'month' | 'week' | 'day';

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useSupabaseEvents();
  const { calendars, getDefaultCalendar } = useCalendars();
  const { hospitals } = useHospitals();
  const { profile } = useProfile();
  const { isMinimized, isVisible, showAssistant, hideAssistant, toggleMinimized } = useAIAssistant();
  const { toast } = useToast();
  const feedbackToast = useImprovedFeedbackToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showDayEventsDialog, setShowDayEventsDialog] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  
  const { 
    copiedEvent, 
    handleCopyEvent, 
    handlePasteEvent, 
    clearCopiedEvent,
    updateEventStatusBasedOnDate 
  } = useEventActions();

  // Aplicar atualização de status automática aos eventos
  const eventsWithUpdatedStatus = events.map(updateEventStatusBasedOnDate);

  // Função para lidar com clique no dia
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dayEvents = getEventsForDate(day);
    
    if (dayEvents.length > 0) {
      // Se há eventos, mostrar lista dos eventos do dia
      setSelectedDayEvents(dayEvents);
      setShowDayEventsDialog(true);
    } else {
      // Se não há eventos, abrir formulário de novo evento
      const startTime = format(day, "yyyy-MM-dd'T'09:00");
      const endTime = format(day, "yyyy-MM-dd'T'10:00");
      setEventForm(prev => ({
        ...prev,
        start_time: startTime,
        end_time: endTime
      }));
      setShowEventDialog(true);
    }
  };

  // Check if we should open the new event dialog based on URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new') {
      // Set default times when opening new event dialog
      const now = new Date();
      const startTime = format(now, "yyyy-MM-dd'T'09:00");
      const endTime = format(now, "yyyy-MM-dd'T'10:00");
      setEventForm(prev => ({
        ...prev,
        start_time: startTime,
        end_time: endTime
      }));
      setShowEventDialog(true);
      // Clear the URL parameter after opening the dialog
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname]);

  // Form state for event creation/editing
  const [eventForm, setEventForm] = useState({
    title: '',
    event_type: 'CONSULTA',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    value: '',
    status: 'CONFIRMADO',
    hospital_id: '',
    is_recurring: false,
    recurring_type: 'days',
    recurring_interval: 1,
    recurring_count: 1,
    tax_type: null as string | null,
    tax_rate: null as number | null
  });

  const [customLocation, setCustomLocation] = useState('');

  const eventTypes = [
    { value: 'PLANTAO', label: 'Plantão', color: 'bg-red-500' },
    { value: 'CONSULTA', label: 'Consulta', color: 'bg-blue-500' },
    { value: 'PROCEDIMENTO', label: 'Procedimento', color: 'bg-green-500' },
    { value: 'ACADEMICO', label: 'Acadêmico', color: 'bg-purple-500' },
    { value: 'REUNIAO', label: 'Reunião', color: 'bg-orange-500' },
    { value: 'ADMINISTRATIVO', label: 'Administrativo', color: 'bg-gray-500' }
  ];

  const statusOptions = [
    { value: 'CONFIRMADO', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
    { value: 'TENTATIVO', label: 'Tentativo', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'AGUARDANDO', label: 'Aguardando', color: 'bg-blue-100 text-blue-800' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    { value: 'REALIZADO', label: 'Realizado', color: 'bg-emerald-100 text-emerald-800' }
  ];

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      event_type: 'PLANTAO',
      start_time: '',
      end_time: '',
      location: '',
      description: '',
      value: '',
      status: 'CONFIRMADO',
      hospital_id: '',
      is_recurring: false,
      recurring_type: 'days',
      recurring_interval: 1,
      recurring_count: 1,
      tax_type: null,
      tax_rate: null
    });
    setCustomLocation('');
    setEditingEvent(null);
  };

const handleCreateEvent = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    console.log('📝 Iniciando criação/edição de evento...', eventForm);

    // Validação de campos obrigatórios
    if (!eventForm.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    if (!eventForm.start_time) {
      toast({
        title: "Erro", 
        description: "A data e hora de início são obrigatórias",
        variant: "destructive"
      });
      return;
    }
    
    if (!eventForm.end_time) {
      toast({
        title: "Erro",
        description: "A data e hora de fim são obrigatórias", 
        variant: "destructive"
      });
      return;
    }

    // Validação de datas
    const startDate = new Date(eventForm.start_time);
    const endDate = new Date(eventForm.end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast({
        title: "Erro",
        description: "Formato de data inválido",
        variant: "destructive"
      });
      return;
    }

    if (startDate >= endDate) {
      toast({
        title: "Erro",
        description: "A data de início deve ser anterior à data de fim",
        variant: "destructive"
      });
      return;
    }

    // Mapeamento correto dos valores para o banco de dados
    const eventTypeMapping = {
      'PLANTAO': 'plantao',
      'CONSULTA': 'consulta', 
      'PROCEDIMENTO': 'procedimento',
      'ACADEMICO': 'academico',
      'REUNIAO': 'reuniao',
      'ADMINISTRATIVO': 'administrativo'
    };

    const statusMapping = {
      'CONFIRMADO': 'confirmed',
      'TENTATIVO': 'tentative',
      'AGUARDANDO': 'pending',
      'CANCELADO': 'cancelled',
      'REALIZADO': 'completed'
    };

    // Preparar dados do evento base
    const baseEventData = {
      title: eventForm.title.trim(),
      event_type: eventTypeMapping[eventForm.event_type as keyof typeof eventTypeMapping] || 'plantao',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      location: eventForm.location === 'outro' ? customLocation.trim() : eventForm.location,
      description: eventForm.description?.trim() || null,
      value: eventForm.value ? parseFloat(eventForm.value.toString()) : null,
      status: statusMapping[eventForm.status as keyof typeof statusMapping] || 'confirmed',
      user_id: profile?.user_id || profile?.id,
      tax_type: eventForm.tax_type || null,
      tax_rate: eventForm.tax_rate || null
    };

    // Validar se temos o user_id
    if (!baseEventData.user_id) {
      toast({
        title: "Erro",
        description: "Erro de autenticação. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    console.log('📤 Dados do evento preparados:', baseEventData);

    if (editingEvent) {
      console.log('✏️ Atualizando evento existente:', editingEvent.id);
      await updateEvent(editingEvent.id, baseEventData);
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!"
      });
    } else {
      if (eventForm.is_recurring && eventForm.recurring_count > 1) {
        // Criar eventos recorrentes
        console.log('🔄 Criando eventos recorrentes...');
        const recurringEvents = generateRecurringEvents(baseEventData, eventForm);
        
        let createdCount = 0;
        for (const eventData of recurringEvents) {
          try {
            await createEvent(eventData);
            createdCount++;
          } catch (error) {
            console.error('Erro ao criar evento recorrente:', error);
          }
        }
        
        toast({
          title: "Sucesso",
          description: `${createdCount} eventos recorrentes criados! "${eventForm.title}" foi adicionado ao seu calendário.`
        });
      } else {
        // Criar evento único
        console.log('➕ Criando novo evento...');
        await createEvent(baseEventData);
        toast({
          title: "Sucesso", 
          description: `Evento criado! "${eventForm.title}" foi adicionado ao seu calendário.`
        });
      }
    }

    setShowEventDialog(false);
    resetEventForm();
    
  } catch (error) {
    console.error('💥 Erro ao processar evento:', error);
    
    let errorMessage = "Erro inesperado ao processar evento";
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        errorMessage = "Problema de configuração. Verifique as chaves do Supabase.";
      } else if (error.message.includes('relation "events" does not exist')) {
        errorMessage = "Tabela de eventos não encontrada no banco de dados.";
      } else if (error.message.includes('violates check constraint')) {
        errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
    }
    
    toast({
      title: "Erro",
      description: errorMessage,
      variant: "destructive"
    });
  }
};

// Função para gerar eventos recorrentes
const generateRecurringEvents = (baseEvent: any, form: typeof eventForm) => {
  const events = [];
  const startDate = new Date(baseEvent.start_date);
  const endDate = new Date(baseEvent.end_date);
  const duration = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < form.recurring_count; i++) {
    const eventStartDate = new Date(startDate);
    
    if (form.recurring_type === 'days') {
      eventStartDate.setDate(startDate.getDate() + (i * form.recurring_interval));
    } else if (form.recurring_type === 'weeks') {
      eventStartDate.setDate(startDate.getDate() + (i * form.recurring_interval * 7));
    } else if (form.recurring_type === 'months') {
      eventStartDate.setMonth(startDate.getMonth() + (i * form.recurring_interval));
    }

    const eventEndDate = new Date(eventStartDate.getTime() + duration);

    events.push({
      ...baseEvent,
      start_date: eventStartDate.toISOString(),
      end_date: eventEndDate.toISOString()
    });
  }

  return events;
};

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    const isCustomLocation = event.location && !hospitals.find(h => h.name === event.location);
    setEventForm({
      title: event.title,
      event_type: event.event_type,
      start_time: format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm"),
      location: isCustomLocation ? 'outro' : (event.location || ''),
      description: event.description || '',
      value: event.value ? event.value.toString() : '',
      status: event.status,
      hospital_id: event.hospital_id || '',
      is_recurring: false, // Existing events are not recurring for editing
      recurring_type: 'days',
      recurring_interval: 1,
      recurring_count: 1,
      tax_type: event.tax_type || null,
      tax_rate: event.tax_rate || null
    });
    setCustomLocation(isCustomLocation ? (event.location || '') : '');
    setShowEventDialog(true);
  };

        const handleDeleteEvent = async (eventId: string) => {
          const eventToDelete = events.find(e => e.id === eventId);
          try {
            await deleteEvent(eventId);
            feedbackToast.eventDeleted(eventToDelete?.title || 'Evento');
          } catch (error) {
            console.error('Error deleting event:', error);
            feedbackToast.error(
              "Erro ao excluir evento",
              "Não foi possível excluir o evento. Tente novamente."
            );
          }
        };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return eventsWithUpdatedStatus.filter(event => 
      isSameDay(new Date(event.start_date), date)
    ) as CalendarEvent[];
  };

  const getEventsForRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    return eventsWithUpdatedStatus.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= startDate && eventDate <= endDate;
    }) as CalendarEvent[];
  };

  const exportToICS = () => {
    feedbackToast.info("Preparando exportação...", "Gerando arquivo ICS para download.");

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MedicoAgenda//Calendar//PT\n';
    
    events.forEach(event => {
      const startDate = new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:${event.id}@medicoagenda.com\n`;
      icsContent += `DTSTART:${startDate}\n`;
      icsContent += `DTEND:${endDate}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.description || ''}\n`;
      icsContent += `LOCATION:${event.location || ''}\n`;
      icsContent += `STATUS:${event.status}\n`;
      icsContent += 'END:VEVENT\n';
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-medica-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show success message after a brief delay
    setTimeout(() => {
      feedbackToast.exportSuccess(events.length);
    }, 1000);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    
    const days = [];
    let currentDay = calendarStart;
    
    while (currentDay <= calendarEnd) {
      const dayEvents = getEventsForDate(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, currentDate);
      const isToday = isSameDay(currentDay, new Date());
      
      days.push(
        <div
          key={currentDay.toISOString()}
          className={cn(
            "min-h-32 p-2 border border-border cursor-pointer hover:bg-muted/50 transition-colors",
            !isCurrentMonth && "text-muted-foreground bg-muted/20",
            isToday && "bg-primary/10 border-primary"
          )}
          onClick={() => handleDayClick(currentDay)}
         >
           <div className="font-medium text-sm mb-1 flex items-center justify-between">
             <span>{format(currentDay, 'd')}</span>
             {copiedEvent && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-6 w-6 p-0 hover:bg-primary/10"
                     onClick={(e) => {
                       e.stopPropagation();
                       handlePasteEvent(currentDay, createEvent, profile);
                     }}
                   >
                     <Clipboard className="h-3 w-3" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Colar: {copiedEvent.title}</p>
                 </TooltipContent>
               </Tooltip>
             )}
           </div>
           <div className="space-y-1">
             {dayEvents.slice(0, 2).map(event => (
               <div key={event.id} className="flex items-center gap-1">
                 <div
                   className={cn(
                     "flex-1 text-xs p-1 rounded text-white truncate cursor-pointer",
                     getEventTypeColor(event.event_type)
                   )}
                   onClick={(e) => {
                     e.stopPropagation();
                     handleEditEvent(event);
                   }}
                 >
                   {format(new Date(event.start_date), 'HH:mm')} {event.title}
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <MoreVertical className="h-3 w-3" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                       Editar
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={(e) => handleCopyEvent(event, e)}>
                       <Copy className="h-4 w-4 mr-2" />
                       Copiar
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem 
                       onClick={() => handleDeleteEvent(event.id)}
                       className="text-destructive"
                     >
                       Excluir
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 2} mais
              </div>
            )}
          </div>
        </div>
      );
      
      currentDay = addDays(currentDay, 1);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center font-medium bg-muted text-muted-foreground border-b border-border">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekEnd = endOfWeek(currentDate, { locale: ptBR });
    const weekEvents = getEventsForRange(weekStart, weekEnd);
    
    const days = [];
    let currentDay = weekStart;
    
    while (currentDay <= weekEnd) {
      const dayEvents = getEventsForDate(currentDay);
      const isToday = isSameDay(currentDay, new Date());
      
      days.push(
        <div key={currentDay.toISOString()} className="flex-1">
          <div className={cn(
            "p-2 text-center border-b border-border",
            isToday && "bg-primary text-primary-foreground"
          )}>
            <div className="font-medium">{format(currentDay, 'EEE', { locale: ptBR })}</div>
            <div className="text-lg">{format(currentDay, 'd')}</div>
          </div>
           <div className="min-h-96 p-2 space-y-1 border-r border-border last:border-r-0">
             {dayEvents.map(event => (
               <div key={event.id} className="flex items-center gap-2">
                 <div
                   className={cn(
                     "flex-1 p-2 rounded text-white text-sm cursor-pointer",
                     getEventTypeColor(event.event_type)
                   )}
                   onClick={() => handleEditEvent(event)}
                 >
                   <div className="font-medium">{event.title}</div>
                   <div className="text-xs opacity-90">
                     {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                   </div>
                   {event.location && (
                     <div className="text-xs opacity-75">{event.location}</div>
                   )}
                 </div>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-8 w-8 p-0 hover:bg-muted"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <MoreVertical className="h-4 w-4" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                       Editar
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={(e) => handleCopyEvent(event, e)}>
                       <Copy className="h-4 w-4 mr-2" />
                       Copiar
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem 
                       onClick={() => handleDeleteEvent(event.id)}
                       className="text-destructive"
                     >
                       Excluir
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             ))}
          </div>
        </div>
      );
      
      currentDay = addDays(currentDay, 1);
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex">
          {days}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="p-4 bg-muted border-b border-border">
            <h3 className="font-semibold text-lg">
              {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: ptBR })}
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {hours.map(hour => {
              const hourEvents = dayEvents.filter(event => 
                new Date(event.start_date).getHours() === hour
              );
              
              return (
                <div key={hour} className="flex border-b border-border last:border-b-0">
                  <div className="w-20 p-2 text-center text-sm text-muted-foreground bg-muted/50">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                   <div className="flex-1 p-2 min-h-12">
                     {hourEvents.map(event => (
                       <div key={event.id} className="flex items-center gap-2 mb-1">
                         <div
                           className={cn(
                             "flex-1 p-2 rounded text-white text-sm cursor-pointer",
                             getEventTypeColor(event.event_type)
                           )}
                           onClick={() => handleEditEvent(event)}
                         >
                           <div className="font-medium">{event.title}</div>
                           <div className="text-xs opacity-90">
                             {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                           </div>
                           {event.location && (
                             <div className="text-xs opacity-75">{event.location}</div>
                           )}
                         </div>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-8 w-8 p-0 hover:bg-muted"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <MoreVertical className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                               Editar
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={(e) => handleCopyEvent(event, e)}>
                               <Copy className="h-4 w-4 mr-2" />
                               Copiar
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem 
                               onClick={() => handleDeleteEvent(event.id)}
                               className="text-destructive"
                             >
                               Excluir
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     ))}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {dayEvents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum evento para este dia</p>
              <Button onClick={() => setShowEventDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Evento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const formatDateTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDate, { locale: ptBR });
      return `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`;
    } else {
      return format(currentDate, 'dd MMMM yyyy', { locale: ptBR });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="flex">
          <main className={cn(
            "flex-1 transition-all duration-300",
            !isMinimized && isVisible ? "mr-96" : ""
          )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <TooltipProvider>
                <div className="space-y-6">
                   {/* Header */}
                   <div className="flex items-center justify-between">
                     <div>
                       <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
                       <p className="text-muted-foreground">Gerencie seus compromissos e plantões</p>
                     </div>

                     <div className="flex items-center gap-2">
              <AssistantButton 
                onClick={showAssistant}
                variant="outline" 
                size="sm" 
              />
              
              <Button variant="outline" size="sm" onClick={exportToICS}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Integrações
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Integração com Apps de Plantões</DialogTitle>
                  </DialogHeader>
                  <ZapierIntegration />
                </DialogContent>
              </Dialog>
            </div>

            <Button onClick={() => {
              // Set default times when opening new event dialog
              const now = new Date();
              const startTime = format(now, "yyyy-MM-dd'T'09:00");
              const endTime = format(now, "yyyy-MM-dd'T'10:00");
              setEventForm(prev => ({
                ...prev,
                start_time: startTime,
                end_time: endTime
              }));
              setShowEventDialog(true);
            }} className="bg-medical hover:bg-medical-dark text-medical-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>

          {/* Calendar Controls */}
          <div className="flex items-center justify-between">{" "}
                    <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-64 justify-center">
                      {formatDateTitle()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setCurrentDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dia
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Semana
                </TabsTrigger>
                <TabsTrigger value="month" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Mês
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

                  {/* Calendar View */}
                  {viewMode === 'month' && renderMonthView()}
                  {viewMode === 'week' && renderWeekView()}
                  {viewMode === 'day' && renderDayView()}

          {/* Event Dialog */}
          <Dialog open={showEventDialog} onOpenChange={(open) => {
            setShowEventDialog(open);
            if (!open) resetEventForm();
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Consulta Cardiologia - Hospital ABC"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="event_type">Tipo *</Label>
                    <Select value={eventForm.event_type} onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded", type.color)}></div>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Início *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Fim *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

              <div>
                <Label htmlFor="location">Local</Label>
                <Select value={eventForm.location} onValueChange={(value) => setEventForm(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outro">Outro local</SelectItem>
                    {hospitals.map((hospital, index) => (
                      <SelectItem key={`${hospital.id}-${index}`} value={hospital.name}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eventForm.location === 'outro' && (
                  <Input
                    className="mt-2"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Endereço ou referência do local"
                  />
                )}
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={eventForm.value}
                      onChange={(e) => setEventForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Valor em R$ (ex: 450,00)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={eventForm.status} onValueChange={(value) => setEventForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Configurações de Imposto */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_type">Tipo de Imposto</Label>
                    <Select value={eventForm.tax_type || 'default'} onValueChange={(value) => setEventForm(prev => ({ ...prev, tax_type: value === 'default' ? null : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de imposto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Usar padrão do perfil</SelectItem>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="sociedade_simples_limitada">Sociedade Simples Limitada</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                        <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                        <SelectItem value="isento">Isento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={eventForm.tax_rate || ''}
                      onChange={(e) => setEventForm(prev => ({ ...prev, tax_rate: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="Taxa personalizada (ex: 11.50)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio para usar a taxa padrão do perfil
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Informações adicionais sobre o evento..."
                    rows={3}
                  />
                </div>

                {/* Campos de Recorrência */}
                {!editingEvent && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_recurring"
                        checked={eventForm.is_recurring}
                        onChange={(e) => setEventForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="is_recurring" className="font-medium">
                        Evento Recorrente
                      </Label>
                    </div>
                    
                    {eventForm.is_recurring && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="recurring_interval">A cada</Label>
                            <Input
                              id="recurring_interval"
                              type="number"
                              min="1"
                              max="30"
                              value={eventForm.recurring_interval}
                              onChange={(e) => setEventForm(prev => ({ ...prev, recurring_interval: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="recurring_type">Período</Label>
                            <Select value={eventForm.recurring_type} onValueChange={(value) => setEventForm(prev => ({ ...prev, recurring_type: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">Dia(s)</SelectItem>
                                <SelectItem value="weeks">Semana(s)</SelectItem>
                                <SelectItem value="months">Mês(es)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="recurring_count">Repetições</Label>
                            <Input
                              id="recurring_count"
                              type="number"
                              min="1"
                              max="52"
                              value={eventForm.recurring_count}
                              onChange={(e) => setEventForm(prev => ({ ...prev, recurring_count: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {eventForm.recurring_count > 1 && (
                            <p>
                              Será criado um total de <strong>{eventForm.recurring_count} eventos</strong>, 
                              um a cada <strong>{eventForm.recurring_interval}</strong> {
                                eventForm.recurring_type === 'days' ? 'dia(s)' :
                                eventForm.recurring_type === 'weeks' ? 'semana(s)' : 'mês(es)'
                              }.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <div>
                    {editingEvent && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={() => {
                          handleDeleteEvent(editingEvent.id);
                          setShowEventDialog(false);
                          resetEventForm();
                        }}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                  
                   <div className="flex gap-2">
                     <Button 
                       type="button" 
                       variant="outline" 
                       onClick={() => setShowEventDialog(false)}
                     >
                       Cancelar
                     </Button>
                     <Button type="submit" className="bg-medical hover:bg-medical-dark text-medical-foreground">
                       {editingEvent ? 'Salvar' : 'Criar'}
                     </Button>
                   </div>
                 </div>
               </form>
             </DialogContent>
           </Dialog>

           {/* Dialog para mostrar eventos do dia */}
           <Dialog open={showDayEventsDialog} onOpenChange={setShowDayEventsDialog}>
             <DialogContent className="max-w-2xl">
               <DialogHeader>
                 <DialogTitle>
                   Eventos de {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                 </DialogTitle>
               </DialogHeader>
               
               <div className="space-y-4 max-h-96 overflow-y-auto">
                 {selectedDayEvents.map(event => (
                   <div
                     key={event.id}
                     className={cn(
                       "p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                       "border-l-4"
                     )}
                     style={{ borderLeftColor: getEventTypeColor(event.event_type).replace('bg-', '').replace('-500', '') }}
                     onClick={() => {
                       setShowDayEventsDialog(false);
                       handleEditEvent(event);
                     }}
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                         <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                             <Clock className="h-4 w-4" />
                             {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                           </div>
                           {event.location && (
                             <div className="flex items-center gap-1">
                               <CalendarIcon className="h-4 w-4" />
                               {event.location}
                             </div>
                           )}
                         </div>
                         {event.description && (
                           <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                         )}
                         <div className="flex items-center gap-2 mt-2">
                           <Badge className={cn("text-xs", getStatusColor(event.status))}>
                             {statusOptions.find(s => s.value === event.status)?.label || event.status}
                           </Badge>
                           <Badge variant="outline" className="text-xs">
                             {eventTypes.find(t => t.value === event.event_type.toUpperCase())?.label || event.event_type}
                           </Badge>
                           {event.value && (
                             <Badge variant="secondary" className="text-xs">
                               R$ {event.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </Badge>
                           )}
                         </div>
                       </div>
                       
                       <EventActions
                         event={event}
                         onEdit={handleEditEvent}
                         onCopy={handleCopyEvent}
                         onDelete={handleDeleteEvent}
                         className="text-muted-foreground hover:bg-muted"
                       />
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="flex justify-between pt-4 border-t">
                 <Button
                   variant="outline"
                   onClick={() => {
                     setShowDayEventsDialog(false);
                     const startTime = format(selectedDate, "yyyy-MM-dd'T'09:00");
                     const endTime = format(selectedDate, "yyyy-MM-dd'T'10:00");
                     setEventForm(prev => ({
                       ...prev,
                       start_time: startTime,
                       end_time: endTime
                     }));
                     setShowEventDialog(true);
                   }}
                   className="flex items-center gap-2"
                 >
                   <Plus className="h-4 w-4" />
                   Adicionar Evento
                 </Button>
                 
                 <Button variant="outline" onClick={() => setShowDayEventsDialog(false)}>
                   Fechar
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
                 </div>
               </TooltipProvider>
             </div>
           </main>

        {/* AI Assistant Sidebar */}
        {isVisible && (
          <aside className={cn(
            "fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-40 transition-transform duration-300",
            isMinimized ? "translate-x-full" : "translate-x-0"
          )}>
            <div className="h-full pt-16">
              <AIAssistant 
                className="h-full"
                minimized={isMinimized}
                onMinimizeToggle={toggleMinimized}
              />
            </div>
          </aside>
        )}

        {/* Minimized Assistant Button */}
        {isMinimized && (
          <AIAssistant 
            minimized={true}
            onMinimizeToggle={toggleMinimized}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
