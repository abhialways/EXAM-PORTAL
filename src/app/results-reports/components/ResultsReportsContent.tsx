import React from 'react';
import ResultsFilterBar from './ResultsFilterBar';
import ResultsTable from './ResultsTable';
import ResultsAggregateCharts from './ResultsAggregateCharts';

export default function ResultsReportsContent() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Results & Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Detailed candidate results · May 2026 cycle</p>
        </div>
      </div>
      <ResultsFilterBar />
      <ResultsAggregateCharts />
      <ResultsTable />
    </div>
  );
}