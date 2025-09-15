import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou erro:', error, errorInfo);
    
    // Log specific network errors
    if (error?.message && (error.message.includes('Failed to fetch') || 
        error.message.includes('ERR_INTERNET_DISCONNECTED') ||
        error.message.includes('NetworkError'))) {
      console.error('🌐 Erro de rede detectado:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.includes('Failed to fetch') ||
                            this.state.error?.message.includes('ERR_INTERNET_DISCONNECTED') ||
                            this.state.error?.message.includes('NetworkError');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">
                    {isNetworkError ? 'Erro de Conectividade' : 'Erro na Aplicação'}
                  </div>
                  
                  <div className="text-sm">
                    {isNetworkError ? (
                      <>
                        <p>Não foi possível conectar com o servidor.</p>
                        <p className="mt-1 text-xs opacity-75">
                          Verifique sua conexão com a internet ou tente novamente.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Ocorreu um erro inesperado na aplicação.</p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs">Detalhes técnicos</summary>
                          <pre className="mt-1 text-xs overflow-auto max-h-32 bg-muted p-2 rounded">
                            {this.state.error?.message}
                          </pre>
                        </details>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Recarregar
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Alert>
                <AlertDescription>
                  <details>
                    <summary className="cursor-pointer font-medium">Debug Info (Dev Only)</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-48 bg-muted p-2 rounded">
                      {this.state.error?.stack}
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}