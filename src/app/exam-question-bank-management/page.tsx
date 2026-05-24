import React from 'react';
import AppLayout from '@/components/AppLayout';
import ExamManagementContent from './components/ExamManagementContent';

export default function ExamManagementPage() {
  return (
    <AppLayout role="admin">
      <ExamManagementContent />
    </AppLayout>
  );
}