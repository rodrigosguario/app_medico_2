import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, Settings } from 'lucide-react';

export const GoogleClientSetup: React.FC = () => {
  return (
    <Alert className="my-4">
      <Settings className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p><strong>Para conectar ao Google Calendar:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Acesse o <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a></li>
            <li>Crie um novo projeto ou selecione um existente</li>
            <li>Habilite a <strong>Google Calendar API</strong></li>
            <li>Crie credenciais do tipo <strong>OAuth 2.0 Client ID</strong></li>
            <li>Configure os domínios autorizados:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><code>https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com</code></li>
                <li><code>http://localhost:3000</code> (para desenvolvimento)</li>
              </ul>
            </li>
            <li>Substitua o Client ID no arquivo <code>src/hooks/useCalendarSync.ts</code></li>
          </ol>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Google Console
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default GoogleClientSetup;