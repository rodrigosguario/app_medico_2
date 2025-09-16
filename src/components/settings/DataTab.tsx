import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Trash2 } from 'lucide-react';

export const DataTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('📤 Exportando dados do usuário:', user.id);

      // Export user data (events, profile, hospitals, etc.)
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);

      const { data: financials } = await supabase
        .from('financial_events')
        .select('*')
        .eq('user_id', user.id);

      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: calendars } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile,
        events: events || [],
        financials: financials || [],
        hospitals: hospitals || [],
        calendars: calendars || [],
        exportDate: new Date().toISOString(),
        exportedBy: user.email
      };

      console.log('✅ Dados coletados:', {
        events: events?.length || 0,
        financials: financials?.length || 0,
        hospitals: hospitals?.length || 0,
        calendars: calendars?.length || 0
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medico-agenda-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Dados exportados',
        description: 'Backup dos seus dados baixado com sucesso.',
      });
    } catch (error) {
      console.error('💥 Erro na exportação:', error);
      
      let errorMessage = 'Não foi possível exportar os dados.';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          errorMessage = 'Sem permissão para acessar dados.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro na exportação',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Exportar Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Baixar backup completo dos seus dados em formato JSON
                </p>
              </div>
              <Button onClick={handleExportData} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Exportando...' : 'Exportar'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-destructive">Excluir Conta</h4>
                <p className="text-sm text-muted-foreground">
                  Remover permanentemente todos os seus dados
                </p>
              </div>
              <Button variant="destructive" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Informações sobre seus dados</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Seus dados são armazenados de forma segura no Supabase</li>
              <li>• Você pode exportar todos os seus dados a qualquer momento</li>
              <li>• A exclusão da conta é permanente e não pode ser desfeita</li>
              <li>• Entre em contato conosco se precisar de ajuda com seus dados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};