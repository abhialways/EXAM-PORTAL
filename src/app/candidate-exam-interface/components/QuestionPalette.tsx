import React from 'react';
import type { Question, QuestionStatus } from './CandidateExamClient';
import { Flag } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  getStatus: (q: Question) => QuestionStatus;
  onNavigate: (index: number) => void;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
}

const statusStyles: Record<QuestionStatus, string> = {
  unanswered: 'bg-gray-100 text-gray-600 border-gray-200',
  answered: 'bg-green-500 text-white border-green-500',
  flagged: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'answered-flagged': 'bg-yellow-500 text-white border-yellow-500',
};

export default function QuestionPalette({
  questions, currentIndex, getStatus, onNavigate,
  answeredCount, unansweredCount, flaggedCount,
}: QuestionPaletteProps) {
  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Question Palette</h3>

      <div className="space-y-2 mb-5">
        {[
          { label: 'Answered', color: 'bg-green-500', count: answeredCount },
          { label: 'Unanswered', color: 'bg-gray-200', count: unansweredCount },
          { label: 'Flagged', color: 'bg-yellow-400', count: flaggedCount },
        ].map((item) => (
          <div key={`legend-${item.label}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
            <span className="text-xs font-medium text-gray-700 tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const status = getStatus(q);
          const isActive = i === currentIndex;
          return (
            <button
              key={`palette-${q.id}`}
              onClick={() => onNavigate(i)}
              className={`w-full aspect-square rounded border-2 text-xs font-semibold transition-colors flex items-center justify-center ${
                isActive
                  ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-500 bg-blue-600 text-white'
                  : statusStyles[status]
              }`}
              title={`Question ${q.number} — ${status}`}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      <div className="mt-5 p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Total Questions</span>
          <span className="font-medium text-gray-800">{questions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Max Marks</span>
          <span className="font-medium text-gray-800">{questions.reduce((s, q) => s + q.marks, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Passing Marks</span>
          <span className="font-medium text-green-700">30</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Negative Marking</span>
          <span className="font-medium text-red-600">Yes (−0.5)</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2.5">
        <Flag size={12} />
        <span>Flagged questions will still be evaluated if answered.</span>
      </div>
    </div>
  );
}