import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';

type UserHospital = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export const useUserHospitals = () => {
  const [hospitals, setHospitals] = useState<UserHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadUserHospitals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (supabaseError) throw supabaseError;

      if (data) {
        setHospitals(data);
      }
    } catch (error) {
      console.error('Error loading user hospitals:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar hospitais');
    } finally {
      setLoading(false);
    }
  };

  const createHospital = async (hospitalData: Omit<UserHospital, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert([{
          ...hospitalData,
          user_id: user.id,
          is_active: true
        }])
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setHospitals(prev => [...prev, data]);
        toast({
          title: 'Hospital adicionado',
          description: 'Hospital criado com sucesso.',
        });
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar hospital';
      toast({
        title: 'Erro ao criar',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateHospital = async (id: string, updates: Partial<Omit<UserHospital, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setHospitals(prev => prev.map(h => h.id === id ? data : h));
        toast({
          title: 'Hospital atualizado',
          description: 'Informações salvas com sucesso.',
        });
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar hospital';
      toast({
        title: 'Erro ao atualizar',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteHospital = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHospitals(prev => prev.filter(h => h.id !== id));
      toast({
        title: 'Hospital removido',
        description: 'Hospital removido com sucesso.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover hospital';
      toast({
        title: 'Erro ao remover',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      loadUserHospitals();
    }
  }, [user]);

  return {
    hospitals,
    loading,
    error,
    createHospital,
    updateHospital,
    deleteHospital,
    refreshHospitals: loadUserHospitals
  };
};