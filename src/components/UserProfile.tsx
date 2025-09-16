import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
        <div className="hidden md:block">
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Use profile data or fallback to user metadata
  const displayName = profile?.name || user?.user_metadata?.name || 'Usuário';
  const specialty = profile?.specialty || user?.user_metadata?.specialty || '';
  const crm = profile?.crm || user?.user_metadata?.crm || '';
  const email = profile?.email || user?.email || '';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:block text-right">
        <p className="text-sm font-medium text-foreground">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {specialty && crm ? `${specialty} • CRM ${crm}` : specialty || email}
        </p>
      </div>
      
      <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors">
        <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default UserProfile;