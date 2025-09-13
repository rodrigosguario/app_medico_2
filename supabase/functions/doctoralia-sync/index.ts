import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DoctoraliaAppointment {
  id: string
  patient_name: string
  appointment_date: string
  appointment_time: string
  duration: number
  specialty: string
  location?: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, doctoralia_token, appointments } = await req.json();
    
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
      // TODO: Replace with actual Doctoralia API integration
      // Example: const response = await fetch(`https://api.doctoralia.com/appointments`, {
      //   headers: { 'Authorization': `Bearer ${doctoralia_token}` }
      // });
      // const doctoraliaAppointments = await response.json();
      
      // Simulate Doctoralia API call for demo purposes
      const doctoraliaAppointments: DoctoraliaAppointment[] = [
        {
          id: 'doct_1',
          patient_name: 'Paciente Doctoralia',
          appointment_date: '2024-01-15',
          appointment_time: '14:00',
          duration: 30,
          specialty: 'Cardiologia',
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
      const eventsToCreate = doctoraliaAppointments.map(apt => ({
        user_id: user.id,
        calendar_id: calendar.id,
        title: `Consulta - ${apt.patient_name}`,
        description: `Consulta via Doctoralia - ${apt.specialty}`,
        start_time: `${apt.appointment_date}T${apt.appointment_time}:00`,
        end_time: new Date(new Date(`${apt.appointment_date}T${apt.appointment_time}:00`).getTime() + apt.duration * 60000).toISOString(),
        event_type: 'CONSULTA',
        location: apt.location || 'Doctoralia',
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

      console.log(`Synced ${createdEvents.length} appointments from Doctoralia`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced_count: createdEvents.length,
          message: `${createdEvents.length} consultas sincronizadas do Doctoralia` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Doctoralia sync error:', error);
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