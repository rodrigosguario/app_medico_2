import React, { useState } from 'react';
import { Download, Upload, FileText, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ICSManager: React.FC = () => {
  const { toast } = useToast();
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [importedEvents, setImportedEvents] = useState<number>(0);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    
    try {
      // Read file content
      const text = await file.text();
      
      // Basic ICS validation
      if (!text.includes('BEGIN:VCALENDAR') || !text.includes('END:VCALENDAR')) {
        throw new Error('Arquivo ICS inválido');
      }
      
      // Count events in the file
      const eventMatches = text.match(/BEGIN:VEVENT/g);
      const eventCount = eventMatches ? eventMatches.length : 0;
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.min(2000, eventCount * 100)));
      
      setImportedEvents(eventCount);
      setImportStatus('success');
      
      toast({
        title: "Importação concluída com sucesso",
        description: `${eventCount} eventos foram importados de ${file.name}. Navegue até as datas correspondentes para visualizá-los.`,
      });
      
      // Show success message longer for user to see
      setTimeout(() => setImportStatus('idle'), 5000);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
    }
  };

  const handleExport = async () => {
    setExportStatus('exporting');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate ICS content
      const icsContent = generateMockICS();
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicoagenda_export_${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus('success');
      
      toast({
        title: "Exportação concluída",
        description: `Seu calendário foi exportado com sucesso. O arquivo foi salvo na pasta de downloads.`,
      });
      
      setTimeout(() => setExportStatus('idle'), 4000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  };

  const handleUseTemplate = async (templateName: string) => {
    setImportStatus('importing');
    
    try {
      // Simula aplicação do template
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock: simula eventos criados pelo template
      const templatesData = {
        'Plantão UTI 12h': 4,
        'Consultas Semanais': 20,
        'Cronograma Acadêmico': 12
      };
      
      const eventsCreated = templatesData[templateName as keyof typeof templatesData] || 5;
      setImportedEvents(eventsCreated);
      setImportStatus('success');
      
      toast({
        title: "Template aplicado",
        description: `${eventsCreated} eventos de ${templateName} foram adicionados ao seu calendário. Navegue até as datas correspondentes para visualizá-los.`,
      });
      
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const generateMockICS = () => {
    const currentDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedicoAgenda//Calendar Export//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@medicoagenda.com
DTSTAMP:${currentDate}
DTSTART:20250725T190000Z
DTEND:20250726T070000Z
SUMMARY:HSL Itaim – UTI – Noite
DESCRIPTION:Plantão noturno na UTI
LOCATION:Hospital Sírio-Libanês Itaim
CATEGORIES:PLANTAO
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  };

  const templates = [
    {
      name: 'Plantão UTI 12h',
      description: 'Template para plantões de 12 horas na UTI',
      icon: '🏥',
      events: 4
    },
    {
      name: 'Consultas Semanais',
      description: 'Template para consultas ambulatoriais',
      icon: '👩‍⚕️',
      events: 20
    },
    {
      name: 'Cronograma Acadêmico',
      description: 'Template para atividades acadêmicas',
      icon: '📚',
      events: 12
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'importing':
      case 'exporting':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Importar/Exportar</h2>
          <p className="text-muted-foreground">
            Gerencie seus calendários através de arquivos ICS
          </p>
        </div>
      </div>

      {/* Ações principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Importar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-medical" />
              Importar Calendário
            </CardTitle>
            <CardDescription>
              Importe eventos de arquivos ICS externos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste um arquivo .ics aqui ou clique para selecionar
              </p>
              <input
                type="file"
                accept=".ics"
                onChange={handleImport}
                className="hidden"
                id="ics-import"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('ics-import')?.click()}
                disabled={importStatus === 'importing'}
              >
                {importStatus === 'importing' ? 'Importando...' : 'Selecionar Arquivo'}
              </Button>
            </div>

            {importStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg bg-card border ${getStatusColor(importStatus)}`}>
                {getStatusIcon(importStatus)}
                <span className="text-sm">
                  {importStatus === 'importing' && 'Processando arquivo...'}
                  {importStatus === 'success' && `${importedEvents} eventos importados com sucesso!`}
                  {importStatus === 'error' && 'Erro ao importar arquivo. Verifique o formato.'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exportar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-success" />
              Exportar Calendário
            </CardTitle>
            <CardDescription>
              Exporte seus eventos para arquivo ICS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-sm">Eventos Selecionados</p>
                  <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
                </div>
                <Badge variant="secondary">25 eventos</Badge>
              </div>
              
              <Button 
                onClick={handleExport}
                disabled={exportStatus === 'exporting'}
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportStatus === 'exporting' ? 'Gerando arquivo...' : 'Exportar ICS'}
              </Button>
            </div>

            {exportStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg bg-card border ${getStatusColor(exportStatus)}`}>
                {getStatusIcon(exportStatus)}
                <span className="text-sm">
                  {exportStatus === 'exporting' && 'Gerando arquivo de exportação...'}
                  {exportStatus === 'success' && 'Arquivo exportado com sucesso!'}
                  {exportStatus === 'error' && 'Erro ao exportar arquivo.'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-medical" />
            Templates Rápidos
          </CardTitle>
          <CardDescription>
            Use templates pré-configurados para importação rápida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{template.icon}</div>
                  <Badge variant="outline">{template.events} eventos</Badge>
                </div>
                <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleUseTemplate(template.name)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Usar Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de importações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>
            Últimas importações e exportações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'export', date: '2025-01-15', events: 25, status: 'success' },
              { type: 'import', date: '2025-01-10', events: 12, status: 'success' },
              { type: 'export', date: '2025-01-08', events: 30, status: 'success' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  {item.type === 'export' ? (
                    <Download className="h-4 w-4 text-success" />
                  ) : (
                    <Upload className="h-4 w-4 text-medical" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {item.type === 'export' ? 'Exportação' : 'Importação'}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{item.events} eventos</p>
                  <Badge variant="outline" className="text-xs">
                    {item.status === 'success' ? 'Sucesso' : 'Erro'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ICSManager;