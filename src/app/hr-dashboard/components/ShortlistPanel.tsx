'use client';
import React from 'react';
import { Star } from 'lucide-react';

export default function ShortlistPanel() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Star size={13} className="text-yellow-500" />
          Shortlisted Candidates
        </h3>
        <span className="text-xs text-gray-400">0 candidates</span>
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <p className="text-sm text-gray-500 mb-1">No shortlisted candidates</p>
        <p className="text-xs text-gray-400">
          Candidates who pass all rounds will appear here.
        </p>
      </div>
    </div>
  );
}