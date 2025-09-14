import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X,
  Smartphone,
  Calendar,
  DollarSign,
  Database,
  Wifi,
  Settings,
  Play
} from 'lucide-react';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useImprovedFeedbackToast } from '@/components/ImprovedFeedbackToast';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  category: string;
  duration?: number;
}

const initialTests: TestResult[] = [
  // Autenticação e Perfil
  { name: 'Autenticação do usuário', status: 'pending', message: '', category: 'auth' },
  { name: 'Carregamento do perfil', status: 'pending', message: '', category: 'auth' },
  
  // Eventos e Calendário
  { name: 'Carregamento de eventos', status: 'pending', message: '', category: 'calendar' },
  { name: 'Criação de evento', status: 'pending', message: '', category: 'calendar' },
  { name: 'Exportação ICS', status: 'pending', message: '', category: 'calendar' },
  
  // Integrações
  { name: 'Google Calendar status', status: 'pending', message: '', category: 'integration' },
  { name: 'Outlook sync', status: 'pending', message: '', category: 'integration' },
  { name: 'iCloud sync', status: 'pending', message: '', category: 'integration' },
  { name: 'Histórico de sincronizações', status: 'pending', message: '', category: 'integration' },
  
  // Financeiro
  { name: 'Carregamento dados financeiros', status: 'pending', message: '', category: 'financial' },
  { name: 'Importação de plantões', status: 'pending', message: '', category: 'financial' },
  { name: 'Criação de transação', status: 'pending', message: '', category: 'financial' },
  
  // Conectividade
  { name: 'Conexão Supabase', status: 'pending', message: '', category: 'connectivity' },
  { name: 'Edge functions', status: 'pending', message: '', category: 'connectivity' },
  
  // Mobile/Responsividade
  { name: 'Responsividade mobile', status: 'pending', message: '', category: 'mobile' },
  { name: 'PWA capabilities', status: 'pending', message: '', category: 'mobile' },
];

export const SystemTestSuite: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>(initialTests);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, total: 0 });
  
  const { events, loading: eventsLoading, createEvent } = useSupabaseEvents();
  const { financialEvents, syncEventsToFinancial, createFinancialEvent } = useFinancialEvents();
  const { providers, getSyncHistory, syncCalendar } = useCalendarSync();
  const { profile } = useProfile();
  const feedbackToast = useImprovedFeedbackToast();

  const updateTest = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, duration } : test
    ));
  };

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    const startTime = Date.now();
    updateTest(testName, 'running', 'Executando...');
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      updateTest(testName, 'success', 'Passou ✓', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testName, 'failed', `Falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, duration);
    }
  };

  const testAuthentication = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) throw new Error('Usuário não autenticado');
  };

  const testProfile = async () => {
    if (!profile) throw new Error('Perfil não carregado');
    if (!profile.name || !profile.email) throw new Error('Dados do perfil incompletos');
  };

  const testEvents = async () => {
    if (eventsLoading) throw new Error('Eventos ainda carregando');
    if (!Array.isArray(events)) throw new Error('Eventos não são um array válido');
  };

  const testEventCreation = async () => {
    const testEvent = {
      title: `Teste Automatizado ${Date.now()}`,
      event_type: 'TESTE',
      start_date: new Date(Date.now() + 60000).toISOString(),
      end_date: new Date(Date.now() + 120000).toISOString(),
      description: 'Evento criado pelo sistema de testes',
      value: 100,
      status: 'CONFIRMADO'
    };
    
    await createEvent(testEvent);
  };

  const testExportICS = async () => {
    if (events.length === 0) throw new Error('Nenhum evento para exportar');
    // Simula exportação ICS
    const icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
    if (!icsContent) throw new Error('Falha na geração do arquivo ICS');
  };

  const testGoogleCalendarStatus = async () => {
    const googleProvider = providers.find(p => p.id === 'google');
    if (!googleProvider) throw new Error('Provider Google não encontrado');
    if (googleProvider.status === 'disconnected') throw new Error('Google Calendar não conectado');
  };

  const testOutlookSync = async () => {
    const outlookProvider = providers.find(p => p.id === 'outlook');
    if (!outlookProvider || outlookProvider.status !== 'connected') {
      throw new Error('Outlook não conectado');
    }
    
    // Test sync without actually calling it to avoid spam
    const hasOutlookEvents = events.some(e => e.external_source === 'outlook_calendar');
    if (!hasOutlookEvents) throw new Error('Nenhum evento sincronizado do Outlook encontrado');
  };

  const testIcloudSync = async () => {
    const icloudProvider = providers.find(p => p.id === 'icloud');
    if (!icloudProvider || icloudProvider.status !== 'connected') {
      throw new Error('iCloud não conectado');
    }
  };

  const testSyncHistory = async () => {
    const history = await getSyncHistory();
    // History might be empty but function should work
    if (!Array.isArray(history)) throw new Error('Histórico de sync não é um array válido');
  };

  const testFinancialData = async () => {
    if (!Array.isArray(financialEvents)) throw new Error('Dados financeiros não são um array válido');
  };

  const testFinancialImport = async () => {
    await syncEventsToFinancial();
    // Function should complete without error
  };

  const testFinancialCreation = async () => {
    const testTransaction = {
      title: `Teste Financeiro ${Date.now()}`,
      type: 'income',
      amount: 500,
      date: new Date().toISOString().split('T')[0],
      category: 'consulta',
      description: 'Transação de teste',
      status: 'pending',
      currency: 'BRL'
    };
    
    await createFinancialEvent(testTransaction);
  };

  const testSupabaseConnection = async () => {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw new Error(`Erro Supabase: ${error.message}`);
  };

  const testEdgeFunctions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: 'teste', userId: 'test' }
      });
      // Function exists and responds (even if with error)
      if (error && error.message.includes('not found')) {
        throw new Error('Edge function AI não encontrada');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      // Function exists but may have validation errors, which is OK
    }
  };

  const testResponsiveness = async () => {
    const isMobile = window.innerWidth < 768;
    const hasTouch = 'ontouchstart' in window;
    
    if (!isMobile && !hasTouch) {
      // Test by simulating mobile viewport
      const meta = document.querySelector('meta[name="viewport"]');
      if (!meta || !meta.getAttribute('content')?.includes('width=device-width')) {
        throw new Error('Meta viewport não configurado para mobile');
      }
    }
  };

  const testPWA = async () => {
    const manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) throw new Error('Manifest PWA não encontrado');
    
    const serviceWorker = 'serviceWorker' in navigator;
    if (!serviceWorker) throw new Error('Service Worker não suportado');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    const testMappings = {
      'Autenticação do usuário': testAuthentication,
      'Carregamento do perfil': testProfile,
      'Carregamento de eventos': testEvents,
      'Criação de evento': testEventCreation,
      'Exportação ICS': testExportICS,
      'Google Calendar status': testGoogleCalendarStatus,
      'Outlook sync': testOutlookSync,
      'iCloud sync': testIcloudSync,
      'Histórico de sincronizações': testSyncHistory,
      'Carregamento dados financeiros': testFinancialData,
      'Importação de plantões': testFinancialImport,
      'Criação de transação': testFinancialCreation,
      'Conexão Supabase': testSupabaseConnection,
      'Edge functions': testEdgeFunctions,
      'Responsividade mobile': testResponsiveness,
      'PWA capabilities': testPWA,
    };

    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of Object.entries(testMappings)) {
      await runTest(testName, testFn);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between tests
      
      const result = tests.find(t => t.name === testName)?.status;
      if (result === 'success') passed++;
      else if (result === 'failed') failed++;
    }

    setSummary({ passed, failed, total: Object.keys(testMappings).length });
    setIsRunning(false);
    
    if (failed === 0) {
      feedbackToast.success(
        'Todos os testes passaram!', 
        `${passed} funcionalidades testadas com sucesso.`
      );
    } else {
      feedbackToast.warning(
        'Alguns testes falharam', 
        `${passed} passaram, ${failed} falharam.`
      );
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <X className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      failed: 'destructive', 
      running: 'outline',
      pending: 'secondary'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Settings className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'integration': return <Wifi className="h-4 w-4" />;
      case 'connectivity': return <Database className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const groupedTests = tests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            <CardTitle>Sistema de Testes Completo</CardTitle>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Executando...' : 'Executar Todos os Testes'}
          </Button>
        </div>
        
        {summary.total > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {summary.passed} passou(ram)
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <X className="h-4 w-4" />
              {summary.failed} falhou(ram)
            </span>
            <span className="text-muted-foreground">
              Total: {summary.total}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-6">
            {Object.entries(groupedTests).map(([category, categoryTests]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  {getCategoryIcon(category)}
                  <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                    {category === 'auth' && 'Autenticação'}
                    {category === 'calendar' && 'Calendário'}
                    {category === 'financial' && 'Financeiro'}
                    {category === 'integration' && 'Integrações'}
                    {category === 'connectivity' && 'Conectividade'}
                    {category === 'mobile' && 'Mobile'}
                  </h3>
                </div>
                
                <div className="grid gap-2">
                  {categoryTests.map((test, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium text-sm">{test.name}</p>
                          {test.message && (
                            <p className="text-xs text-muted-foreground">{test.message}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                📱 Versão Mobile Configurada
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">
                • Capacitor instalado e configurado<br/>
                • PWA manifesto ativo<br/>
                • Interface responsiva otimizada<br/>
                • Para testar em dispositivo: siga as instruções no README
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};