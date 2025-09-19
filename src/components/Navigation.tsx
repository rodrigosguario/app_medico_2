import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Upload, 
  WifiOff, 
  Settings, 
  LogOut,
  Stethoscope,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';
import ConnectionStatus from './ConnectionStatus';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: Calendar,
      color: 'medical'
    },
    {
      name: 'Calendário',
      path: '/calendar',
      icon: Calendar,
      color: 'primary'
    },
    {
      name: 'Financeiro',
      path: '/financial',
      icon: DollarSign,
      color: 'success'
    },
    {
      name: 'Importar/Exportar',
      path: '/import-export',
      icon: Upload,
      color: 'warning',
      badge: '2'
    },
    {
      name: 'Offline',
      path: '/offline',
      icon: WifiOff,
      color: 'muted'
    },
    // Página de teste (apenas em desenvolvimento)
    ...(import.meta.env.MODE === 'development' ? [{
      name: 'Testes',
      path: '/test',
      icon: Settings,
      color: 'secondary',
      badge: 'DEV'
    }] : [])
  ];

  const getNavItemClasses = (path: string, color: string) => {
    const isActive = location.pathname === path;
    const baseClasses = "flex items-center space-x-2 px-3 py-4 border-b-2 font-medium text-sm relative transition-colors";
    
    if (isActive) {
      return `${baseClasses} border-${color} text-${color}`;
    }
    
    return `${baseClasses} border-transparent text-muted-foreground hover:text-foreground hover:border-border`;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-medical p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-medical-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Planton Sync</h1>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                size="sm" 
                className="bg-medical hover:bg-medical-dark text-medical-foreground"
                onClick={() => navigate('/calendar?action=new')}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Evento</span>
              </Button>
              
              <ConnectionStatus isOnline={isOnline} />
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={profile?.name || user?.email} />
                      <AvatarFallback className="bg-medical text-medical-foreground">
                        {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                         user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.name || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      CRM: {profile?.crm} | {profile?.specialty}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide space-x-2 sm:space-x-8 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center space-x-2 px-3 py-2 sm:py-4 border-b-2 font-medium text-sm relative transition-colors whitespace-nowrap ${
                      isActive 
                        ? `border-${item.color} text-${item.color}` 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                  <span className="sm:hidden text-xs">{item.name.split(' ')[0]}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;