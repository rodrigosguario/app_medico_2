import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ICSManager from '@/components/ICSManager';
import Navigation from '@/components/Navigation';
import { CalendarSync } from '@/components/CalendarSync';
import { ZapierIntegration } from '@/components/ZapierIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Zap } from 'lucide-react';

const ImportExportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Importar & Exportar</h1>
            <p className="text-muted-foreground">Gerencie a sincronização de dados e calendários</p>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Status das Integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Calendários</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Funcionando
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Zapier</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Configurável
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendar">Sincronização de Calendários</TabsTrigger>
              <TabsTrigger value="zapier">Zapier</TabsTrigger>
              <TabsTrigger value="data">Importar/Exportar Dados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-4">
              <CalendarSync />
            </TabsContent>
            
            <TabsContent value="zapier" className="space-y-4">
              <ZapierIntegration />
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              <ICSManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ImportExportPage;