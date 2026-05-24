'use client';
import React from 'react';

export default function DailyAttemptsChart() {
  return (
    <div className="bg-white rounded border border-gray-200 p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Daily Exam Attempts</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pass vs Fail — last 10 days</p>
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-600 outline-none">
          <option>Last 10 days</option>
          <option>Last 30 days</option>
        </select>
      </div>
      <div className="flex flex-col items-center justify-center h-[220px] text-center">
        <p className="text-sm text-gray-500 mb-1">No exam data yet</p>
        <p className="text-xs text-gray-400">Attempt trends will appear here once candidates complete exams.</p>
      </div>
    </div>
  );
}