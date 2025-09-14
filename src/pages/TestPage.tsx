import React from 'react';
import Navigation from '@/components/Navigation';
import { SystemTestSuite } from '@/components/SystemTestSuite';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Sistema de Testes</h1>
            <p className="text-muted-foreground">
              Verificação completa de todas as funcionalidades da aplicação
            </p>
          </div>
          
          <SystemTestSuite />
        </div>
      </div>
    </div>
  );
};

export default TestPage;