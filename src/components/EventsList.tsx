import React from 'react';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react';

interface Event {
  id: string | number;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  status: string;
  value?: number | null;
  location?: string;
  hospital_name?: string;
  calendar_color?: string;
}

interface EventsListProps {
  events: Event[];
}

const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const getEventTypeColor = (type: string) => {
    const colors = {
      'PLANTAO': 'text-red-600 bg-red-50',
      'CONSULTA': 'text-blue-600 bg-blue-50',
      'PROCEDIMENTO': 'text-green-600 bg-green-50',
      'ACADEMICO': 'text-purple-600 bg-purple-50',
      'REUNIAO': 'text-orange-600 bg-orange-50',
      'ADMINISTRATIVO': 'text-gray-600 bg-gray-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'CONFIRMADO': 'text-green-700 bg-green-100',
      'TENTATIVO': 'text-yellow-700 bg-yellow-100',
      'AGUARDANDO': 'text-blue-700 bg-blue-100',
      'CANCELADO': 'text-red-700 bg-red-100',
      'REALIZADO': 'text-emerald-700 bg-emerald-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Amanhã às ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('pt-BR')} às ${timeStr}`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!events || events.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">
            Próximos Eventos
          </h3>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">Nenhum evento agendado</h4>
          <p className="text-muted-foreground">Seus próximos compromissos aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">
          Próximos Eventos
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </span>
          <div className="status-dot bg-primary"></div>
        </div>
      </div>

      <div className="space-y-4">
        {events.slice(0, 6).map((event, index) => (
          <div
            key={event.id}
            className="group p-4 rounded-xl border border-border/50 hover:border-primary/20 
                       hover:shadow-sm transition-all duration-200 hover:bg-muted/20"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{formatDateTime(event.start_date)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-accent" />
                      </div>
                      <span className="truncate max-w-xs font-medium">{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  
                  {event.value && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-success/10 rounded-full">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-sm font-semibold text-success">{formatCurrency(event.value)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 6 && (
        <div className="mt-6 text-center">
          <button className="modern-button text-sm px-6 py-2">
            Ver todos os eventos ({events.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsList;