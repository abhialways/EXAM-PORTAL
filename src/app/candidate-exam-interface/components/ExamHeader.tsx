import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { AlertTriangle, Clock } from 'lucide-react';

interface ExamHeaderProps {
  timeLeft: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isCritical: boolean;
  tabSwitchCount: number;
  answeredCount: number;
  totalQuestions: number;
  onSubmit: () => void;
}

export default function ExamHeader({
  minutes, seconds, isUrgent, isCritical, tabSwitchCount, answeredCount, totalQuestions, onSubmit,
}: ExamHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 py-3 gap-4 flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <AppLogo size={28} />
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Communication Test</p>
          <p className="text-[10px] text-gray-500">Round 1 · Data Analyst</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2">
        <span className="text-xs text-gray-500">{answeredCount}/{totalQuestions} answered</span>
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {tabSwitchCount > 0 && (
        <div className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-medium">
          <AlertTriangle size={13} />
          <span>{tabSwitchCount}/3 warnings</span>
        </div>
      )}

      <div className={`flex items-center gap-2 px-3 py-2 rounded font-semibold tabular-nums text-base border ${
        isCritical ? 'bg-red-600 text-white border-red-600' : isUrgent ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200'
      }`}>
        <Clock size={15} />
        <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
      </div>

      <button
        onClick={onSubmit}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
      >
        Submit Exam
      </button>
    </header>
  );
}