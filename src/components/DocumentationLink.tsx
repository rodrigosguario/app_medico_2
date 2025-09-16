import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Book, Settings, Key } from 'lucide-react';

export const DocumentationLink: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Configuração Necessária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Para usar as integrações de calendário e assistente de IA, você precisa configurar as credenciais OAuth e API keys.
        </p>
        
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <h4 className="font-medium">Google Calendar OAuth</h4>
                <p className="text-sm text-muted-foreground">Configure Client ID no Google Cloud Console</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Configurar
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <h4 className="font-medium">Microsoft Graph API</h4>
                <p className="text-sm text-muted-foreground">Configure Client ID no Azure Portal</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Configurar
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-primary" />
              <div>
                <h4 className="font-medium">OpenAI API Key</h4>
                <p className="text-sm text-muted-foreground">Para funcionalidade do assistente de IA</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Obter API Key
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Nota:</strong> Este é um aplicativo real que requer configuração adequada das credenciais.
            Consulte a documentação do projeto para instruções detalhadas de configuração.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};