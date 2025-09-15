import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const DebugConnectionStatus: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [lastError, setLastError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { user } = useAuth();

  const testConnection = async () => {
    setConnectionStatus('checking');
    setLastError(null);
    const results: any[] = [];

    try {
      console.log('🧪 Iniciando teste de conectividade Supabase...');
      
      // Test 1: Basic connection
      console.log('🔍 Teste 1: Conexão básica');
      const { error: basicError } = await supabase.from('profiles').select('count', { 
        count: 'exact', 
        head: true 
      });
      
      results.push({
        test: 'Conexão básica',
        status: basicError ? 'failed' : 'success',
        error: basicError?.message
      });

      if (basicError) throw basicError;

      // Test 2: Auth status
      console.log('🔍 Teste 2: Status de autenticação');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      results.push({
        test: 'Autenticação',
        status: authError ? 'failed' : 'success',
        error: authError?.message,
        data: session ? 'Sessão ativa' : 'Sem sessão'
      });

      // Test 3: User profile query
      if (user) {
        console.log('🔍 Teste 3: Consulta de perfil');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        results.push({
          test: 'Consulta perfil',
          status: profileError ? 'failed' : 'success',
          error: profileError?.message,
          data: profileData ? 'Perfil encontrado' : 'Perfil não existe'
        });
      }

      // Test 4: Network connectivity
      console.log('🔍 Teste 4: Conectividade de rede');
      try {
        const response = await fetch('https://kmwsoppkrjzjioeadtqb.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3NvcHBrcmp6amlvZWFkdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODkzNzYsImV4cCI6MjA3MzM2NTM3Nn0.RsQd3r30Ezfi5x_Di2eLgkqm5SCDC9tlOIXIDRJcYMY'
          }
        });

        results.push({
          test: 'Conectividade rede',
          status: response.ok ? 'success' : 'failed',
          data: `Status: ${response.status}`
        });
      } catch (netError: any) {
        results.push({
          test: 'Conectividade rede',
          status: 'failed',
          error: netError.message
        });
      }

      setTestResults(results);
      setConnectionStatus('connected');
      console.log('✅ Testes de conectividade concluídos:', results);

    } catch (error: any) {
      console.error('❌ Erro nos testes de conectividade:', error);
      setLastError(error.message);
      setConnectionStatus('failed');
      setTestResults(results);
    }
  };

  useEffect(() => {
    testConnection();
  }, [user]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className={`border-2 ${
        connectionStatus === 'connected' ? 'border-green-500' : 
        connectionStatus === 'failed' ? 'border-red-500' : 
        'border-yellow-500'
      }`}>
        <div className="flex items-center gap-2">
          {connectionStatus === 'checking' && <RefreshCw className="h-4 w-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {connectionStatus === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
          
          <div className="flex-1">
            <div className="font-medium">
              Debug Supabase
            </div>
            <AlertDescription className="mt-1">
              <Badge variant={
                connectionStatus === 'connected' ? 'default' : 
                connectionStatus === 'failed' ? 'destructive' : 
                'secondary'
              }>
                {connectionStatus === 'checking' && 'Testando...'}
                {connectionStatus === 'connected' && 'Conectado'}
                {connectionStatus === 'failed' && 'Erro'}
              </Badge>

              {lastError && (
                <div className="text-xs text-red-600 mt-1">
                  {lastError}
                </div>
              )}

              <div className="mt-2 space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs flex items-center gap-1">
                    {result.status === 'success' ? 
                      <CheckCircle className="h-3 w-3 text-green-500" /> : 
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    }
                    <span>{result.test}</span>
                    {result.error && <span className="text-red-600">- {result.error}</span>}
                  </div>
                ))}
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 h-6 text-xs"
                onClick={testConnection}
                disabled={connectionStatus === 'checking'}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
                Testar
              </Button>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};