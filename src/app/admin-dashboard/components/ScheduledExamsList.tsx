'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

interface ExamSchedule {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_id: string;
  exam_name: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle size={10} /> Completed
    </span>
  );
  if (status === 'cancelled') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} /> Cancelled
    </span>
  );
  if (status === 'in_progress') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      In Progress
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
      <AlertCircle size={10} /> Scheduled
    </span>
  );
}

interface ScheduledExamsListProps {
  refreshKey?: number;
}

export default function ScheduledExamsList({ refreshKey }: ScheduledExamsListProps) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('exam_schedules')
        .select('*')
        .order('exam_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setSchedules(data ?? []);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules, refreshKey]);

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Scheduled Exams</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? 'Loading…' : `${schedules.length} exam${schedules.length !== 1 ? 's' : ''} scheduled`}
          </p>
        </div>
        <button
          onClick={fetchSchedules}
          disabled={loading}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={18} className="animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Failed to load schedules</p>
          <p className="text-xs text-gray-400 mb-3">{error}</p>
          <button onClick={fetchSchedules} className="text-xs text-blue-600 hover:underline">Try again</button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p className="text-sm text-gray-500 mb-1">No Exams Scheduled</p>
          <p className="text-xs text-gray-400">Use the "Schedule Exam" button to create your first exam.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Candidate</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Exam</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Time</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{s.candidate_name}</p>
                    <p className="text-gray-400">{s.candidate_email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{s.exam_name}</p>
                    <p className="text-gray-400">{s.subject}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {new Date(s.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{s.start_time} – {s.end_time}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{s.candidate_id}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
