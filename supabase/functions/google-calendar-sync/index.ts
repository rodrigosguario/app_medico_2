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
    const { action, googleAccessToken, userId, calendarId = 'primary' } = await req.json();
    
    if (!googleAccessToken || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'import_events':
        return await importGoogleCalendarEvents(supabase, googleAccessToken, userId, calendarId);
      case 'export_events':
        return await exportEventsToGoogleCalendar(supabase, googleAccessToken, userId, calendarId);
      case 'sync_bidirectional':
        return await syncBidirectional(supabase, googleAccessToken, userId, calendarId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function importGoogleCalendarEvents(supabase: any, accessToken: string, userId: string, calendarId: string) {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  const events = data.items || [];

  let importedCount = 0;
  let errorCount = 0;

  for (const googleEvent of events) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('external_id', googleEvent.id)
        .eq('user_id', userId)
        .single();

      if (existingEvent) {
        console.log(`Event ${googleEvent.id} already exists, skipping`);
        continue;
      }

      const startDateTime = googleEvent.start?.dateTime || googleEvent.start?.date;
      const endDateTime = googleEvent.end?.dateTime || googleEvent.end?.date;

      if (!startDateTime || !endDateTime) {
        console.warn(`Event ${googleEvent.id} missing date/time, skipping`);
        continue;
      }

      const eventData = {
        user_id: userId,
        external_id: googleEvent.id,
        external_source: 'google_calendar',
        title: googleEvent.summary || 'Evento sem título',
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        start_date: new Date(startDateTime).toISOString(),
        end_date: new Date(endDateTime).toISOString(),
        event_type: determineEventType(googleEvent.summary || ''),
        status: googleEvent.status === 'confirmed' ? 'confirmed' : 'tentative'
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) {
        console.error(`Error inserting event ${googleEvent.id}:`, error);
        errorCount++;
      } else {
        importedCount++;
      }
    } catch (error) {
      console.error(`Error processing event ${googleEvent.id}:`, error);
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

async function exportEventsToGoogleCalendar(supabase: any, accessToken: string, userId: string, calendarId: string) {
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

  let exportedCount = 0;
  let errorCount = 0;

  for (const event of events || []) {
    try {
      const googleEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start_date,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: event.end_date,
          timeZone: 'America/Sao_Paulo'
        },
        status: event.status === 'confirmed' ? 'confirmed' : 'tentative'
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (!response.ok) {
        console.error(`Failed to create Google Calendar event: ${response.status}`);
        errorCount++;
        continue;
      }

      const createdEvent = await response.json();

      // Update local event with external_id
      await supabase
        .from('events')
        .update({ 
          external_id: createdEvent.id,
          external_source: 'google_calendar'
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

async function syncBidirectional(supabase: any, accessToken: string, userId: string, calendarId: string) {
  // First import from Google Calendar
  const importResult = await importGoogleCalendarEvents(supabase, accessToken, userId, calendarId);
  const importData = await importResult.json();

  // Then export to Google Calendar
  const exportResult = await exportEventsToGoogleCalendar(supabase, accessToken, userId, calendarId);
  const exportData = await exportResult.json();

  return new Response(JSON.stringify({
    success: true,
    import: importData,
    export: exportData,
    message: `Sincronização concluída: ${importData.imported} importados, ${exportData.exported} exportados`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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