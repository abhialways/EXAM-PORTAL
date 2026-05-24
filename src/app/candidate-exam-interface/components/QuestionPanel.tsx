import React from 'react';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from './CandidateExamClient';

interface QuestionPanelProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  isFlagged: boolean;
  onAnswer: (optionId: string) => void;
  onFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function QuestionPanel({
  question, currentIndex, totalQuestions, selectedAnswer, isFlagged,
  onAnswer, onFlag, onPrev, onNext,
}: QuestionPanelProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Round info banner */}
      <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded">Round 1</span>
          <span className="text-xs text-gray-500">Communication Test · 10 Questions · 20 Marks · Negative: 0.5/wrong</span>
        </div>
        <span className="text-xs text-gray-500">Min. passing: 30 marks</span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-blue-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
              {question.number}
            </span>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Question {currentIndex + 1} of {totalQuestions}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">+{question.marks} marks</span>
                <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">-{question.negativeMarks} negative</span>
              </div>
            </div>
          </div>
          <button
            onClick={onFlag}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
              isFlagged ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-yellow-700 hover:bg-yellow-50 hover:border-yellow-200'
            }`}
          >
            <Flag size={13} />
            {isFlagged ? 'Flagged' : 'Flag for review'}
          </button>
        </div>

        <p className="text-base font-medium text-gray-900 leading-relaxed mb-6">{question.text}</p>

        <div className="space-y-3">
          {question.options.map((opt) => {
            const isSelected = selectedAnswer === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onAnswer(opt.id)}
                className={`w-full flex items-start gap-3 p-4 rounded border-2 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50' :'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
                }`}>
                  {opt.label}
                </span>
                <span className={`text-sm leading-relaxed ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={`qnav-${i + 1}`}
              onClick={() => {}}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                i === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}