import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart,
  Plus,
  Download,
  Filter,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { AIAssistant } from '@/components/AIAssistant';
import { AssistantButton } from '@/components/AssistantButton';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import Navigation from '../components/Navigation';
import { cn } from '@/lib/utils';
import { FinancialTransactionDialog } from '@/components/FinancialTransactionDialog';

const FinancialPage: React.FC = () => {
  const { financialEvents, loading, error, createFinancialEvent } = useFinancialEvents();
  const { isMinimized, isVisible, showAssistant, hideAssistant, toggleMinimized } = useAIAssistant();
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  // Calculate financial summary from financial events
  const calculateSummary = () => {
    if (!financialEvents || financialEvents.length === 0) return null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthEvents = financialEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    const revenue = currentMonthEvents
      .filter(event => event.type === 'income')
      .reduce((sum, event) => sum + parseFloat(event.amount.toString()), 0);

    const expenses = currentMonthEvents
      .filter(event => event.type === 'expense')
      .reduce((sum, event) => sum + parseFloat(event.amount.toString()), 0);

    const confirmedRevenue = currentMonthEvents
      .filter(event => event.type === 'income' && event.is_paid)
      .reduce((sum, event) => sum + parseFloat(event.amount.toString()), 0);

    const pendingRevenue = revenue - confirmedRevenue;

    // Group by categories
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    currentMonthEvents.forEach(event => {
      const amount = parseFloat(event.amount.toString());
      if (event.type === 'income') {
        revenueByCategory[event.category || 'Outros'] = (revenueByCategory[event.category || 'Outros'] || 0) + amount;
      } else {
        expensesByCategory[event.category || 'Outros'] = (expensesByCategory[event.category || 'Outros'] || 0) + amount;
      }
    });

    return {
      period: {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
        description: `${monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
      },
      revenue: {
        total: revenue,
        confirmed: confirmedRevenue,
        pending: pendingRevenue,
        by_category: revenueByCategory
      },
      expenses: {
        total: expenses,
        by_category: expensesByCategory
      },
      net_income: revenue - expenses,
      projected_taxes: revenue * 0.275 // Estimate 27.5% tax
    };
  };

  const summary = calculateSummary();

  const handleCreateTransaction = async (transactionData: any) => {
    console.log('Creating transaction:', transactionData);
    await createFinancialEvent({
      ...transactionData,
      amount: parseFloat(transactionData.amount),
    });
  };

  const handleOpenTransactionDialog = () => {
    console.log('Opening transaction dialog');
    setIsTransactionDialogOpen(true);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      'PLANTAO': <CreditCard className="h-4 w-4 text-plantao" />,
      'CONSULTA': <Receipt className="h-4 w-4 text-consulta" />,
      'PROCEDIMENTO': <Banknote className="h-4 w-4 text-procedimento" />,
      'COMBUSTIVEL': <TrendingDown className="h-4 w-4 text-destructive" />,
      'EDUCACAO': <TrendingDown className="h-4 w-4 text-warning" />,
      'EQUIPAMENTOS': <TrendingDown className="h-4 w-4 text-muted-foreground" />
    };
    return icons[category] || <DollarSign className="h-4 w-4 text-muted-foreground" />;
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'income' ? 'text-success' : 'text-destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="flex">
          <main className={cn(
            "flex-1 transition-all duration-300",
            !isMinimized && isVisible ? "mr-96" : ""
          )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="h-8 w-64 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-96 bg-muted rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* AI Assistant Sidebar */}
          {isVisible && (
            <aside className={cn(
              "fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-40 transition-transform duration-300",
              isMinimized ? "translate-x-full" : "translate-x-0"
            )}>
              <div className="h-full pt-16">
                <AIAssistant 
                  className="h-full"
                  minimized={isMinimized}
                  onMinimizeToggle={toggleMinimized}
                />
              </div>
            </aside>
          )}

          {/* Minimized Assistant Button */}
          {isMinimized && (
            <AIAssistant 
              minimized={true}
              onMinimizeToggle={toggleMinimized}
            />
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">Erro ao carregar dados financeiros: {error}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        </main>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Nenhum dado financeiro</h3>
              <p className="text-muted-foreground">Adicione transações para ver seu resumo financeiro</p>
            </div>
            <Button onClick={handleOpenTransactionDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Transação
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const revenuePercentage = summary.revenue.total > 0 ? (summary.revenue.confirmed / summary.revenue.total) * 100 : 0;
  const taxRate = summary.revenue.total > 0 ? (summary.projected_taxes / summary.revenue.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <main className={cn(
          "flex-1 transition-all duration-300",
          !isMinimized && isVisible ? "mr-96" : ""
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Gestão Financeira</h2>
                  <p className="text-muted-foreground">
                    Período: {summary.period.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AssistantButton 
                    onClick={showAssistant}
                    variant="outline" 
                    size="sm" 
                  />
                  
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    className="bg-success hover:bg-success/90 text-success-foreground"
                    onClick={handleOpenTransactionDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Transação
                  </Button>
                </div>
              </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(summary.revenue.total)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="text-success">
                    Confirmado: {formatCurrency(summary.revenue.confirmed)}
                  </span>
                </div>
                <Progress value={revenuePercentage} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesas
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(summary.expenses.total)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.revenue.total > 0 
                    ? ((summary.expenses.total / summary.revenue.total) * 100).toFixed(1) 
                    : '0'}% da receita
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Líquida
                </CardTitle>
                <DollarSign className="h-4 w-4 text-medical" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-medical">
                  {formatCurrency(summary.net_income)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Após despesas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Impostos Projetados
                </CardTitle>
                <Receipt className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(summary.projected_taxes)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {taxRate.toFixed(1)}% da receita bruta
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receitas por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-success" />
                      Receitas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.keys(summary.revenue.by_category).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhuma receita registrada</p>
                    ) : (
                      Object.entries(summary.revenue.by_category).map(([category, amount]) => {
                        const percentage = (amount / summary.revenue.total) * 100;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(category)}
                                <span className="text-sm font-medium">{category}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{formatCurrency(amount)}</div>
                                <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Despesas por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      Despesas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.keys(summary.expenses.by_category).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhuma despesa registrada</p>
                    ) : (
                      Object.entries(summary.expenses.by_category).map(([category, amount]) => {
                        const percentage = (amount / summary.expenses.total) * 100;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(category)}
                                <span className="text-sm font-medium">{category}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{formatCurrency(amount)}</div>
                                <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>
                    Histórico de receitas e despesas do período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialEvents.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        Nenhuma transação encontrada
                      </p>
                    ) : (
                      financialEvents.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                            }`}>
                              {getCategoryIcon(transaction.category || 'Outros')}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{transaction.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{transaction.category || 'Outros'}</span>
                                <span>•</span>
                                <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                <span>•</span>
                                <Badge variant={transaction.is_paid ? "default" : "outline"} className="text-xs">
                                  {transaction.is_paid ? 'Pago' : 'Pendente'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount.toString()))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.payment_method?.replace('_', ' ') || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Análise detalhada das categorias de receita e despesa será implementada aqui.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tendências Mensais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Gráficos de tendências e comparações mensais serão exibidos aqui.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>

    {/* AI Assistant Sidebar */}
    {isVisible && (
      <aside className={cn(
        "fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-40 transition-transform duration-300",
        isMinimized ? "translate-x-full" : "translate-x-0"
      )}>
        <div className="h-full pt-16">
          <AIAssistant 
            className="h-full"
            minimized={isMinimized}
            onMinimizeToggle={toggleMinimized}
          />
        </div>
      </aside>
    )}

    {/* Minimized Assistant Button */}
    {isMinimized && (
      <AIAssistant 
        minimized={true}
        onMinimizeToggle={toggleMinimized}
      />
    )}
  </div>

  {/* Transaction Dialog */}
  <FinancialTransactionDialog
    open={isTransactionDialogOpen}
    onOpenChange={setIsTransactionDialogOpen}
    onSubmit={handleCreateTransaction}
  />
</div>
  );
};

export default FinancialPage;