import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Hospital = Database['public']['Tables']['hospitals']['Row'];

export const useHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (supabaseError) throw supabaseError;

      if (data) {
        setHospitals(data);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar hospitais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  return {
    hospitals,
    loading,
    error,
    refreshHospitals: loadHospitals
  };
};