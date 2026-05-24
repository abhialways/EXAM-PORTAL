'use client';
import React, { useState } from 'react';
import ExamList from './ExamList';
import QuestionEditor from './QuestionEditor';
import ExcelUploadModal from './ExcelUploadModal';
import { Plus, Upload } from 'lucide-react';

export interface ExamItem {
  id: string;
  title: string;
  category: string;
  round: number;
  status: 'active' | 'draft' | 'closed';
  questions: number;
  duration: number;
  passingMarks: number;
  negativeMarking: boolean;
  createdAt: string;
}

const mockExams: ExamItem[] = [];

export default function ExamManagementContent() {
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Communication', 'Excel Test', 'Data Analyst', 'Accountant', 'Core Technical'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Exam & Question Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage exams, question banks, and upload questions via Excel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Upload size={15} />
            Upload via Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
            <Plus size={15} />
            New Exam
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={`cat-tab-${cat}`}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600' :'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2">
          <ExamList
            exams={mockExams.filter((e) => activeCategory === 'All' || e.category === activeCategory)}
            selectedId={selectedExam?.id ?? null}
            onSelect={setSelectedExam}
          />
        </div>
        <div className="xl:col-span-3">
          {selectedExam ? (
            <QuestionEditor exam={selectedExam} />
          ) : (
            <div className="bg-white rounded border border-gray-200 flex items-center justify-center h-64">
              <p className="text-sm text-gray-400">Select an exam to view and edit questions</p>
            </div>
          )}
        </div>
      </div>

      <ExcelUploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}