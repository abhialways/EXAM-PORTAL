'use client';
import React, { useState } from 'react';
import { Search, Filter, Download, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ResultsFilterBar() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [category, setCategory] = useState('All Categories');
  const [round, setRound] = useState('All Rounds');
  const [result, setResult] = useState('All Results');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = () => {
    toast?.success('CSV export started — file will download shortly');
  };

  const handleEmailAll = () => {
    toast?.success('Queued result emails for all filtered candidates');
  };

  return (
    <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 flex-1 min-w-48">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e?.target?.value)}
            placeholder="Search by name, candidate ID..."
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            onClick={handleEmailAll}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Mail size={13} />
            Email Results
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
            <Download size={13} />
            Export PDF
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-gray-400" />
        {[
          { value: role, setter: setRole, options: ['All Roles', 'Data Analyst', 'Accountant', 'Core Technical', 'Communication'] },
          { value: category, setter: setCategory, options: ['All Categories', 'Round 1', 'Round 2', 'Round 3'] },
          { value: round, setter: setRound, options: ['All Rounds', 'Round 1', 'Round 2', 'Round 3'] },
          { value: result, setter: setResult, options: ['All Results', 'Pass', 'Fail', 'Shortlisted'] },
        ]?.map((f, idx) => (
          <select
            key={`filter-sel-${idx}`}
            value={f?.value}
            onChange={(e) => f?.setter(e?.target?.value)}
            className="text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:border-blue-400"
          >
            {f?.options?.map((o) => <option key={`opt-${o}`}>{o}</option>)}
          </select>
        ))}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e?.target?.value)}
          className="text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white text-gray-700 outline-none"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e?.target?.value)}
          className="text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white text-gray-700 outline-none"
        />
        <button
          onClick={() => { setRole('All Roles'); setCategory('All Categories'); setRound('All Rounds'); setResult('All Results'); setDateFrom(''); setDateTo(''); setSearch(''); }}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={11} />
          Clear
        </button>
      </div>
    </div>
  );
}