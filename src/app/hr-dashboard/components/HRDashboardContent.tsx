import React from 'react';
import HRKPIGrid from './HRKPIGrid';
import CategoryPassRateChart from './CategoryPassRateChart';
import CandidatePerformanceTable from './CandidatePerformanceTable';
import ShortlistPanel from './ShortlistPanel';
import LiveExamMonitor from '../../admin-dashboard/components/LiveExamMonitor';

export default function HRDashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">HR Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Candidate results and notifications — May 2026</p>
      </div>

      <HRKPIGrid />

      {/* Live Exam Monitor for HR */}
      <LiveExamMonitor />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <CategoryPassRateChart />
        </div>
        <div className="xl:col-span-1">
          <ShortlistPanel />
        </div>
      </div>

      <CandidatePerformanceTable />
    </div>
  );
}