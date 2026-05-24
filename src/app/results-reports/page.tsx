import React from 'react';
import AppLayout from '@/components/AppLayout';
import ResultsReportsContent from './components/ResultsReportsContent';

export default function ResultsReportsPage() {
  return (
    <AppLayout role="admin">
      <ResultsReportsContent />
    </AppLayout>
  );
}