import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { AuthErrorHandler } from '@/components/AuthErrorHandler';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, crm: string, specialty: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('❌ Erro ao obter sessão:', error);
      }
      
      console.log('📋 Sessão atual:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(err => {
      if (!mounted) return;
      
      console.error('💥 Erro ao verificar sessão:', err);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      console.log('🔐 Tentando fazer login...', { email });
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro de login:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
        }
        
        return { error: errorMessage };
      }

      console.log('✅ Login realizado com sucesso!', { userId: data.user?.id });
      return {};
    } catch (error) {
      console.error('💥 Erro inesperado no login:', error);
      return { error: 'Erro inesperado ao fazer login. Tente novamente.' };
    }
  };

  const signUp = async (email: string, password: string, name: string, crm: string, specialty: string): Promise<{ error?: string }> => {
    try {
      console.log('📝 Tentando criar conta...', { email, name, crm, specialty });
      
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            crm,
            specialty
          }
        }
      });

      if (error) {
        console.error('❌ Erro no cadastro:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato.';
        }
        
        return { error: errorMessage };
      }

      console.log('✅ Conta criada com sucesso!', { userId: data.user?.id });

      if (data.user && !data.session) {
        toast({
          title: "Confirme seu email",
          description: "Verifique sua caixa de entrada para confirmar o cadastro.",
        });
      }

      return {};
    } catch (error) {
      console.error('💥 Erro inesperado no cadastro:', error);
      return { error: 'Erro inesperado ao fazer cadastro. Tente novamente.' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Check for authentication errors in URL
  const hasAuthError = searchParams.get('error') || searchParams.get('error_code');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (hasAuthError) {
    return <AuthErrorHandler />;
  }

  if (!isAuthenticated) {
    return fallback || <LoginForm />;
  }

  return <>{children}</>;
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [crm, setCrm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email e senha são obrigatórios');
      return;
    }

    if (isSignUp && (!name || !crm || !specialty)) {
      setError('Todos os campos são obrigatórios para o cadastro');
      return;
    }

    setIsLoading(true);
    setError('');

    let result;
    if (isSignUp) {
      result = await signUp(email, password, name, crm, specialty);
    } else {
      result = await signIn(email, password);
    }
    
    if (result.error) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-medical p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-medical-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground">MedicoAgenda</h2>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre na sua conta para continuar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nome Completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical focus:border-medical"
                  placeholder="Dr.(a) Nome Completo"
                  required={isSignUp}
                />
              </div>

              <div>
                <label htmlFor="crm" className="block text-sm font-medium text-foreground">
                  CRM
                </label>
                <input
                  id="crm"
                  type="text"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical focus:border-medical"
                  placeholder="Número/UF (ex: 12345/SP)"
                  required={isSignUp}
                />
              </div>

              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-foreground">
                  Especialidade
                </label>
                <input
                  id="specialty"
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical focus:border-medical"
                  placeholder="Sua especialidade médica"
                  required={isSignUp}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical focus:border-medical"
              placeholder="Seu melhor e-mail profissional"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical focus:border-medical"
              placeholder="Senha segura (mínimo 6 caracteres)"
              required
            />
          </div>

          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-medical hover:bg-medical-dark text-medical-foreground font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? (isSignUp ? 'Criando conta...' : 'Entrando...') 
              : (isSignUp ? 'Criar Conta' : 'Entrar')
            }
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-medical hover:text-medical-dark text-sm underline"
          >
            {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
          </button>
        </div>
      </div>
    </div>
  );
};