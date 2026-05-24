import React from 'react';
import AppLayout from '@/components/AppLayout';
import HRDashboardContent from './components/HRDashboardContent';

export default function HRDashboardPage() {
  return (
    <AppLayout role="hr">
      <HRDashboardContent />
    </AppLayout>
  );
}