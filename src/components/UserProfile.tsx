import React from 'react';
import { User, ChevronDown } from 'lucide-react';

const UserProfile: React.FC = () => {
  // Mock user data - in real app this would come from auth context
  const user = {
    name: 'Dr. João Silva',
    specialty: 'Cardiologia',
    crm: '12345/SP',
    avatar: null
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:block text-right">
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.specialty} • CRM {user.crm}</p>
      </div>
      
      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
        <div className="h-8 w-8 bg-medical text-white rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

export default UserProfile;