'use client';
import React from 'react';
import type { ExamItem } from './ExamManagementContent';
import StatusBadge from '@/components/ui/StatusBadge';
import { BookOpen, Clock, Target, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react';

interface ExamListProps {
  exams: ExamItem[];
  selectedId: string | null;
  onSelect: (exam: ExamItem) => void;
}

export default function ExamList({ exams, selectedId, onSelect }: ExamListProps) {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Exam Library</h3>
        <span className="text-xs text-gray-500">{exams.length} exams</span>
      </div>
      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-sm text-gray-500 mb-1">No exams yet</p>
          <p className="text-xs text-gray-400">Create a new exam to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {exams.map((exam) => (
            <li
              key={exam.id}
              onClick={() => onSelect(exam)}
              className={`px-4 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedId === exam.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">R{exam.round}</span>
                    <StatusBadge variant={exam.status as 'active' | 'draft' | 'closed'} size="sm" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{exam.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{exam.category}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <BookOpen size={10} />
                      {exam.questions} Qs
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} />
                      {exam.duration} min
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Target size={10} />
                      Pass: {exam.passingMarks}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      {exam.negativeMarking ? <ToggleRight size={10} className="text-red-500" /> : <ToggleLeft size={10} />}
                      Neg
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 mt-1" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}