import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, includeData = true } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let contextData = '';
    
    if (includeData && userId) {
      // Fetch user data for context
      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          calendars(name, color),
          hospitals(name, address)
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: financialEvents } = await supabase
        .from('financial_events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(50);

      // Process data for context
      if (events && events.length > 0) {
        const now = new Date();
        const upcomingEvents = events.filter(event => new Date(event.start_date) > now).slice(0, 10);
        const recentEvents = events.filter(event => new Date(event.start_date) <= now).slice(-10);
        
        // Calculate workload metrics
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        
        const thisWeekEvents = events.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate >= thisWeekStart && eventDate <= thisWeekEnd;
        });

        const totalHoursThisWeek = thisWeekEvents.reduce((total, event) => {
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        const eventsByType = events.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {});

        contextData = `
DADOS DO PERFIL:
- Nome: ${profile?.name || 'Usuário'}
- Especialidade: ${profile?.specialty || 'Não informada'}
- CRM: ${profile?.crm || 'Não informado'}

ESTATÍSTICAS DA SEMANA ATUAL:
- Total de horas: ${totalHoursThisWeek.toFixed(1)}h
- Eventos esta semana: ${thisWeekEvents.length}
- Distribuição por tipo: ${JSON.stringify(eventsByType, null, 2)}

PRÓXIMOS EVENTOS (${upcomingEvents.length}):
${upcomingEvents.map(event => `
- ${event.title} (${event.event_type})
  Data: ${new Date(event.start_date).toLocaleDateString('pt-BR')} às ${new Date(event.start_date).toLocaleTimeString('pt-BR')}
  Local: ${event.location || 'Não especificado'}
  Status: ${event.status}
`).join('')}

EVENTOS RECENTES (${recentEvents.length}):
${recentEvents.map(event => `
- ${event.title} (${event.event_type})
  Data: ${new Date(event.start_date).toLocaleDateString('pt-BR')}
  Status: ${event.status}
`).join('')}

DADOS FINANCEIROS RECENTES:
${financialEvents ? financialEvents.slice(0, 5).map(finance => `
- ${finance.title}: R$ ${finance.amount}
  Tipo: ${finance.type}
  Data: ${new Date(finance.date).toLocaleDateString('pt-BR')}
  Pago: ${finance.is_paid ? 'Sim' : 'Não'}
`).join('') : 'Nenhum dado financeiro encontrado'}
        `;
      }
    }

    const systemPrompt = `Você é um assistente virtual especializado em gestão médica e organização de agenda para profissionais da saúde.

SUAS CAPACIDADES:
1. Análise de carga horária e sugestões de otimização
2. Resumos de plantões e atividades
3. Insights sobre padrões de trabalho
4. Sugestões de organização da agenda
5. Análise financeira básica
6. Relatórios de produtividade
7. Alertas sobre sobrecarga de trabalho
8. Sugestões de melhor distribuição de tempo

COMO RESPONDER:
- Seja prático e objetivo
- Use dados específicos quando disponíveis
- Dê sugestões acionáveis
- Mantenha tom profissional mas amigável
- Foque em eficiência e bem-estar do médico
- Use emojis ocasionalmente para deixar a conversa mais amigável

DADOS DISPONÍVEIS DO USUÁRIO:
${contextData || 'Nenhum dado carregado no momento'}

Responda sempre em português brasileiro e seja específico com base nos dados fornecidos.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Nenhuma resposta da IA');
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      contextUsed: !!contextData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});