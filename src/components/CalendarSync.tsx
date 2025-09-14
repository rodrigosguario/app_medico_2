import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Download, 
  Upload, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  History,
  Plus,
  Trash2,
  Link
} from 'lucide-react';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useToast } from '@/hooks/use-toast';

export const CalendarSync: React.FC = () => {
  const { 
    providers, 
    loading, 
    connectGoogleCalendar, 
    connectOutlookCalendar,
    syncCalendar,
    disconnectProvider,
    getSyncHistory,
    exportToICS 
  } = useCalendarSync();
  const { createEvent } = useSupabaseEvents();
  const { toast } = useToast();
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncNotifications, setSyncNotifications] = useState(true);
  const [bidirectionalSync, setBidirectionalSync] = useState(false);

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const history = await getSyncHistory();
      setSyncHistory(history);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

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

  const handleConnectProvider = async (providerId: string) => {
    try {
      if (providerId === 'google') {
        await connectGoogleCalendar();
      } else if (providerId === 'outlook') {
        await connectOutlookCalendar();
      } else {
        toast({
          title: 'Em desenvolvimento',
          description: `Integração com ${providerId} em breve`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error connecting provider:', error);
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider || provider.status !== 'connected') return;

    try {
      await syncCalendar(providerId);
      await loadSyncHistory();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Verifique as configurações e tente novamente',
        variant: 'destructive'
      });
    }
  };

  const handleDisconnectProvider = async (providerId: string) => {
    await disconnectProvider(providerId);
    await loadSyncHistory();
  };

  const handleImportICS = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const icsContent = e.target?.result as string;
      
      try {
        const events = parseICSContent(icsContent);
        
        if (events.length === 0) {
          toast({
            title: 'Arquivo vazio',
            description: 'Nenhum evento encontrado no arquivo ICS',
            variant: 'destructive'
          });
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        
        for (const eventData of events) {
          try {
            await createEvent({
              title: eventData.title,
              description: eventData.description,
              start_date: eventData.start_date,
              end_date: eventData.end_date,
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
          description: `${successCount} eventos importados${errorCount > 0 ? `, ${errorCount} falharam` : ''}`,
          variant: successCount > 0 ? 'default' : 'destructive'
        });
      } catch (error) {
        console.error('Erro ao importar arquivo ICS:', error);
        toast({
          title: 'Erro na importação',
          description: 'Formato de arquivo inválido',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  const parseICSContent = (icsContent: string) => {
    const events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: any = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title && currentEvent.start_date) {
          events.push({
            title: currentEvent.title,
            description: currentEvent.description || '',
            start_date: currentEvent.start_date,
            end_date: currentEvent.end_date || currentEvent.start_date,
            location: currentEvent.location || '',
            event_type: determineEventType(currentEvent.title),
            status: 'confirmed'
          });
        }
        currentEvent = null;
      } else if (currentEvent && trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex);
        const value = trimmedLine.substring(colonIndex + 1);
        
        switch (key) {
          case 'SUMMARY':
            currentEvent.title = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value;
            break;
          case 'DTSTART':
          case 'DTSTART;VALUE=DATE':
            currentEvent.start_date = formatICSDate(value);
            break;
          case 'DTEND':
          case 'DTEND;VALUE=DATE':
            currentEvent.end_date = formatICSDate(value);
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
    // Handle different ICS date formats
    if (icsDate.length === 8) {
      // All-day event: YYYYMMDD
      const year = icsDate.substring(0, 4);
      const month = icsDate.substring(4, 6);
      const day = icsDate.substring(6, 8);
      return `${year}-${month}-${day}T00:00:00`;
    } else if (icsDate.length >= 15) {
      // Timed event: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
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

  const determineEventType = (title: string): string => {
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
  };

  return (
    <Tabs defaultValue="sync" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sync">Sincronização</TabsTrigger>
        <TabsTrigger value="import-export">Importar/Exportar</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="sync" className="space-y-6">
        {/* Connection Guide */}
        <Alert>
          <Link className="h-4 w-4" />
          <AlertDescription>
            Para conectar seus calendários, você precisa configurar as credenciais OAuth. 
            <Button variant="link" className="p-0 h-auto ml-1" asChild>
              <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer">
                Configurar Google Calendar
              </a>
            </Button>
            {' | '}
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer">
                Configurar Microsoft
              </a>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Calendar Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Integrações de Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.map(provider => (
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
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSyncProvider(provider.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDisconnectProvider(provider.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </>
                  )}
                  {provider.status === 'disconnected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectProvider(provider.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                  {provider.status === 'syncing' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 animate-pulse" />
                      Sincronizando...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sincronização automática</h4>
                <p className="text-sm text-muted-foreground">
                  Sincronizar eventos automaticamente a cada hora
                </p>
              </div>
              <Switch 
                checked={autoSync} 
                onCheckedChange={setAutoSync}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notificações de sincronização</h4>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando novos eventos forem sincronizados
                </p>
              </div>
              <Switch 
                checked={syncNotifications} 
                onCheckedChange={setSyncNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sincronização bidirecional</h4>
                <p className="text-sm text-muted-foreground">
                  Permitir que alterações sejam sincronizadas em ambas as direções
                </p>
              </div>
              <Switch 
                checked={bidirectionalSync} 
                onCheckedChange={setBidirectionalSync}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="import-export" className="space-y-6">
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
                  Exporte todos os seus eventos para usar em outros calendários
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ics-import">Importar arquivo ICS</Label>
                <div className="flex gap-2">
                  <Input 
                    id="ics-import" 
                    type="file" 
                    accept=".ics,.ical" 
                    className="flex-1"
                    onChange={handleImportICS}
                  />
                  <Button variant="outline" onClick={() => document.getElementById('ics-import')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Importe eventos de outros calendários em formato ICS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Sincronizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sincronização realizada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncHistory.map((sync, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{sync.provider}</span>
                        <Badge variant={sync.sync_status === 'completed' ? 'default' : 'destructive'}>
                          {sync.sync_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sync.events_succeeded} sucessos, {sync.events_failed} falhas
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(sync.started_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};