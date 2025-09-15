import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';

// Temporary types until Supabase types are regenerated
interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  tax_rate?: number;
  tax_type?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useAuth();

  React.useEffect(() => {
    let isCancelled = false;
    
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (isCancelled) return;

      try {
        console.log('🔄 Buscando perfil para usuário:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📋 Resposta do perfil:', { data, error });

        if (error) {
          console.error('❌ Erro ao buscar perfil:', error);
          setError(error?.message || 'Erro ao buscar perfil');
        } else if (!data) {
          // Profile doesn't exist, create it using auth metadata
          console.log('🆕 Perfil não encontrado, criando com metadados de auth...');
          
          const profileData = {
            user_id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            crm: user.user_metadata?.crm || '',
            specialty: user.user_metadata?.specialty || ''
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setError('Erro ao criar perfil');
          } else {
            console.log('Profile created successfully');
            setProfile(newProfile);
          }
        } else {
          setProfile(data);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching profile:', error);
          setError('Erro ao carregar perfil');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    
    return () => {
      isCancelled = true;
    };
  }, [user]);

  return { profile, loading, error };
};