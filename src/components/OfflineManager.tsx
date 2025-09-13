import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Upload, Database, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { offlineStorage, formatBytes } from '@/utils/offlineStorage';

const OfflineManager: React.FC = () => {
  const { syncStatus, syncPendingActions, clearOfflineData } = useSupabaseSync();
  const [storageUsage, setStorageUsage] = useState(0);

  useEffect(() => {
    updateStorageUsage();
  }, [syncStatus]);

  const updateStorageUsage = () => {
    const stats = offlineStorage.getStorageStats();
    const maxStorage = 5 * 1024 * 1024; // 5MB
    setStorageUsage(Math.floor((stats.sizeBytes / maxStorage) * 100));
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora há pouco';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dias atrás`;
  };

  const offlineStats = offlineStorage.getStorageStats();

  const handleExportOfflineData = () => {
    try {
      offlineStorage.exportBackup();
    } catch (error) {
      console.error('Error exporting backup:', error);
    }
  };

  const pendingActions = offlineStorage.getPendingActions().slice(0, 3); // Show last 3

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Modo Offline</h2>
          <p className="text-muted-foreground">
            Gerencie dados offline e sincronização
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus.isOnline ? (
            <Badge variant="outline" className="bg-success/10 text-success">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Status de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-warning" />
            )}
            Status da Conectividade
          </CardTitle>
          <CardDescription>
            {syncStatus.isOnline 
              ? 'Conectado à internet. Dados sendo sincronizados automaticamente.'
              : 'Sem conexão. Trabalhando em modo offline.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-foreground">{offlineStats.itemCount}</div>
              <div className="text-xs text-muted-foreground">Itens Salvos</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-warning">{offlineStats.pendingActions}</div>
              <div className="text-xs text-muted-foreground">Ações Pendentes</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-medical">{formatBytes(offlineStats.sizeBytes)}</div>
              <div className="text-xs text-muted-foreground">Armazenamento</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-muted-foreground">
                {formatLastSync(offlineStats.lastSync).split(' ')[0]}
              </div>
              <div className="text-xs text-muted-foreground">Última Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Sincronização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-medical" />
              Sincronização
            </CardTitle>
            <CardDescription>
              Sincronize dados offline com o servidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Última sincronização:</span>
                <span className="text-muted-foreground">{formatLastSync(offlineStats.lastSync)}</span>
              </div>
              {offlineStats.pendingActions > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Ações pendentes:</span>
                  <Badge variant="outline" className="text-warning">
                    {offlineStats.pendingActions}
                  </Badge>
                </div>
              )}
            </div>

            <Button 
              onClick={syncPendingActions}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="w-full bg-medical hover:bg-medical-dark text-medical-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>

            {syncStatus.error && (
              <div className="text-sm text-destructive text-center">
                ✗ {syncStatus.error}
              </div>
            )}
            {!syncStatus.error && syncStatus.lastSync && !syncStatus.isSyncing && (
              <div className="text-sm text-success text-center">
                ✓ Última sincronização: {formatLastSync(syncStatus.lastSync)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-success" />
              Armazenamento Local
            </CardTitle>
            <CardDescription>
              Gerencie o espaço de armazenamento offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usado:</span>
                <span>{formatBytes(offlineStats.sizeBytes)} de 5 MB</span>
              </div>
              <Progress value={storageUsage} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {storageUsage}% utilizado
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportOfflineData}
              >
                <Download className="h-3 w-3 mr-1" />
                Backup
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearOfflineData}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Pendentes */}
      {offlineStats.pendingActions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-warning" />
              Ações Pendentes de Sincronização
            </CardTitle>
            <CardDescription>
              Estas ações serão executadas quando a conexão for restabelecida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-warning">
                      {action.type === 'CREATE' ? 'Criar' : action.type === 'UPDATE' ? 'Atualizar' : 'Deletar'}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{action.data?.title || action.resource}</p>
                      <p className="text-xs text-muted-foreground">{action.resource}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatLastSync(new Date(action.timestamp))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações Offline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-medical" />
            Configurações Offline
          </CardTitle>
          <CardDescription>
            Configure o comportamento do modo offline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="text-sm font-medium">Sincronização Automática</p>
                <p className="text-xs text-muted-foreground">Sincroniza automaticamente quando online</p>
              </div>
              <Badge variant="outline" className="text-success">Ativa</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="text-sm font-medium">Cache de Imagens</p>
                <p className="text-xs text-muted-foreground">Salva imagens para visualização offline</p>
              </div>
              <Badge variant="outline" className="text-success">Ativa</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="text-sm font-medium">Limpeza Automática</p>
                <p className="text-xs text-muted-foreground">Remove dados antigos automaticamente (30 dias)</p>
              </div>
              <Badge variant="outline" className="text-success">Ativa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineManager;