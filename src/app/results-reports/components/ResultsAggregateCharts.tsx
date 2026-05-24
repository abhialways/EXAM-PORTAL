'use client';
import React from 'react';

export default function ResultsAggregateCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Score Distribution (Round 1)</h3>
          <p className="text-xs text-gray-500 mt-0.5">Number of candidates per score band — Communication Test</p>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-sm text-gray-500 mb-1">No score data yet</p>
          <p className="text-xs text-gray-400">Score distribution will appear once candidates complete Round 1.</p>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Round Completion Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Distribution of how far candidates progressed</p>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <p className="text-sm text-gray-500 mb-1">No completion data yet</p>
          <p className="text-xs text-gray-400">Round completion breakdown will appear once exams are taken.</p>
        </div>
      </div>
    </div>
  );
}