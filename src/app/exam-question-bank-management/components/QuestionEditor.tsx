'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ExamItem } from './ExamManagementContent';
import { Plus, Trash2, Save, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionForm {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

const mockQuestions = [
  { id: 'mq-001', text: 'Which of the following best describes "active listening"?', correct: 'B', marks: 2, difficulty: 'easy' },
  { id: 'mq-002', text: 'In a formal business email, which salutation is most appropriate?', correct: 'C', marks: 2, difficulty: 'medium' },
  { id: 'mq-003', text: 'What is the primary purpose of a "follow-up" communication?', correct: 'B', marks: 2, difficulty: 'easy' },
  { id: 'mq-004', text: 'Which is NOT a characteristic of effective written communication?', correct: 'B', marks: 2, difficulty: 'medium' },
  { id: 'mq-005', text: 'When presenting data to a non-technical audience, the most effective approach is to:', correct: 'C', marks: 2, difficulty: 'hard' },
];

interface QuestionEditorProps {
  exam: ExamItem;
}

export default function QuestionEditor({ exam }: QuestionEditorProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'add' | 'settings'>('questions');
  const [isSaving, setIsSaving] = useState(false);
  const [negativeEnabled, setNegativeEnabled] = useState(exam.negativeMarking);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuestionForm>({
    defaultValues: { marks: 2, negativeMarks: 0.5, difficulty: 'medium' },
  });

  const onAddQuestion = async (data: QuestionForm) => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success('Question added to question bank');
    reset();
  };

  const tabs = [
    { id: 'questions', label: `Questions (${exam.questions})` },
    { id: 'add', label: 'Add Question' },
    { id: 'settings', label: 'Exam Settings' },
  ];

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      {/* Exam header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{exam.title}</h3>
            <p className="text-xs text-gray-500">{exam.category} · Round {exam.round} · {exam.duration} min · Passing: {exam.passingMarks} marks</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={`editor-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Questions list tab */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            {mockQuestions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors group">
                <span className="w-6 h-6 rounded bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug truncate">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">Ans: {q.correct}</span>
                    <span className="text-[10px] text-gray-400">{q.marks} marks</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                      q.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                      q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>{q.difficulty}</span>
                  </div>
                </div>
                <button className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Delete this question">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setActiveTab('add')}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Add New Question
            </button>
          </div>
        )}

        {/* Add question tab */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit(onAddQuestion)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Question Text</label>
              <textarea
                rows={3}
                placeholder="Enter the question text here..."
                className={`w-full px-3 py-2.5 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.questionText ? 'border-red-400' : 'border-gray-300'}`}
                {...register('questionText', { required: 'Question text is required' })}
              />
              {errors.questionText && <p className="text-xs text-red-500 mt-1">{errors.questionText.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={`opt-field-${opt}`}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Option {opt}</label>
                  <input
                    type="text"
                    placeholder={`Enter option ${opt}`}
                    className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors[`option${opt}` as keyof QuestionForm] ? 'border-red-400' : 'border-gray-300'}`}
                    {...register(`option${opt}` as keyof QuestionForm, { required: `Option ${opt} is required` })}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Correct Answer</label>
                <select
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('correctAnswer', { required: true })}
                >
                  {['A', 'B', 'C', 'D'].map((o) => <option key={`correct-opt-${o}`} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Marks</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('marks', { required: true, min: 1 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Difficulty</label>
                <select
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('difficulty')}
                >
                  {['easy', 'medium', 'hard'].map((d) => <option key={`diff-${d}`} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Explanation (optional)</label>
              <p className="text-xs text-gray-400 mb-1.5">Shown to candidates after exam completion</p>
              <textarea
                rows={2}
                placeholder="Brief explanation of the correct answer..."
                className="w-full px-3 py-2.5 rounded border border-gray-300 text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                {...register('explanation')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
              <div>
                <p className="text-xs font-medium text-gray-800">Negative Marking</p>
                <p className="text-[10px] text-gray-500">Deduct marks for wrong answers</p>
              </div>
              <button
                type="button"
                onClick={() => setNegativeEnabled(!negativeEnabled)}
                className="transition-colors"
              >
                {negativeEnabled ? (
                  <ToggleRight size={28} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-400" />
                )}
              </button>
            </div>
            {negativeEnabled && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Negative Marks per Wrong Answer</label>
                <input
                  type="number"
                  step="0.25"
                  className="w-32 px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('negativeMarks')}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { reset(); setActiveTab('questions'); }}
                className="flex-1 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} /> Save Question</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Exam Title', value: exam.title, helper: 'Displayed to candidates during exam' },
                { label: 'Category', value: exam.category, helper: 'Exam category determines round path' },
              ].map((field) => (
                <div key={`setting-${field.label}`}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                  <p className="text-[10px] text-gray-400 mb-1.5">{field.helper}</p>
                  <input
                    type="text"
                    defaultValue={field.value}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <p className="text-[10px] text-gray-400 mb-1.5">Exam auto-submits when time expires</p>
                <input type="number" defaultValue={exam.duration} className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Passing Marks</label>
                <p className="text-[10px] text-gray-400 mb-1.5">Minimum marks to unlock next round</p>
                <input type="number" defaultValue={exam.passingMarks} className="w-full px-3 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            {[
              { label: 'Randomize Question Order', desc: 'Each candidate gets questions in a different order' },
              { label: 'Tab Switch Detection', desc: 'Auto-terminate after 3 violations' },
              { label: 'Auto Email Results', desc: 'Send score + PDF report to candidate on submit' },
            ].map((setting) => (
              <div key={`setting-toggle-${setting.label}`} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.desc}</p>
                </div>
                <ToggleRight size={28} className="text-blue-600" />
              </div>
            ))}

            <button className="w-full py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Save size={14} />
              Save Exam Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}