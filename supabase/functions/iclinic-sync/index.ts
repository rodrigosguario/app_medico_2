import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IClinicAppointment {
  id: string
  patient_name: string
  scheduled_at: string
  duration: number
  professional_name: string
  specialty: string
  location?: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, iclinic_token } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from token
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (action === 'sync_appointments') {
      // TODO: Replace with actual iClinic API integration
      // Example: const response = await fetch(`https://api.iclinic.com.br/appointments`, {
      //   headers: { 'Authorization': `Bearer ${iclinic_token}` }
      // });
      // const iclinicAppointments = await response.json();
      
      // Simulate iClinic API call for demo purposes
      const iclinicAppointments: IClinicAppointment[] = [
        {
          id: 'iclinic_1',
          patient_name: 'Paciente iClinic',
          scheduled_at: '2024-01-16T09:00:00',
          duration: 45,
          professional_name: 'Dr. João',
          specialty: 'Dermatologia',
          status: 'confirmed'
        }
      ];

      // Get user's default calendar
      const { data: calendar } = await supabase
        .from('calendars')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Calendário Principal')
        .single();

      if (!calendar) {
        throw new Error('Default calendar not found');
      }

      // Sync appointments to events table
      const eventsToCreate = iclinicAppointments.map(apt => ({
        user_id: user.id,
        calendar_id: calendar.id,
        title: `Consulta - ${apt.patient_name}`,
        description: `Consulta via iClinic - ${apt.specialty}`,
        start_time: apt.scheduled_at,
        end_time: new Date(new Date(apt.scheduled_at).getTime() + apt.duration * 60000).toISOString(),
        event_type: 'CONSULTA',
        location: apt.location || 'iClinic',
        status: apt.status === 'confirmed' ? 'CONFIRMADO' : 'PENDENTE'
      }));

      const { data: createdEvents, error: insertError } = await supabase
        .from('events')
        .insert(eventsToCreate)
        .select();

      if (insertError) {
        console.error('Error creating events:', insertError);
        throw insertError;
      }

      console.log(`Synced ${createdEvents.length} appointments from iClinic`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced_count: createdEvents.length,
          message: `${createdEvents.length} consultas sincronizadas do iClinic` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('iClinic sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});