'use client';
import React from 'react';

export default function CategoryPassRateChart() {
  return (
    <div className="bg-white rounded border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Pass / Fail by Exam Category</h3>
        <p className="text-xs text-gray-400 mt-0.5">Breakdown across all active recruitment roles</p>
      </div>
      <div className="flex flex-col items-center justify-center h-[240px] text-center">
        <p className="text-sm text-gray-400">No data yet</p>
        <p className="text-xs text-gray-400 mt-1">Category pass/fail rates will appear once candidates complete exams.</p>
      </div>
    </div>
  );
}