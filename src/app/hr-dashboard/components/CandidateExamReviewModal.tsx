'use client';
import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Eye, Loader2, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  number: number;
  text: string;
  options: { id: string; label: string; text: string }[];
}

// Same questions used in the exam
const EXAM_QUESTIONS: Question[] = [
  { id: 'q-001', number: 1, text: 'Which of the following best describes "active listening" in a professional communication context?', options: [{ id: 'q001-a', label: 'A', text: 'Waiting for your turn to speak without processing what the other person says' }, { id: 'q001-b', label: 'B', text: 'Fully concentrating, understanding, and responding thoughtfully to the speaker' }, { id: 'q001-c', label: 'C', text: 'Nodding your head continuously to show agreement' }, { id: 'q001-d', label: 'D', text: 'Taking notes during every conversation regardless of importance' }] },
  { id: 'q-002', number: 2, text: "In a formal business email, which salutation is most appropriate when the recipient's name is unknown?", options: [{ id: 'q002-a', label: 'A', text: 'Hey there,' }, { id: 'q002-b', label: 'B', text: 'To Whom It May Concern,' }, { id: 'q002-c', label: 'C', text: 'Dear Sir/Madam,' }, { id: 'q002-d', label: 'D', text: 'Hello Friend,' }] },
  { id: 'q-003', number: 3, text: 'What is the primary purpose of a "follow-up" communication after a business meeting?', options: [{ id: 'q003-a', label: 'A', text: 'To repeat everything that was discussed verbatim' }, { id: 'q003-b', label: 'B', text: 'To summarize decisions, action items, and next steps' }, { id: 'q003-c', label: 'C', text: 'To express dissatisfaction with the meeting outcome' }, { id: 'q003-d', label: 'D', text: 'To introduce yourself again to all participants' }] },
  { id: 'q-004', number: 4, text: 'Which of the following is NOT a characteristic of effective written communication?', options: [{ id: 'q004-a', label: 'A', text: 'Clarity and conciseness' }, { id: 'q004-b', label: 'B', text: 'Use of jargon to demonstrate expertise' }, { id: 'q004-c', label: 'C', text: 'Logical structure and flow' }, { id: 'q004-d', label: 'D', text: 'Audience-appropriate language' }] },
  { id: 'q-005', number: 5, text: 'When presenting data to a non-technical audience, the most effective approach is to:', options: [{ id: 'q005-a', label: 'A', text: 'Use raw numbers and database terminology for precision' }, { id: 'q005-b', label: 'B', text: 'Focus on technical implementation details' }, { id: 'q005-c', label: 'C', text: 'Translate findings into business impact using simple language' }, { id: 'q005-d', label: 'D', text: 'Present all available data without filtering' }] },
  { id: 'q-006', number: 6, text: 'A colleague sends you a message asking for urgent help. You are currently in the middle of a critical task. The best professional response is to:', options: [{ id: 'q006-a', label: 'A', text: 'Ignore the message until you finish your task' }, { id: 'q006-b', label: 'B', text: 'Immediately drop everything and help' }, { id: 'q006-c', label: 'C', text: 'Acknowledge the message, set a realistic timeline, and follow through' }, { id: 'q006-d', label: 'D', text: 'Forward the message to your manager without responding' }] },
  { id: 'q-007', number: 7, text: 'In cross-cultural business communication, which practice is generally recommended?', options: [{ id: 'q007-a', label: 'A', text: 'Assume your communication style is universally understood' }, { id: 'q007-b', label: 'B', text: 'Avoid direct eye contact to show respect' }, { id: 'q007-c', label: 'C', text: 'Research cultural norms and adapt your communication approach' }, { id: 'q007-d', label: 'D', text: 'Use humor extensively to build rapport' }] },
  { id: 'q-008', number: 8, text: 'Which type of communication is most effective for conveying complex, multi-step instructions?', options: [{ id: 'q008-a', label: 'A', text: 'Verbal communication in a group meeting' }, { id: 'q008-b', label: 'B', text: 'Written documentation with numbered steps' }, { id: 'q008-c', label: 'C', text: 'Non-verbal communication through gestures' }, { id: 'q008-d', label: 'D', text: 'Informal chat messages' }] },
  { id: 'q-009', number: 9, text: 'The term "constructive feedback" means:', options: [{ id: 'q009-a', label: 'A', text: 'Feedback that only highlights positives' }, { id: 'q009-b', label: 'B', text: 'Feedback focused on building improvements while addressing specific issues' }, { id: 'q009-c', label: 'C', text: 'Feedback delivered anonymously to avoid conflict' }, { id: 'q009-d', label: 'D', text: 'Feedback that is always delivered in writing' }] },
  { id: 'q-010', number: 10, text: 'Which of the following best describes "upward communication" in an organization?', options: [{ id: 'q010-a', label: 'A', text: 'Communication from management to employees' }, { id: 'q010-b', label: 'B', text: 'Communication between peers at the same level' }, { id: 'q010-c', label: 'C', text: 'Communication from subordinates to superiors' }, { id: 'q010-d', label: 'D', text: 'Communication with external stakeholders' }] },
];

interface ReviewRound {
  id: string;
  round_number: number;
  round_name: string;
  marks_obtained: number;
  total_marks: number;
  pass_mark: number;
  status: string;
  submitted_at: string | null;
  answers: Record<string, string> | null;
  hr_validated: boolean;
  hr_verdict: string | null;
  hr_notes: string | null;
}

interface CandidateExamReviewModalProps {
  candidateName: string;
  candidateId: string;
  round: ReviewRound;
  onClose: () => void;
  onValidated: () => void;
}

export default function CandidateExamReviewModal({
  candidateName,
  candidateId,
  round,
  onClose,
  onValidated,
}: CandidateExamReviewModalProps) {
  const [verdict, setVerdict] = useState<'passed' | 'failed' | ''>(
    (round.hr_verdict as 'passed' | 'failed') ?? ''
  );
  const [hrNotes, setHrNotes] = useState(round.hr_notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const answers: Record<string, string> = round.answers ?? {};
  const answeredCount = Object.keys(answers).length;

  const handleValidate = async () => {
    if (!verdict) {
      toast.error('Please select Pass or Fail before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/validate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_result_id: round.id,
          verdict,
          hr_notes: hrNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Validation failed: ' + (data.error ?? 'Unknown error'));
      } else {
        toast.success(`Candidate marked as ${verdict.toUpperCase()} successfully.`);
        onValidated();
        onClose();
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded border border-gray-200 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Eye size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Exam Review — {candidateName}</h2>
              <p className="text-xs text-gray-500">ID: {candidateId} · Round {round.round_number}: {round.round_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6 flex-shrink-0 flex-wrap">
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-800">{answeredCount}</span> / {EXAM_QUESTIONS.length} answered
          </div>
          <div className="text-xs text-gray-600">
            Score: <span className="font-medium text-gray-800">{round.marks_obtained}</span> / {round.total_marks}
          </div>
          <div className="text-xs text-gray-600">
            Pass mark: <span className="font-medium text-gray-800">{round.pass_mark}</span>
          </div>
          {round.submitted_at && (
            <div className="text-xs text-gray-500">
              Submitted: {new Date(round.submitted_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          {round.hr_validated && (
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${round.hr_verdict === 'passed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              HR Validated: {round.hr_verdict?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Questions scroll area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {EXAM_QUESTIONS.map((q, idx) => {
            const selectedOptionId = answers[q.id];
            const selectedOption = q.options.find((o) => o.id === selectedOptionId);
            const isAnswered = !!selectedOptionId;

            return (
              <div key={q.id} className="border border-gray-200 rounded p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-100 text-xs font-medium text-gray-600 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                </div>
                <div className="ml-9 space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = opt.id === selectedOptionId;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded border text-sm ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-800' :'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full border text-xs flex items-center justify-center font-medium ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'}`}>
                          {opt.label}
                        </span>
                        <span>{opt.text}</span>
                        {isSelected && (
                          <span className="ml-auto flex-shrink-0 text-xs text-blue-600 font-medium">Selected</span>
                        )}
                      </div>
                    );
                  })}
                  {!isAnswered && (
                    <p className="text-xs text-gray-400 italic px-1">Not answered</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* HR Validation Panel */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <FileText size={13} className="text-gray-500" />
            HR Validation
          </p>
          <div className="flex items-start gap-4 flex-wrap">
            {/* Verdict buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVerdict('passed')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                  verdict === 'passed' ?'bg-green-600 text-white border-green-600' :'bg-white text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-300'
                }`}
              >
                <CheckCircle size={14} />
                Pass
              </button>
              <button
                onClick={() => setVerdict('failed')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                  verdict === 'failed' ?'bg-red-600 text-white border-red-600' :'bg-white text-gray-600 border-gray-300 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <XCircle size={14} />
                Fail
              </button>
            </div>

            {/* Notes */}
            <div className="flex-1 min-w-48">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">Notes (optional)</span>
              </div>
              <input
                type="text"
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Add remarks about candidate performance..."
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleValidate}
              disabled={!verdict || submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {submitting ? 'Saving...' : 'Submit Verdict'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
