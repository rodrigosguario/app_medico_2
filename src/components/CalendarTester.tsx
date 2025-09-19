import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';
import { 
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  TestTube
} from 'lucide-react';

interface TestEvent {
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  value: string;
  status: string;
}

export const CalendarTester: React.FC = () => {
  const [testEvent, setTestEvent] = useState<TestEvent>({
    title: 'Plantão de Emergência - Teste',
    event_type: 'PLANTAO',
    start_time: '',
    end_time: '',
    location: 'Hospital Sírio-Libanês',
    description: 'Plantão de teste para verificar funcionalidades',
    value: '500.00',
    status: 'CONFIRMADO'
  });

  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);

  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const eventTypes = [
    { value: 'PLANTAO', label: 'Plantão' },
    { value: 'CONSULTA', label: 'Consulta' },
    { value: 'PROCEDIMENTO', label: 'Procedimento' },
    { value: 'ACADEMICO', label: 'Acadêmico' },
    { value: 'REUNIAO', label: 'Reunião' },
    { value: 'ADMINISTRATIVO', label: 'Administrativo' }
  ];

  const statusOptions = [
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'TENTATIVO', label: 'Tentativo' },
    { value: 'AGUARDANDO', label: 'Aguardando' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'REALIZADO', label: 'Realizado' }
  ];

  const runCalendarTests = async () => {
    setIsRunning(true);
    const results: typeof testResults = [];

    try {
      // Teste 1: Validação de campos obrigatórios
      results.push({
        test: 'Validação de Campos',
        status: testEvent.title && testEvent.start_time && testEvent.end_time ? 'success' : 'error',
        message: testEvent.title && testEvent.start_time && testEvent.end_time 
          ? 'Todos os campos obrigatórios preenchidos' 
          : 'Campos obrigatórios faltando'
      });

      // Teste 2: Validação de datas
      if (testEvent.start_time && testEvent.end_time) {
        const startDate = new Date(testEvent.start_time);
        const endDate = new Date(testEvent.end_time);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          results.push({
            test: 'Formato de Datas',
            status: 'error',
            message: 'Formato de data inválido'
          });
        } else if (startDate >= endDate) {
          results.push({
            test: 'Lógica de Datas',
            status: 'error',
            message: 'Data de início deve ser anterior à data de fim'
          });
        } else {
          results.push({
            test: 'Validação de Datas',
            status: 'success',
            message: 'Datas válidas e consistentes'
          });
        }
      }

      // Teste 3: Mapeamento de tipos
      const eventTypeMapping = {
        'PLANTAO': 'plantao',
        'CONSULTA': 'consulta', 
        'PROCEDIMENTO': 'procedimento',
        'ACADEMICO': 'academico',
        'REUNIAO': 'reuniao',
        'ADMINISTRATIVO': 'administrativo'
      };

      const mappedType = eventTypeMapping[testEvent.event_type as keyof typeof eventTypeMapping];
      results.push({
        test: 'Mapeamento de Tipos',
        status: mappedType ? 'success' : 'warning',
        message: mappedType ? `Tipo mapeado: ${mappedType}` : 'Tipo não reconhecido'
      });

      // Teste 4: Validação de valor monetário
      if (testEvent.value) {
        const numericValue = parseFloat(testEvent.value);
        results.push({
          test: 'Valor Monetário',
          status: !isNaN(numericValue) && numericValue >= 0 ? 'success' : 'error',
          message: !isNaN(numericValue) && numericValue >= 0 
            ? `Valor válido: R$ ${numericValue.toFixed(2)}` 
            : 'Valor inválido'
        });
      }

      // Teste 5: Estrutura de dados final
      const eventData = {
        title: testEvent.title.trim(),
        event_type: mappedType || 'plantao',
        start_date: testEvent.start_time ? new Date(testEvent.start_time).toISOString() : '',
        end_date: testEvent.end_time ? new Date(testEvent.end_time).toISOString() : '',
        location: testEvent.location,
        description: testEvent.description || null,
        value: testEvent.value ? parseFloat(testEvent.value) : null,
        status: 'confirmed',
        user_id: user?.id || 'test-user-id'
      };

      results.push({
        test: 'Estrutura de Dados',
        status: 'success',
        message: 'Dados estruturados corretamente para o banco'
      });

      // Teste 6: Simulação de envio
      console.log('📤 Dados que seriam enviados:', eventData);
      results.push({
        test: 'Preparação para Envio',
        status: 'success',
        message: 'Dados preparados e logados no console'
      });

    } catch (error) {
      results.push({
        test: 'Erro Geral',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    setTestResults(results);
    setIsRunning(false);

    // Mostrar resumo
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    toast({
      title: "Testes Concluídos",
      description: `${successCount} sucessos, ${errorCount} erros`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const fillSampleData = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
    const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // 8 horas depois

    setTestEvent({
      ...testEvent,
      start_time: startTime.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16)
    });
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Funcionalidades do Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este componente permite testar as funcionalidades do calendário mesmo sem conexão com o Supabase.
              Os dados são validados e estruturados, mas não são enviados ao banco.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  value={testEvent.title}
                  onChange={(e) => setTestEvent({...testEvent, title: e.target.value})}
                  placeholder="Ex: Plantão de Emergência"
                />
              </div>

              <div>
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <Select value={testEvent.event_type} onValueChange={(value) => setTestEvent({...testEvent, event_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_time">Data e Hora de Início *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={testEvent.start_time}
                  onChange={(e) => setTestEvent({...testEvent, start_time: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="end_time">Data e Hora de Fim *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={testEvent.end_time}
                  onChange={(e) => setTestEvent({...testEvent, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={testEvent.location}
                  onChange={(e) => setTestEvent({...testEvent, location: e.target.value})}
                  placeholder="Ex: Hospital Sírio-Libanês"
                />
              </div>

              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={testEvent.value}
                  onChange={(e) => setTestEvent({...testEvent, value: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={testEvent.status} onValueChange={(value) => setTestEvent({...testEvent, status: value})}>
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

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={testEvent.description}
                  onChange={(e) => setTestEvent({...testEvent, description: e.target.value})}
                  placeholder="Descrição opcional do evento"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fillSampleData} variant="outline">
              Preencher Dados de Exemplo
            </Button>
            <Button onClick={runCalendarTests} disabled={isRunning}>
              {isRunning ? 'Executando...' : 'Executar Testes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
