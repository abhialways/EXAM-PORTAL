import React from 'react';

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <p className="text-sm text-gray-500 mb-1">No Activity Yet</p>
        <p className="text-xs text-gray-400">
          Exam events and system alerts will appear here.
        </p>
      </div>
    </div>
  );
}