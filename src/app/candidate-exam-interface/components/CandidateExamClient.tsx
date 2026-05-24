'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ExamHeader from './ExamHeader';
import QuestionPanel from './QuestionPanel';
import QuestionPalette from './QuestionPalette';
import SubmitConfirmModal from './SubmitConfirmModal';
import TabSwitchWarning from './TabSwitchWarning';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'answered-flagged';

export interface Question {
  id: string;
  number: number;
  text: string;
  options: { id: string; label: string; text: string }[];
  marks: number;
  negativeMarks: number;
}

const examQuestions: Question[] = [
  { id: 'q-001', number: 1, text: 'Which of the following best describes "active listening" in a professional communication context?', options: [{ id: 'q001-a', label: 'A', text: 'Waiting for your turn to speak without processing what the other person says' }, { id: 'q001-b', label: 'B', text: 'Fully concentrating, understanding, and responding thoughtfully to the speaker' }, { id: 'q001-c', label: 'C', text: 'Nodding your head continuously to show agreement' }, { id: 'q001-d', label: 'D', text: 'Taking notes during every conversation regardless of importance' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-002', number: 2, text: 'In a formal business email, which salutation is most appropriate when the recipient\'s name is unknown?', options: [{ id: 'q002-a', label: 'A', text: 'Hey there,' }, { id: 'q002-b', label: 'B', text: 'To Whom It May Concern,' }, { id: 'q002-c', label: 'C', text: 'Dear Sir/Madam,' }, { id: 'q002-d', label: 'D', text: 'Hello Friend,' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-003', number: 3, text: 'What is the primary purpose of a "follow-up" communication after a business meeting?', options: [{ id: 'q003-a', label: 'A', text: 'To repeat everything that was discussed verbatim' }, { id: 'q003-b', label: 'B', text: 'To summarize decisions, action items, and next steps' }, { id: 'q003-c', label: 'C', text: 'To express dissatisfaction with the meeting outcome' }, { id: 'q003-d', label: 'D', text: 'To introduce yourself again to all participants' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-004', number: 4, text: 'Which of the following is NOT a characteristic of effective written communication?', options: [{ id: 'q004-a', label: 'A', text: 'Clarity and conciseness' }, { id: 'q004-b', label: 'B', text: 'Use of jargon to demonstrate expertise' }, { id: 'q004-c', label: 'C', text: 'Logical structure and flow' }, { id: 'q004-d', label: 'D', text: 'Audience-appropriate language' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-005', number: 5, text: 'When presenting data to a non-technical audience, the most effective approach is to:', options: [{ id: 'q005-a', label: 'A', text: 'Use raw numbers and database terminology for precision' }, { id: 'q005-b', label: 'B', text: 'Focus on technical implementation details' }, { id: 'q005-c', label: 'C', text: 'Translate findings into business impact using simple language' }, { id: 'q005-d', label: 'D', text: 'Present all available data without filtering' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-006', number: 6, text: 'A colleague sends you a message asking for urgent help. You are currently in the middle of a critical task. The best professional response is to:', options: [{ id: 'q006-a', label: 'A', text: 'Ignore the message until you finish your task' }, { id: 'q006-b', label: 'B', text: 'Immediately drop everything and help' }, { id: 'q006-c', label: 'C', text: 'Acknowledge the message, set a realistic timeline, and follow through' }, { id: 'q006-d', label: 'D', text: 'Forward the message to your manager without responding' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-007', number: 7, text: 'In cross-cultural business communication, which practice is generally recommended?', options: [{ id: 'q007-a', label: 'A', text: 'Assume your communication style is universally understood' }, { id: 'q007-b', label: 'B', text: 'Avoid direct eye contact to show respect' }, { id: 'q007-c', label: 'C', text: 'Research cultural norms and adapt your communication approach' }, { id: 'q007-d', label: 'D', text: 'Use humor extensively to build rapport' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-008', number: 8, text: 'Which type of communication is most effective for conveying complex, multi-step instructions?', options: [{ id: 'q008-a', label: 'A', text: 'Verbal communication in a group meeting' }, { id: 'q008-b', label: 'B', text: 'Written documentation with numbered steps' }, { id: 'q008-c', label: 'C', text: 'Non-verbal communication through gestures' }, { id: 'q008-d', label: 'D', text: 'Informal chat messages' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-009', number: 9, text: 'The term "constructive feedback" means:', options: [{ id: 'q009-a', label: 'A', text: 'Feedback that only highlights positives' }, { id: 'q009-b', label: 'B', text: 'Feedback focused on building improvements while addressing specific issues' }, { id: 'q009-c', label: 'C', text: 'Feedback delivered anonymously to avoid conflict' }, { id: 'q009-d', label: 'D', text: 'Feedback that is always delivered in writing' }], marks: 2, negativeMarks: 0.5 },
  { id: 'q-010', number: 10, text: 'Which of the following best describes "upward communication" in an organization?', options: [{ id: 'q010-a', label: 'A', text: 'Communication from management to employees' }, { id: 'q010-b', label: 'B', text: 'Communication between peers at the same level' }, { id: 'q010-c', label: 'C', text: 'Communication from subordinates to superiors' }, { id: 'q010-d', label: 'D', text: 'Communication with external stakeholders' }], marks: 2, negativeMarks: 0.5 },
];

const EXAM_DURATION_SECONDS = 30 * 60; // 30 minutes

export default function CandidateExamClient() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examLocked, setExamLocked] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [terminatedByAdmin, setTerminatedByAdmin] = useState(false);

  // Use refs to always have latest values in event handlers
  const answersRef = useRef(answers);
  const tabSwitchCountRef = useRef(0);
  const examSubmittedRef = useRef(false);
  const examLockedRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { examSubmittedRef.current = examSubmitted; }, [examSubmitted]);
  useEffect(() => { examLockedRef.current = examLocked; }, [examLocked]);

  // Check exam lock status on mount
  useEffect(() => {
    const storedCandidateId = typeof window !== 'undefined' ? localStorage.getItem('candidate_id') : null;
    setCandidateId(storedCandidateId);

    if (!storedCandidateId) {
      setCheckingStatus(false);
      return;
    }

    fetch(`/api/exam/check-status?candidate_id=${encodeURIComponent(storedCandidateId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'completed' || data.status === 'terminated') {
          setExamLocked(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        setCheckingStatus(false);
      });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (examSubmitted || examLocked || checkingStatus) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examSubmitted, examLocked, checkingStatus]);

  // Poll for admin termination every 5 seconds
  useEffect(() => {
    if (examSubmitted || examLocked || checkingStatus) return;
    const storedCandidateId = typeof window !== 'undefined' ? localStorage.getItem('candidate_id') : null;
    if (!storedCandidateId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exam/check-status?candidate_id=${encodeURIComponent(storedCandidateId)}`);
        const data = await res.json();
        if (data.status === 'terminated' || data.status === 'malpractice') {
          clearInterval(pollInterval);
          setTerminatedByAdmin(true);
          setExamSubmitted(true);
          toast.error('Your exam has been terminated by the administrator due to malpractice.');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch {
        // silent
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [examSubmitted, examLocked, checkingStatus, router]);

  // Tab switch detection — 1st = warning, 2nd = auto-submit immediately
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !examSubmittedRef.current && !examLockedRef.current) {
        const newCount = tabSwitchCountRef.current + 1;
        tabSwitchCountRef.current = newCount;
        setTabSwitchCount(newCount);

        if (newCount === 1) {
          // First switch: show warning
          setShowTabWarning(true);
        } else if (newCount >= 2) {
          // Second switch: auto-submit immediately
          setShowTabWarning(false);
          examSubmittedRef.current = true;
          setExamSubmitted(true);
          const timeTaken = EXAM_DURATION_SECONDS - (typeof window !== 'undefined' ? 0 : 0);
          submitExamToServerDirect(answersRef.current, timeTaken, 'tab_switch');
          toast.error('Exam auto-submitted: Second tab switch detected. Malpractice recorded.');
          setTimeout(() => router.push('/'), 2000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  const submitExamToServerDirect = async (currentAnswers: Record<string, string>, timeTaken: number, reason?: string) => {
    const storedCandidateId = typeof window !== 'undefined' ? localStorage.getItem('candidate_id') : null;
    if (!storedCandidateId) return;
    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: storedCandidateId,
          answers: currentAnswers,
          time_taken_seconds: timeTaken,
          reason: reason ?? 'submitted',
        }),
      });
    } catch (err) {
      console.error('Failed to submit exam:', err);
    }
  };

  const submitExamToServer = useCallback(async (currentAnswers: Record<string, string>, timeTaken: number) => {
    await submitExamToServerDirect(currentAnswers, timeTaken);
  }, []);

  const handleAutoSubmit = useCallback(() => {
    setExamSubmitted(true);
    submitExamToServer(answers, EXAM_DURATION_SECONDS);
    toast.success('Exam auto-submitted — time expired');
    setTimeout(() => router.push('/'), 2000);
  }, [router, answers, submitExamToServer]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);
    const timeTaken = EXAM_DURATION_SECONDS - timeLeft;
    await submitExamToServer(answers, timeTaken);
    setExamSubmitted(true);
    setIsSubmitting(false);
    toast.success('Exam submitted successfully! Results will be reviewed by HR.');
    setTimeout(() => router.push('/'), 3000);
  };

  const getQuestionStatus = (q: Question): QuestionStatus => {
    const isAnswered = !!answers[q.id];
    const isFlagged = flagged.has(q.id);
    if (isAnswered && isFlagged) return 'answered-flagged';
    if (isAnswered) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = examQuestions.length - answeredCount;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300;
  const isCritical = timeLeft < 60;

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying exam access...</p>
        </div>
      </div>
    );
  }

  if (examLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Exam Already Submitted</h2>
          <p className="text-sm text-gray-500 mb-1">You have already completed this exam.</p>
          <p className="text-sm text-gray-500">Your results are being reviewed by HR.</p>
          <button onClick={() => router.push('/')} className="mt-5 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (terminatedByAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Exam Terminated</h2>
          <p className="text-sm text-gray-500">Your exam has been terminated by the administrator due to malpractice. Redirecting...</p>
        </div>
      </div>
    );
  }

  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Exam Submitted</h2>
          <p className="text-sm text-gray-500">Your responses have been recorded. HR will review your results.</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ExamHeader
        timeLeft={timeLeft}
        minutes={minutes}
        seconds={seconds}
        isUrgent={isUrgent}
        isCritical={isCritical}
        tabSwitchCount={tabSwitchCount}
        answeredCount={answeredCount}
        totalQuestions={examQuestions.length}
        onSubmit={() => setShowSubmitModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <QuestionPanel
            question={examQuestions[currentQ]}
            currentIndex={currentQ}
            totalQuestions={examQuestions.length}
            selectedAnswer={answers[examQuestions[currentQ].id]}
            isFlagged={flagged.has(examQuestions[currentQ].id)}
            onAnswer={(optionId) => setAnswers((prev) => ({ ...prev, [examQuestions[currentQ].id]: optionId }))}
            onFlag={() => toggleFlag(examQuestions[currentQ].id)}
            onPrev={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentQ((prev) => Math.min(examQuestions.length - 1, prev + 1))}
          />
        </div>

        <div className="w-64 xl:w-72 border-l border-gray-200 bg-white overflow-y-auto hidden lg:block flex-shrink-0">
          <QuestionPalette
            questions={examQuestions}
            currentIndex={currentQ}
            getStatus={getQuestionStatus}
            onNavigate={setCurrentQ}
            answeredCount={answeredCount}
            unansweredCount={unansweredCount}
            flaggedCount={flagged.size}
          />
        </div>
      </div>

      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        totalQuestions={examQuestions.length}
        isSubmitting={isSubmitting}
      />

      {/* Tab switch warning — only shown on 1st switch */}
      <TabSwitchWarning
        open={showTabWarning}
        count={tabSwitchCount}
        maxAllowed={2}
        onClose={() => setShowTabWarning(false)}
      />
    </div>
  );
}