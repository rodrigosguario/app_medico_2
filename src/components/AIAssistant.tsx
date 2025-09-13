import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Brain, 
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  DollarSign,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface AIAssistantProps {
  className?: string;
  minimized?: boolean;
  onMinimizeToggle?: (minimized: boolean) => void;
}

const suggestedQuestions = [
  {
    icon: Calendar,
    text: "Como está minha agenda esta semana?",
    category: "Agenda"
  },
  {
    icon: TrendingUp,
    text: "Analise minha carga horária atual",
    category: "Análise"
  },
  {
    icon: FileText,
    text: "Crie um resumo dos meus plantões do mês",
    category: "Relatórios"
  },
  {
    icon: Clock,
    text: "Sugira otimizações na minha agenda",
    category: "Otimização"
  },
  {
    icon: DollarSign,
    text: "Resumo da situação financeira",
    category: "Financeiro"
  }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  className, 
  minimized = false, 
  onMinimizeToggle 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isFirstLoad && !minimized) {
      setMessages([{
        id: '1',
        content: `Olá! 👋 Sou seu assistente virtual para gestão médica. Posso ajudar você com:

🗓️ **Análise de agenda** - Verificar próximos compromissos e distribuição de horários
📊 **Insights de carga horária** - Analisar padrões de trabalho e sugerir otimizações  
📝 **Resumos de plantões** - Criar relatórios das suas atividades
💰 **Análise financeira** - Revisar rendimentos e despesas
📈 **Relatórios personalizados** - Gerar insights sobre sua produtividade

Como posso ajudar você hoje?`,
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setIsFirstLoad(false);
    }
  }, [minimized, isFirstLoad]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simple rule-based responses for now
      let response = generateSimpleResponse(messageText);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI processing
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Falha ao comunicar com o assistente. Tente novamente.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou reformule sua pergunta.",
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimpleResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('agenda') || lowerQuestion.includes('compromisso')) {
      return `📅 **Análise da Agenda**

Com base nos dados disponíveis, posso ver que:
• Você pode visualizar e gerenciar seus eventos no calendário
• Use as visualizações de Mês, Semana ou Dia para melhor organização
• Clique em qualquer dia para adicionar novos compromissos

**Dica:** Para uma visão completa da semana, use a visualização semanal no calendário.`;
    }
    
    if (lowerQuestion.includes('financeiro') || lowerQuestion.includes('dinheiro') || lowerQuestion.includes('receita')) {
      return `💰 **Situação Financeira**

Para análise completa da sua situação financeira:
• Acesse a página "Financeiro" no menu
• Adicione suas transações usando "Nova Transação"
• Monitore receitas e despesas por categoria
• Acompanhe impostos projetados

**Dica:** Mantenha sempre suas transações atualizadas para insights precisos.`;
    }
    
    if (lowerQuestion.includes('plantão') || lowerQuestion.includes('plantons')) {
      return `🏥 **Gerenciamento de Plantões**

Para otimizar seus plantões:
• Cadastre todos os plantões no calendário
• Use diferentes cores para cada tipo de evento
• Configure lembretes para não perder compromissos
• Acompanhe a carga horária na dashboard

**Dica:** Utilize os templates rápidos para criar plantões recorrentes.`;
    }
    
    if (lowerQuestion.includes('relatório') || lowerQuestion.includes('resumo')) {
      return `📊 **Relatórios e Resumos**

Você pode gerar relatórios através de:
• Dashboard principal - visão geral das métricas
• Página financeira - análise de receitas e despesas  
• Calendário - exportação de eventos (.ICS)
• Filtros por período para análises específicas

**Dica:** Use a exportação para backup dos seus dados.`;
    }
    
    if (lowerQuestion.includes('otimiz') || lowerQuestion.includes('melhora')) {
      return `⚡ **Otimização da Agenda**

Sugestões para melhorar sua produtividade:
• Agrupe consultas por local/hospital
• Deixe intervalos entre plantões longos
• Use a visualização semanal para planejar
• Configure notificações para lembretes

**Dica:** Revise sua agenda semanalmente para ajustes.`;
    }
    
    if (lowerQuestion.includes('ajuda') || lowerQuestion.includes('como')) {
      return `🤝 **Como Posso Ajudar**

Posso auxiliar com:
• **Agenda:** Análise de compromissos e otimização de horários
• **Financeiro:** Controle de receitas, despesas e impostos
• **Plantões:** Organização e distribuição de carga horária
• **Relatórios:** Resumos e insights sobre sua atividade
• **Configurações:** Ajuda com perfil e preferências

Digite sua dúvida específica ou use as perguntas sugeridas!`;
    }
    
    // Default response
    return `🤖 **Assistente Virtual**

Obrigado pela sua pergunta! Estou aqui para ajudar com:

• **Gestão de agenda** e compromissos
• **Controle financeiro** e análise de receitas
• **Organização de plantões** e carga horária
• **Relatórios** e insights personalizados

Tente perguntas mais específicas como:
- "Como está minha agenda esta semana?"
- "Resumo da situação financeira"
- "Analise minha carga horária"

**Dica:** Use as perguntas sugeridas para começar!`;
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  if (minimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => onMinimizeToggle?.(false)}
          className="rounded-full h-14 w-14 shadow-lg bg-medical hover:bg-medical-dark"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-medical/10 rounded-lg">
              <Brain className="h-5 w-5 text-medical" />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente Virtual</CardTitle>
              <p className="text-sm text-muted-foreground">IA especializada em gestão médica</p>
            </div>
          </div>
          {onMinimizeToggle && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onMinimizeToggle(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-full",
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-medical/10 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-medical" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%] break-words",
                    message.sender === 'user'
                      ? 'bg-medical text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 opacity-70",
                    message.sender === 'user' ? 'text-white' : 'text-muted-foreground'
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-medical/10 rounded-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-medical animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="text-sm text-muted-foreground">
                    Processando sua solicitação...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-4">
            <Separator className="mb-4" />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Perguntas sugeridas:</p>
              <div className="grid gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => handleSuggestedQuestion(question.text)}
                  >
                    <question.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm">{question.text}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {question.category}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pergunte sobre seus plantões, consultas ou finanças..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-medical hover:bg-medical-dark"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};