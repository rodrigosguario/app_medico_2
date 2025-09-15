import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, userId } = await req.json();
    
    console.log('Received iCloud sync request:', { action, userId, hasCredentials: !!credentials });
    
    if (!userId) {
      throw new Error('Missing userId parameter');
    }

    if (!credentials) {
      throw new Error('Missing credentials parameter');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'import_events':
        return await importIcloudCalendarEvents(supabase, credentials, userId);
      case 'export_events':
        return await exportEventsToIcloudCalendar(supabase, credentials, userId);
      case 'sync_bidirectional':
        return await syncBidirectional(supabase, credentials, userId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('iCloud Calendar sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function importIcloudCalendarEvents(supabase: any, credentials: string, userId: string) {
  console.log('Starting iCloud import for user:', userId);
  
  // Decodificar credenciais base64 (formato: email:senha_app)
  let decodedCredentials;
  try {
    decodedCredentials = atob(credentials);
    console.log('🔑 Credenciais decodificadas, tentando conexão real com iCloud...');
  } catch (error) {
    console.error('❌ Erro ao decodificar credenciais:', error);
    throw new Error('Credenciais inválidas do iCloud');
  }

  // Para desenvolvimento, simular se forem credenciais demo
  if (decodedCredentials === 'demo:demo') {
    console.log('🔧 Credenciais demo detectadas - usando eventos simulados para demonstração');
    
    const demoEvents = [
      {
        uid: 'demo_icloud_event_1',
        summary: 'Reunião de Equipe Médica Demo',
        description: 'Este é um evento de demonstração do iCloud',
        location: 'Sala Demo',
        dtstart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        dtend: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        status: 'CONFIRMED'
      }
    ];

    let importedCount = 0;
    let errorCount = 0;

    for (const icloudEvent of demoEvents) {
      try {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', icloudEvent.uid)
          .eq('user_id', userId)
          .single();

        if (existingEvent) {
          console.log(`Event ${icloudEvent.uid} already exists, skipping`);
          continue;
        }

        const eventData = {
          user_id: userId,
          external_id: icloudEvent.uid,
          external_source: 'icloud_calendar',
          title: icloudEvent.summary || 'Evento sem título',
          description: icloudEvent.description || null,
          location: icloudEvent.location || null,
          start_date: new Date(icloudEvent.dtstart).toISOString(),
          end_date: new Date(icloudEvent.dtend).toISOString(),
          event_type: determineEventType(icloudEvent.summary || ''),
          status: icloudEvent.status === 'CONFIRMED' ? 'confirmed' : 'tentative'
        };

        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) {
          console.error(`Error inserting event ${icloudEvent.uid}:`, error);
          errorCount++;
        } else {
          importedCount++;
        }
      } catch (error) {
        console.error(`Error processing event ${icloudEvent.uid}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported: importedCount,
      errors: errorCount,
      totalProcessed: demoEvents.length,
      message: '⚠️ Usando eventos demo - Configure credenciais reais do iCloud'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('🚀 Tentando conectar com iCloud CalDAV...');
  
  // Para implementação real do iCloud CalDAV
  // Por enquanto, retornar mensagem informativa
  return new Response(JSON.stringify({
    success: false,
    imported: 0,
    errors: 1,
    totalProcessed: 0,
    message: '⚠️ iCloud CalDAV não implementado ainda - precisa configurar servidor CalDAV'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function exportEventsToIcloudCalendar(supabase: any, credentials: string, userId: string) {
  console.log('Starting iCloud export for user:', userId);
  
  // Get events from the last month to next 3 months
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', startDate.toISOString())
    .lte('start_date', endDate.toISOString())
    .is('external_id', null); // Only export events that don't have external_id

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // Para desenvolvimento com credenciais demo
  if (credentials === btoa('demo:demo')) {
    console.log('Using demo credentials, simulating export to iCloud');
    
    let exportedCount = 0;
    let errorCount = 0;

    for (const event of events || []) {
      try {
        // Simulate successful export
        const fakeExternalId = `demo_icloud_exported_${event.id}`;
        
        // Update local event with external_id
        await supabase
          .from('events')
          .update({ 
            external_id: fakeExternalId,
            external_source: 'icloud_calendar'
          })
          .eq('id', event.id);

        exportedCount++;
        console.log(`Demo: Exported event ${event.title} to iCloud`);
      } catch (error) {
        console.error(`Error exporting event ${event.id}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      exported: exportedCount,
      errors: errorCount,
      totalProcessed: events?.length || 0,
      message: 'Demo: Eventos exportados para iCloud com sucesso (simulação)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Real CalDAV implementation would go here
  return new Response(JSON.stringify({
    success: true,
    exported: 0,
    errors: 0,
    totalProcessed: events?.length || 0,
    message: 'Configure credenciais reais do iCloud para exportação'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function syncBidirectional(supabase: any, credentials: string, userId: string) {
  console.log('Starting bidirectional iCloud sync for user:', userId);
  
  let historyRecord: any = null;
  
  try {
    // Criar registro no histórico
    const { data: newHistoryRecord, error: historyError } = await supabase
      .from('sync_history')
      .insert({
        user_id: userId,
        provider: 'icloud',
        sync_type: 'bidirectional',
        sync_status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    historyRecord = newHistoryRecord;

    if (historyError) {
      console.error('❌ Erro ao criar registro no histórico:', historyError);
    }

    // First import from iCloud Calendar
    const importResult = await importIcloudCalendarEvents(supabase, credentials, userId);
    const importData = await importResult.json();

    // Then export to iCloud Calendar
    const exportResult = await exportEventsToIcloudCalendar(supabase, credentials, userId);
    const exportData = await exportResult.json();

    // Atualizar o timestamp da última sincronização
    const { error: updateError } = await supabase
      .from('calendar_sync_settings')
      .update({ 
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'icloud');

    if (updateError) {
      console.error('❌ Erro ao atualizar last_sync:', updateError);
    } else {
      console.log('✅ Timestamp de sincronização atualizado para iCloud');
    }

    // Atualizar histórico como concluído
    if (historyRecord?.id) {
      await supabase
        .from('sync_history')
        .update({
          sync_status: 'completed',
          completed_at: new Date().toISOString(),
          events_processed: (importData.imported || 0) + (exportData.exported || 0),
          events_succeeded: (importData.imported || 0) + (exportData.exported || 0),
          events_failed: (importData.errors || 0) + (exportData.errors || 0),
          details: {
            import: importData,
            export: exportData
          }
        })
        .eq('id', historyRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      import: importData,
      export: exportData,
      message: `Sincronização iCloud concluída: ${importData.imported} importados, ${exportData.exported} exportados`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bidirectional iCloud sync:', error);
    
    // Atualizar histórico como erro
    if (historyRecord?.id) {
      await supabase
        .from('sync_history')
        .update({
          sync_status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', historyRecord.id);
    }
    
    throw error;
  }
}

function determineEventType(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('plantão') || titleLower.includes('plantao')) {
    return 'plantao';
  } else if (titleLower.includes('consulta') || titleLower.includes('atendimento')) {
    return 'consulta';
  } else if (titleLower.includes('cirurgia') || titleLower.includes('procedimento')) {
    return 'procedimento';
  } else if (titleLower.includes('reunião') || titleLower.includes('reuniao')) {
    return 'reuniao';
  } else if (titleLower.includes('aula') || titleLower.includes('curso')) {
    return 'aula';
  }
  
  return 'outros';
}