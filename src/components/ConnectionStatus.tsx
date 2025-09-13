import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isOnline: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isOnline }) => {
  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
        <Wifi className="h-4 w-4" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
      <WifiOff className="h-4 w-4" />
      <span className="hidden sm:inline">Offline</span>
      <Clock className="h-3 w-3 animate-pulse" />
    </div>
  );
};

export default ConnectionStatus;