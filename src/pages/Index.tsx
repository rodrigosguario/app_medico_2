import React from 'react';
import Dashboard from './Dashboard';
import DebugConnectionStatus from '@/components/DebugConnectionStatus';

const Index = () => {
  return (
    <>
      <Dashboard />
      <DebugConnectionStatus />
    </>
  );
};

export default Index;
