'use client';
import React from 'react';

export default function RoundFunnelChart() {
  return (
    <div className="bg-white rounded border border-gray-200 p-4 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Round Progression Funnel</h3>
        <p className="text-xs text-gray-500 mt-0.5">Candidates passing each exam round</p>
      </div>
      <div className="flex flex-col items-center justify-center h-[220px] text-center">
        <p className="text-sm text-gray-500 mb-1">No round data yet</p>
        <p className="text-xs text-gray-400">Funnel data will appear once candidates complete exam rounds.</p>
      </div>
    </div>
  );
}