import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Download, 
  Upload, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useToast } from '@/hooks/use-toast';

interface SyncProvider {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  eventsCount?: number;
}

export const CalendarSync: React.FC = () => {
  const { events, createEvent } = useSupabaseEvents();
  const { toast } = useToast();
  const [syncProviders, setSyncProviders] = useState<SyncProvider[]>([
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      status: 'disconnected',
      eventsCount: 0
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📧',
      status: 'disconnected',
      eventsCount: 0
    },
    {
      id: 'icloud',
      name: 'iCloud Calendar',
      icon: '☁️',
      status: 'disconnected',
      eventsCount: 0
    },
    {
      id: 'plantoesbr',
      name: 'PlantoesBR',
      icon: '🏥',
      status: 'disconnected',
      eventsCount: 0
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'syncing':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      disconnected: 'secondary',
      syncing: 'outline',
      error: 'destructive'
    } as const;

    const labels = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      syncing: 'Sincronizando',
      error: 'Erro'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleToggleProvider = (providerId: string) => {
    setSyncProviders(prev => prev.map(provider => {
      if (provider.id === providerId) {
        if (provider.status === 'disconnected') {
          // Simulate connection process
          return { ...provider, status: 'syncing' as const };
        } else {
          return { ...provider, status: 'disconnected' as const };
        }
      }
      return provider;
    }));

    // Simulate sync process
    setTimeout(() => {
      setSyncProviders(prev => prev.map(provider => {
        if (provider.id === providerId && provider.status === 'syncing') {
          return {
            ...provider,
            status: 'connected' as const,
            lastSync: new Date().toLocaleString('pt-BR'),
            eventsCount: Math.floor(Math.random() * 20) + 5
          };
        }
        return provider;
      }));
    }, 2000);
  };

  const exportToICS = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MedicoAgenda//Calendar//PT\n';
    
    events.forEach(event => {
      const startDate = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
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
    a.download = 'medicoagenda-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportICS = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const icsContent = e.target?.result as string;
      
      try {
        // Parse ICS content and create events
        const events = parseICSContent(icsContent);
        
        if (events.length === 0) {
          console.warn('Nenhum evento encontrado no arquivo ICS');
          return;
        }

        // Create events in Supabase
        let successCount = 0;
        let errorCount = 0;
        
        for (const eventData of events) {
          try {
            await createEvent({
              title: eventData.title,
              description: eventData.description,
              start_time: eventData.start_time,
              end_time: eventData.end_time,
              location: eventData.location,
              event_type: eventData.event_type,
              status: eventData.status
            });
            successCount++;
          } catch (error) {
            console.error('Erro ao criar evento:', error);
            errorCount++;
          }
        }
        
        toast({
          title: 'Importação concluída',
          description: `${successCount} eventos importados com sucesso${errorCount > 0 ? `. ${errorCount} eventos falharam.` : '.'}`,
          variant: successCount > 0 ? 'default' : 'destructive'
        });
      } catch (error) {
        console.error('Erro ao importar arquivo ICS:', error);
        toast({
          title: 'Erro na importação',
          description: 'Não foi possível importar o arquivo ICS. Verifique se o formato está correto.',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  const parseICSContent = (icsContent: string) => {
    const events = [];
    const lines = icsContent.split('\n');
    let currentEvent: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title && currentEvent.start_time) {
          events.push({
            title: currentEvent.title,
            description: currentEvent.description || '',
            start_time: currentEvent.start_time,
            end_time: currentEvent.end_time || currentEvent.start_time,
            location: currentEvent.location || '',
            event_type: 'CONSULTA',
            status: 'CONFIRMADO'
          });
        }
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        
        switch (key) {
          case 'SUMMARY':
            currentEvent.title = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value;
            break;
          case 'DTSTART':
            currentEvent.start_time = formatICSDate(value);
            break;
          case 'DTEND':
            currentEvent.end_time = formatICSDate(value);
            break;
          case 'LOCATION':
            currentEvent.location = value;
            break;
        }
      }
    }
    
    return events;
  };

  const formatICSDate = (icsDate: string): string => {
    // Convert ICS date format (YYYYMMDDTHHMMSSZ) to ISO string
    if (icsDate.length >= 15) {
      const year = icsDate.substring(0, 4);
      const month = icsDate.substring(4, 6);
      const day = icsDate.substring(6, 8);
      const hour = icsDate.substring(9, 11);
      const minute = icsDate.substring(11, 13);
      const second = icsDate.substring(13, 15);
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
    return new Date().toISOString();
  };

  const handleSyncAllCalendars = () => {
    syncProviders.forEach(provider => {
      if (provider.status === 'connected') {
        handleToggleProvider(provider.id);
      }
    });
  };

  const handleConfigureProvider = (providerId: string) => {
    const urls = {
      google: 'https://calendar.google.com/calendar/u/0/settings',
      outlook: 'https://outlook.live.com/calendar/0/options/calendar',
      icloud: 'https://www.icloud.com/calendar',
      plantoesbr: 'https://plantoes.com.br/configuracoes'
    };
    
    const url = urls[providerId as keyof typeof urls];
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export/Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exportar/Importar Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exportar calendário</Label>
              <div className="flex gap-2">
                <Button onClick={exportToICS} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar ICS
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Exporte todos os seus eventos para usar em outros calendários (Google, Outlook, Apple)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ics-import">Importar arquivo ICS</Label>
              <div className="flex gap-2">
                <Input 
                  id="ics-import" 
                  type="file" 
                  accept=".ics" 
                  className="flex-1"
                  onChange={handleImportICS}
                />
                <Button variant="outline" onClick={() => document.getElementById('ics-import')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Importe eventos de outros calendários em formato ICS (padrão universal)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Integrações de Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncProviders.map(provider => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{provider.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{provider.name}</h4>
                    {getStatusIcon(provider.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusBadge(provider.status)}
                    {provider.lastSync && (
                      <>
                        <span>•</span>
                        <span>Última sincronização: {provider.lastSync}</span>
                      </>
                    )}
                  </div>
                  {provider.eventsCount && provider.eventsCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {provider.eventsCount} eventos sincronizados
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {provider.status === 'connected' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleConfigureProvider(provider.id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                )}
                <Switch
                  checked={provider.status !== 'disconnected'}
                  disabled={provider.status === 'syncing'}
                  onCheckedChange={() => handleToggleProvider(provider.id)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Sincronização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sincronização automática</h4>
              <p className="text-sm text-muted-foreground">
                Sincronizar eventos automaticamente a cada hora
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notificações de sincronização</h4>
              <p className="text-sm text-muted-foreground">
                Receber notificações quando novos eventos forem sincronizados
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sincronização bidirecional</h4>
              <p className="text-sm text-muted-foreground">
                Permitir que alterações sejam sincronizadas em ambas as direções
              </p>
            </div>
            <Switch />
          </div>

          <div className="pt-4 border-t border-border">
            <Button 
              className="w-full bg-medical hover:bg-medical-dark text-medical-foreground"
              onClick={handleSyncAllCalendars}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Todos os Calendários
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};