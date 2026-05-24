import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface TabSwitchWarningProps {
  open: boolean;
  count: number;
  maxAllowed: number;
  onClose: () => void;
}

export default function TabSwitchWarning({ open, count, maxAllowed, onClose }: TabSwitchWarningProps) {
  return (
    <Modal open={open} onClose={onClose} title="Anti-Cheat Warning" size="sm">
      <div className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Tab Switch Detected! (Warning 1/{maxAllowed})</h3>
        <p className="text-sm text-gray-500 mb-4">
          You switched away from the exam tab. This violation has been recorded and reported to the administrator.
        </p>

        <div className="flex justify-center gap-4 mb-5">
          {Array.from({ length: maxAllowed }, (_, i) => (
            <div
              key={`warn-dot-${i + 1}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                i < count ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="rounded p-3 mb-5 text-sm font-medium border bg-yellow-50 text-yellow-700 border-yellow-200">
          ⚠️ This is your <strong>only warning</strong>. If you switch tabs again, your exam will be <strong>automatically submitted immediately</strong> as malpractice.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          I understand — Return to Exam
        </button>
      </div>
    </Modal>
  );
}