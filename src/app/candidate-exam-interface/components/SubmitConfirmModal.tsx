import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface SubmitConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  unansweredCount: number;
  totalQuestions: number;
  isSubmitting?: boolean;
}

export default function SubmitConfirmModal({
  open, onClose, onConfirm, answeredCount, unansweredCount, totalQuestions, isSubmitting = false,
}: SubmitConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Submit Exam" size="sm">
      <div className="p-6">
        <div className="flex flex-col items-center text-center mb-5">
          {unansweredCount > 0 ? (
            <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mb-3">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          )}
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {unansweredCount > 0 ? 'You have unanswered questions' : 'All questions answered!'}
          </h3>
          <p className="text-sm text-gray-500">
            {unansweredCount > 0
              ? `${unansweredCount} question${unansweredCount > 1 ? 's' : ''} will be left unanswered. This action cannot be undone.`
              : 'Your exam is ready to submit. This action cannot be undone.'}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold text-green-700 tabular-nums">{answeredCount}</p>
            <p className="text-[10px] text-gray-500">Answered</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-red-600 tabular-nums">{unansweredCount}</p>
            <p className="text-[10px] text-gray-500">Unanswered</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 tabular-nums">{totalQuestions}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Answers
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Now'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}