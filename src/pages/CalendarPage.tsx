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
  Clock
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
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useCalendars } from '@/hooks/useCalendars';
import { useHospitals } from '@/hooks/useHospitals';
import { useProfile } from '@/hooks/useProfile';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ZapierIntegration } from '@/components/ZapierIntegration';
import { AIAssistant } from '@/components/AIAssistant';
import { AssistantButton } from '@/components/AssistantButton';
import Navigation from '../components/Navigation';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useImprovedFeedbackToast } from '@/components/ImprovedFeedbackToast';
import { cn } from '@/lib/utils';
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
    hospital_id: ''
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
    hospital_id: ''
  });
  setCustomLocation('');
  setEditingEvent(null);
};

const handleCreateEvent = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
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

    const eventData = {
      title: eventForm.title.trim(),
      event_type: eventTypeMapping[eventForm.event_type as keyof typeof eventTypeMapping] || 'plantao',
      start_date: new Date(eventForm.start_time).toISOString(),
      end_date: new Date(eventForm.end_time).toISOString(),
      location: eventForm.location === 'outro' ? customLocation : eventForm.location,
      description: eventForm.description || null,
      value: eventForm.value ? parseFloat(eventForm.value.toString()) : null,
      status: statusMapping[eventForm.status as keyof typeof statusMapping] || 'confirmed',
      user_id: profile?.id
    };

    console.log('Dados do evento a serem enviados:', eventData);

    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!"
      });
    } else {
      await createEvent(eventData);
      toast({
        title: "Sucesso", 
        description: `Evento criado! "${eventForm.title}" foi adicionado ao seu calendário.`
      });
    }

    setShowEventDialog(false);
    resetEventForm();
  } catch (error) {
    console.error('Erro inesperado:', error);
    toast({
      title: "Erro",
      description: "Erro inesperado ao processar evento",
      variant: "destructive"
    });
  }
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
      hospital_id: event.hospital_id || ''
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
    return events.filter(event => 
      isSameDay(new Date(event.start_date), date)
    ) as CalendarEvent[];
  };

  const getEventsForRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    return events.filter(event => {
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
         onClick={() => {
  setSelectedDate(currentDay);
  const startTime = format(currentDay, "yyyy-MM-dd'T'09:00");
  const endTime = format(currentDay, "yyyy-MM-dd'T'10:00");
  setEventForm(prev => ({
    ...prev,
    start_time: startTime,
    end_time: endTime
  }));
  setShowEventDialog(true);
}}
        >
          <div className="font-medium text-sm mb-1">
            {format(currentDay, 'd')}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1 rounded text-white truncate cursor-pointer",
                  getEventTypeColor(event.event_type)
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }}
              >
                {format(new Date(event.start_date), 'HH:mm')} {event.title}
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
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded text-white text-sm cursor-pointer",
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
                      <div
                        key={event.id}
                        className={cn(
                          "mb-1 p-2 rounded text-white text-sm cursor-pointer",
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
            </div>
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
