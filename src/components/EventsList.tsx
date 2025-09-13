import React from 'react';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react';

interface Event {
  id: string | number;
  title: string;
  start_time: string;
  end_time: string;
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
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Próximos Eventos
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum evento agendado</p>
          <p className="text-sm mt-1">Seus próximos compromissos aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Próximos Eventos
        </h3>
        <span className="text-sm text-gray-500">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(event.start_time)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate max-w-xs">{event.location}</span>
                    </div>
                  )}
                  
                  {event.hospital_name && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="truncate max-w-xs">{event.hospital_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  
                  {event.value && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(event.value)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todos os eventos
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsList;