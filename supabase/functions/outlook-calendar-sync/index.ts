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
    const { action, outlookAccessToken, userId } = await req.json();
    
    console.log('Received request:', { action, userId, hasToken: !!outlookAccessToken });
    
    if (!userId) {
      throw new Error('Missing userId parameter');
    }

    if (!outlookAccessToken) {
      throw new Error('Missing outlookAccessToken parameter');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'import_events':
        return await importOutlookCalendarEvents(supabase, outlookAccessToken, userId);
      case 'export_events':
        return await exportEventsToOutlookCalendar(supabase, outlookAccessToken, userId);
      case 'sync_bidirectional':
        return await syncBidirectional(supabase, outlookAccessToken, userId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Outlook Calendar sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function importOutlookCalendarEvents(supabase: any, accessToken: string, userId: string) {
  console.log('Starting import for user:', userId);
  
  // Para desenvolvimento, vamos simular eventos do Outlook
  if (accessToken.startsWith('demo_')) {
    console.log('Using demo token, simulating Outlook events');
    
    const demoEvents = [
      {
        id: 'demo_event_1',
        subject: 'Consulta Cardiológica',
        body: { content: 'Consulta de rotina com paciente' },
        location: { displayName: 'Hospital Central' },
        start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
        responseStatus: { response: 'accepted' }
      },
      {
        id: 'demo_event_2',
        subject: 'Plantão Noturno',
        body: { content: 'Plantão de 12 horas' },
        location: { displayName: 'UTI Cardíaca' },
        start: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString() },
        responseStatus: { response: 'accepted' }
      }
    ];

    let importedCount = 0;
    let errorCount = 0;

    for (const outlookEvent of demoEvents) {
      try {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('external_id', outlookEvent.id)
          .eq('user_id', userId)
          .single();

        if (existingEvent) {
          console.log(`Event ${outlookEvent.id} already exists, skipping`);
          continue;
        }

        const eventData = {
          user_id: userId,
          external_id: outlookEvent.id,
          external_source: 'outlook_calendar',
          title: outlookEvent.subject || 'Evento sem título',
          description: outlookEvent.body?.content || null,
          location: outlookEvent.location?.displayName || null,
          start_date: new Date(outlookEvent.start.dateTime).toISOString(),
          end_date: new Date(outlookEvent.end.dateTime).toISOString(),
          event_type: determineEventType(outlookEvent.subject || ''),
          status: outlookEvent.responseStatus?.response === 'accepted' ? 'confirmed' : 'tentative'
        };

        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) {
          console.error(`Error inserting event ${outlookEvent.id}:`, error);
          errorCount++;
        } else {
          importedCount++;
        }
      } catch (error) {
        console.error(`Error processing event ${outlookEvent.id}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported: importedCount,
      errors: errorCount,
      totalProcessed: demoEvents.length,
      message: 'Demo: Eventos simulados importados com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Real Microsoft Graph API call (requires valid token)
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endTime = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${startTime}' and start/dateTime le '${endTime}'&$orderby=start/dateTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Microsoft Graph API error: ${response.status}`);
  }

  const data = await response.json();
  const events = data.value || [];

  let importedCount = 0;
  let errorCount = 0;

  for (const outlookEvent of events) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('external_id', outlookEvent.id)
        .eq('user_id', userId)
        .single();

      if (existingEvent) {
        console.log(`Event ${outlookEvent.id} already exists, skipping`);
        continue;
      }

      const eventData = {
        user_id: userId,
        external_id: outlookEvent.id,
        external_source: 'outlook_calendar',
        title: outlookEvent.subject || 'Evento sem título',
        description: outlookEvent.body?.content || null,
        location: outlookEvent.location?.displayName || null,
        start_date: new Date(outlookEvent.start.dateTime).toISOString(),
        end_date: new Date(outlookEvent.end.dateTime).toISOString(),
        event_type: determineEventType(outlookEvent.subject || ''),
        status: outlookEvent.responseStatus?.response === 'accepted' ? 'confirmed' : 'tentative'
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) {
        console.error(`Error inserting event ${outlookEvent.id}:`, error);
        errorCount++;
      } else {
        importedCount++;
      }
    } catch (error) {
      console.error(`Error processing event ${outlookEvent.id}:`, error);
      errorCount++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    imported: importedCount,
    errors: errorCount,
    totalProcessed: events.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function exportEventsToOutlookCalendar(supabase: any, accessToken: string, userId: string) {
  console.log('Starting export for user:', userId);
  
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

  // Para desenvolvimento com token demo
  if (accessToken.startsWith('demo_')) {
    console.log('Using demo token, simulating export to Outlook');
    
    let exportedCount = 0;
    let errorCount = 0;

    for (const event of events || []) {
      try {
        // Simulate successful export
        const fakeExternalId = `demo_exported_${event.id}`;
        
        // Update local event with external_id
        await supabase
          .from('events')
          .update({ 
            external_id: fakeExternalId,
            external_source: 'outlook_calendar'
          })
          .eq('id', event.id);

        exportedCount++;
        console.log(`Demo: Exported event ${event.title}`);
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
      message: 'Demo: Eventos exportados com sucesso (simulação)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Real Microsoft Graph API calls
  let exportedCount = 0;
  let errorCount = 0;

  for (const event of events || []) {
    try {
      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || ''
        },
        location: event.location ? {
          displayName: event.location
        } : undefined,
        start: {
          dateTime: event.start_date,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: event.end_date,
          timeZone: 'America/Sao_Paulo'
        }
      };

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/calendar/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outlookEvent)
        }
      );

      if (!response.ok) {
        console.error(`Failed to create Outlook Calendar event: ${response.status}`);
        errorCount++;
        continue;
      }

      const createdEvent = await response.json();

      // Update local event with external_id
      await supabase
        .from('events')
        .update({ 
          external_id: createdEvent.id,
          external_source: 'outlook_calendar'
        })
        .eq('id', event.id);

      exportedCount++;
    } catch (error) {
      console.error(`Error exporting event ${event.id}:`, error);
      errorCount++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    exported: exportedCount,
    errors: errorCount,
    totalProcessed: events?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function syncBidirectional(supabase: any, accessToken: string, userId: string) {
  console.log('Starting bidirectional sync for user:', userId);
  
  try {
    // First import from Outlook Calendar
    const importResult = await importOutlookCalendarEvents(supabase, accessToken, userId);
    const importData = await importResult.json();

    // Then export to Outlook Calendar
    const exportResult = await exportEventsToOutlookCalendar(supabase, accessToken, userId);
    const exportData = await exportResult.json();

    // Atualizar o timestamp da última sincronização
    const { error: updateError } = await supabase
      .from('calendar_sync_settings')
      .update({ 
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'outlook');

    if (updateError) {
      console.error('❌ Erro ao atualizar last_sync:', updateError);
    } else {
      console.log('✅ Timestamp de sincronização atualizado');
    }

    return new Response(JSON.stringify({
      success: true,
      import: importData,
      export: exportData,
      message: `Sincronização concluída: ${importData.imported} importados, ${exportData.exported} exportados`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bidirectional sync:', error);
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