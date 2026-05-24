'use client';
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react';

type SortField = 'name' | 'totalScore' | 'completedAt';

export default function ResultsTable() {
  const [sortField, setSortField] = useState<SortField>('totalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState(10);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1 -mb-0.5">
      <ChevronUp size={9} className={sortField === field && sortDir === 'asc' ? 'text-blue-600' : 'text-gray-300'} />
      <ChevronDown size={9} className={sortField === field && sortDir === 'desc' ? 'text-blue-600' : 'text-gray-300'} />
    </span>
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Candidate Results</h3>
          <p className="text-xs text-gray-500 mt-0.5">Round-by-round breakdown · 0 total records</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 outline-none"
          >
            {[10, 25, 50].map((n) => <option key={`perpage-${n}`} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded border-gray-300" disabled />
              </th>
              {[
                { label: 'Candidate ID', sortable: false },
                { label: 'Name', sortable: true, field: 'name' as SortField },
                { label: 'Role Applied', sortable: false },
                { label: 'R1 Score', sortable: false },
                { label: 'R2 Score', sortable: false },
                { label: 'R3 Score', sortable: false },
                { label: 'Total', sortable: true, field: 'totalScore' as SortField },
                { label: 'Result', sortable: false },
                { label: 'Time Taken', sortable: false },
                { label: 'Completed', sortable: false },
                { label: 'Email', sortable: false },
                { label: 'Actions', sortable: false },
              ].map((col) => (
                <th
                  key={`res-col-${col.label}`}
                  onClick={() => col.sortable && col.field && toggleSort(col.field)}
                  className={`text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-gray-800' : ''}`}
                >
                  {col.label}
                  {col.sortable && col.field && <SortIcon field={col.field} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={13} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <FileText size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-500">No Results Yet</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Candidate results will appear here once exams are scheduled and completed.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">Showing 0 of 0 candidates</p>
      </div>
    </div>
  );
}