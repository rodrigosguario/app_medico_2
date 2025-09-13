import React from 'react';
import OfflineManager from '@/components/OfflineManager';
import Navigation from '@/components/Navigation';

const OfflinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OfflineManager />
      </main>
    </div>
  );
};

export default OfflinePage;