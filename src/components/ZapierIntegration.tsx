import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Zap, ExternalLink, TestTube, CheckCircle } from 'lucide-react';

interface ZapierIntegrationProps {
  onWebhookUrlChange?: (url: string) => void;
  onSyncEnabledChange?: (enabled: boolean) => void;
}

export const ZapierIntegration = ({ onWebhookUrlChange, onSyncEnabledChange }: ZapierIntegrationProps) => {
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('zapier_webhook_url') || '');
  const [syncEnabled, setSyncEnabled] = useState(localStorage.getItem('zapier_sync_enabled') === 'true');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const handleWebhookUrlChange = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('zapier_webhook_url', url);
    onWebhookUrlChange?.(url);
    setLastTestResult(null); // Reset test result when URL changes
  };

  const handleSyncEnabledChange = (enabled: boolean) => {
    setSyncEnabled(enabled);
    localStorage.setItem('zapier_sync_enabled', enabled.toString());
    onSyncEnabledChange?.(enabled);
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook do Zapier",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    setLastTestResult(null);
    console.log("Testando webhook Zapier:", webhookUrl);

    try {
      const testData = {
        test: true,
        message: "Teste de conexão do MediSync",
        timestamp: new Date().toISOString(),
        source: "MediSync Calendar",
        event_data: {
          title: "Teste de Evento",
          date: new Date().toISOString(),
          type: "test"
        }
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Required for webhook calls
        body: JSON.stringify(testData),
      });

      // With no-cors, we can't check response status, so we assume success
      setLastTestResult('success');
      toast({
        title: "Teste Enviado",
        description: "O teste foi enviado para o Zapier. Verifique o histórico do seu Zap para confirmar o recebimento.",
      });
    } catch (error) {
      console.error("Erro ao testar webhook:", error);
      setLastTestResult('error');
      toast({
        title: "Erro no Teste",
        description: "Falha ao enviar teste. Verifique a URL e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const triggerEventWebhook = async (eventData: any) => {
    if (!webhookUrl || !syncEnabled) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          event: "calendar_event",
          timestamp: new Date().toISOString(),
          data: eventData
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar evento para Zapier:", error);
    }
  };

  // Expose function for use by other components
  React.useEffect(() => {
    (window as any).triggerZapierWebhook = triggerEventWebhook;
  }, [webhookUrl, syncEnabled]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Integração Zapier
        </CardTitle>
        <CardDescription>
          Conecte com 5000+ aplicativos incluindo outros sistemas de gestão de plantões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">URL do Webhook Zapier</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              type="url"
              placeholder="Cole aqui sua URL do webhook Zapier..."
              value={webhookUrl}
              onChange={(e) => handleWebhookUrlChange(e.target.value)}
              className="flex-1"
            />
            {lastTestResult === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Cole aqui a URL do webhook gerada no seu Zap
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={handleSyncEnabledChange}
          />
          <Label htmlFor="sync-enabled">Ativar sincronização automática</Label>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testWebhook} 
            disabled={!webhookUrl || isTestingWebhook}
            variant="outline"
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTestingWebhook ? 'Testando...' : 'Testar Conexão'}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => window.open('https://zapier.com/apps/webhook/help', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Como configurar:</h4>
          <ol className="text-sm space-y-1 text-muted-foreground">
            <li>1. Acesse zapier.com e crie um novo Zap</li>
            <li>2. Escolha "Webhooks by Zapier" como trigger</li>
            <li>3. Selecione "Catch Hook" e copie a URL gerada</li>
            <li>4. Cole a URL acima e teste a conexão</li>
            <li>5. Configure a ação para o app de destino</li>
          </ol>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Dados enviados:</h4>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <li>• Novos eventos criados</li>
            <li>• Alterações em eventos existentes</li>
            <li>• Dados de paciente e horário</li>
            <li>• Tipo de evento (consulta, plantão, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};