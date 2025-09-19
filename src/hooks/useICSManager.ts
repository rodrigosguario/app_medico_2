import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';

export function useICSManager() {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Função para importar arquivo ICS
  const importICS = async (file: File) => {
    if (!user || !file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const events = parseICSFile(text);

      if (events.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'Nenhum evento encontrado no arquivo ICS',
          variant: 'destructive'
        });
        return;
      }

      let importedCount = 0;
      let errorCount = 0;

      for (const event of events) {
        try {
          // Verificar se evento já existe pelo título e data
          const { data: existingEvent } = await supabase
            .from('events')
            .select('id')
            .eq('user_id', user.id)
            .eq('title', event.title)
            .eq('start_date', event.start_date)
            .maybeSingle();

          if (existingEvent) {
            continue; // Pular eventos duplicados
          }

          const { error } = await supabase
            .from('events')
            .insert({
              user_id: user.id,
              title: event.title,
              description: event.description,
              start_date: event.start_date,
              end_date: event.end_date,
              location: event.location,
              event_type: determineEventType(event.title),
              status: 'confirmed',
              external_source: 'ics_import'
            });

          if (error) {
            console.error('Erro ao inserir evento:', error);
            errorCount++;
          } else {
            importedCount++;
          }
        } catch (error) {
          console.error('Erro no evento:', error);
          errorCount++;
        }
      }

      toast({
        title: 'Importação concluída',
        description: `${importedCount} eventos importados${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
        variant: importedCount > 0 ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Arquivo ICS inválido ou corrompido',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Função para exportar eventos como ICS
  const exportICS = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      // Buscar eventos dos próximos 6 meses
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', new Date().toISOString())
        .lte('start_date', sixMonthsFromNow.toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!events || events.length === 0) {
        toast({
          title: 'Nenhum evento',
          description: 'Não há eventos futuros para exportar',
          variant: 'destructive'
        });
        return;
      }

      const icsContent = generateICSContent(events);
      downloadICSFile(icsContent, 'agenda-medica.ics');

      toast({
        title: 'Exportação concluída',
        description: `${events.length} eventos exportados com sucesso`,
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Falha ao gerar arquivo ICS',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isImporting,
    isExporting,
    importICS,
    exportICS
  };
}

// Função para fazer parse do arquivo ICS
function parseICSFile(content: string) {
  const events = [];
  const lines = content.split(/\r?\n/);
  let currentEvent: any = null;
  let currentProperty = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Handle line continuations
    while (i + 1 < lines.length && lines[i + 1].startsWith(' ')) {
      i++;
      line += lines[i].substring(1);
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.summary && currentEvent.dtstart) {
        events.push({
          title: currentEvent.summary,
          description: currentEvent.description || '',
          start_date: parseICSDateTime(currentEvent.dtstart),
          end_date: parseICSDateTime(currentEvent.dtend || currentEvent.dtstart),
          location: currentEvent.location || ''
        });
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const [property, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      // Remove parameters from property name
      const cleanProperty = property.split(';')[0];
      
      switch (cleanProperty) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
          currentEvent.dtend = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
      }
    }
  }

  return events;
}

// Função para converter data/hora ICS para ISO
function parseICSDateTime(dateTimeString: string): string {
  if (!dateTimeString) return new Date().toISOString();

  try {
    // Remove timezone info for simplicity
    const cleanDateTime = dateTimeString.replace(/[TZ]/g, '');
    
    if (cleanDateTime.length >= 8) {
      const year = cleanDateTime.substring(0, 4);
      const month = cleanDateTime.substring(4, 6);
      const day = cleanDateTime.substring(6, 8);
      
      let hour = '00', minute = '00', second = '00';
      if (cleanDateTime.length >= 14) {
        hour = cleanDateTime.substring(8, 10);
        minute = cleanDateTime.substring(10, 12);
        second = cleanDateTime.substring(12, 14);
      }
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
    }
  } catch (error) {
    console.error('Erro parsing data ICS:', error);
  }
  
  return new Date().toISOString();
}

// Função para gerar conteúdo ICS
function generateICSContent(events: any[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda Médica//Agenda Médica App//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Agenda Médica',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    ''
  ];

  events.forEach((event, index) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    const dtstart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtend = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `evento-${event.id}@agenda-medica.com`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      `CREATED:${timestamp}`,
      `LAST-MODIFIED:${timestamp}`,
      'END:VEVENT',
      ''
    );
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.filter(line => line !== '').join('\r\n');
}

// Função para baixar arquivo ICS
function downloadICSFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Determinar tipo de evento baseado no título
function determineEventType(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('plantão') || titleLower.includes('plantao')) {
    return 'plantao';
  } else if (titleLower.includes('consulta') || titleLower.includes('atendimento')) {
    return 'consulta';
  } else if (titleLower.includes('cirurgia') || titleLower.includes('procedimento')) {
    return 'procedimento';
  } else if (titleLower.includes('reunião') || titleLower.includes('reuniao')) {
    return 'reuniao';
  } else if (titleLower.includes('aula') || titleLower.includes('curso')) {
    return 'aula';
  }
  
  return 'outros';
}