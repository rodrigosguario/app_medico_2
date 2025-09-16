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

      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('📋 Carregando hospitais do usuário:', user.id);

      const { data, error: supabaseError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (supabaseError) {
        console.error('❌ Erro ao carregar hospitais:', supabaseError);
        throw supabaseError;
      }

      if (data) {
        console.log('✅ Hospitais carregados:', data.length);
        setHospitals(data);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar hospitais:', error);
      
      let errorMessage = 'Erro ao carregar hospitais';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          errorMessage = 'Sem permissão para acessar hospitais.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createHospital = async (hospitalData: Omit<UserHospital, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('🏥 Criando hospital:', hospitalData);
      
      const { data, error } = await supabase
        .from('hospitals')
        .insert([{
          ...hospitalData,
          user_id: user.id,
          is_active: true
        }])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro ao criar hospital:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Hospital criado:', data);
        setHospitals(prev => [...prev, data]);
        toast({
          title: 'Hospital adicionado',
          description: 'Hospital criado com sucesso.',
        });
      }

      return data;
    } catch (error) {
      console.error('💥 Erro ao criar hospital:', error);
      
      let message = 'Erro ao criar hospital';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          message = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          message = 'Sem permissão para criar hospital.';
        } else if (error.message.includes('violates')) {
          message = 'Dados inválidos ou duplicados.';
        } else {
          message = error.message;
        }
      }
      
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
      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('🔄 Atualizando hospital:', { id, updates });
      
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar hospital:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Hospital atualizado:', data);
        setHospitals(prev => prev.map(h => h.id === id ? data : h));
        toast({
          title: 'Hospital atualizado',
          description: 'Informações salvas com sucesso.',
        });
      }

      return data;
    } catch (error) {
      console.error('💥 Erro ao atualizar hospital:', error);
      
      let message = 'Erro ao atualizar hospital';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          message = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          message = 'Sem permissão para atualizar hospital.';
        } else {
          message = error.message;
        }
      }
      
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
      // Validate session before making request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('🗑️ Removendo hospital:', id);
      
      const { error } = await supabase
        .from('hospitals')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro ao remover hospital:', error);
        throw error;
      }

      console.log('✅ Hospital removido com sucesso');
      setHospitals(prev => prev.filter(h => h.id !== id));
      toast({
        title: 'Hospital removido',
        description: 'Hospital removido com sucesso.',
      });
    } catch (error) {
      console.error('💥 Erro ao remover hospital:', error);
      
      let message = 'Erro ao remover hospital';
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('Sessão expirada')) {
          message = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
          message = 'Sem permissão para remover hospital.';
        } else {
          message = error.message;
        }
      }
      
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