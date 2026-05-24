'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExcelUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const previewRows = [
  { row: 1, question: 'Which formula calculates the sum of a range?', optA: 'SUM()', optB: 'ADD()', optC: 'TOTAL()', optD: 'COUNT()', correct: 'A', status: 'valid' },
  { row: 2, question: 'What does VLOOKUP stand for?', optA: 'Vertical Lookup', optB: 'Value Lookup', optC: 'Variable Lookup', optD: 'Visual Lookup', correct: 'A', status: 'valid' },
  { row: 3, question: 'How do you freeze a cell reference?', optA: 'Use # symbol', optB: 'Use $ symbol', optC: 'Use @ symbol', optD: 'Use & symbol', correct: 'B', status: 'valid' },
  { row: 4, question: '', optA: 'Option A', optB: 'Option B', optC: '', optD: '', correct: '', status: 'error' },
  { row: 5, question: 'What is a pivot table used for?', optA: 'Summarizing data', optB: 'Drawing charts', optC: 'Sorting text', optD: 'Formatting cells', correct: 'A', status: 'valid' },
];

export default function ExcelUploadModal({ open, onClose }: ExcelUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileName(file.name); setStep('preview'); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); setStep('preview'); }
  };

  const handleImport = async () => {
    setStep('importing');
    await new Promise((r) => setTimeout(r, 2000));
    setStep('done');
    toast.success('4 questions imported successfully (1 skipped due to errors)');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName(null);
    onClose();
  };

  const validCount = previewRows.filter((r) => r.status === 'valid').length;
  const errorCount = previewRows.filter((r) => r.status === 'error').length;

  return (
    <Modal open={open} onClose={handleClose} title="Upload Questions via Excel" size="xl">
      <div className="p-5">
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Download Excel Template</p>
                  <p className="text-xs text-gray-500">Use the standard template to ensure correct column mapping</p>
                </div>
              </div>
              <button className="text-xs font-medium text-blue-600 hover:underline px-3 py-1.5 border border-blue-200 rounded">
                Download Template
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Required Column Format</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct', 'Marks', 'Difficulty'].map((col) => (
                  <span key={`col-ref-${col}`} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded text-center">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded p-10 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <Upload size={28} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">Drop your Excel file here</p>
              <p className="text-xs text-gray-400 mb-4">Supports .xlsx and .csv files up to 5MB</p>
              <label className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded cursor-pointer hover:bg-blue-700 transition-colors">
                Browse Files
                <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{fileName}</p>
                  <p className="text-xs text-gray-500">{previewRows.length} rows detected</p>
                </div>
              </div>
              <button onClick={() => { setStep('upload'); setFileName(null); }} className="p-1.5 text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                <p className="text-lg font-semibold text-gray-800 tabular-nums">{previewRows.length}</p>
                <p className="text-[10px] text-gray-500">Total Rows</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded text-center">
                <p className="text-lg font-semibold text-green-700 tabular-nums">{validCount}</p>
                <p className="text-[10px] text-gray-500">Valid</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded text-center">
                <p className="text-lg font-semibold text-red-600 tabular-nums">{errorCount}</p>
                <p className="text-[10px] text-gray-500">Errors</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Row', 'Question', 'Opt A', 'Opt B', 'Opt C', 'Opt D', 'Correct', 'Status'].map((h) => (
                      <th key={`preview-h-${h}`} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row) => (
                    <tr key={`preview-row-${row.row}`} className={row.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 font-mono text-gray-500">{row.row}</td>
                      <td className="px-3 py-2 max-w-40 truncate text-gray-800">{row.question || <span className="text-red-500">Missing</span>}</td>
                      <td className="px-3 py-2 max-w-24 truncate text-gray-500">{row.optA}</td>
                      <td className="px-3 py-2 max-w-24 truncate text-gray-500">{row.optB}</td>
                      <td className="px-3 py-2 max-w-24 truncate text-gray-500">{row.optC || <span className="text-red-500">—</span>}</td>
                      <td className="px-3 py-2 max-w-24 truncate text-gray-500">{row.optD || <span className="text-red-500">—</span>}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{row.correct || <span className="text-red-500">—</span>}</td>
                      <td className="px-3 py-2">
                        {row.status === 'valid' ? (
                          <CheckCircle size={13} className="text-green-600" />
                        ) : (
                          <AlertCircle size={13} className="text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{errorCount} row{errorCount > 1 ? 's' : ''} have validation errors and will be skipped. Valid rows will still be imported.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setStep('upload'); setFileName(null); }} className="flex-1 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Re-upload File
              </button>
              <button onClick={handleImport} className="flex-1 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Upload size={14} />
                Import {validCount} Questions
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-800">Importing questions...</p>
            <p className="text-xs text-gray-500 mt-1">Validating and adding {validCount} questions to the bank</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">Import Complete</p>
            <p className="text-sm text-gray-500 mb-2">{validCount} questions added · {errorCount} skipped</p>
            <button onClick={handleClose} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}