'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, RefreshCw, Monitor, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface ActiveCandidate {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_contact: string;
  exam_name: string;
  subject: string;
  job_role: string;
  start_time: string;
  end_time: string;
  exam_date: string;
  status: string;
  notes?: string;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getElapsedMinutes(startTime: string, examDate: string): number {
  const now = new Date();
  const [h, m] = startTime.split(':').map(Number);
  const start = new Date(examDate);
  start.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
}

export default function LiveExamMonitor() {
  const [candidates, setCandidates] = useState<ActiveCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchActiveCandidates = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('exam_date', today)
        .in('status', ['active', 'scheduled'])
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Filter to only show candidates whose exam window is currently active
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const active = (data ?? []).filter((c) => {
        const [sh, sm] = c.start_time.split(':').map(Number);
        const [eh, em] = c.end_time.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        return nowMinutes >= startMin && nowMinutes <= endMin;
      });

      setCandidates(active);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch active candidates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCandidates();

    // Auto-refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchActiveCandidates, 10000);

    // Supabase realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel('live-exam-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_schedules' },
        () => {
          fetchActiveCandidates();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchActiveCandidates]);

  const handleTerminate = async (candidate: ActiveCandidate) => {
    if (!confirm(`Terminate exam for ${candidate.candidate_name}? This will immediately stop and submit their exam as malpractice.`)) return;

    setTerminating(candidate.candidate_id);
    try {
      const res = await fetch('/api/admin/terminate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.candidate_id,
          reason: 'Terminated by admin/HR — malpractice',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error('Failed to terminate: ' + (data.error ?? 'Unknown error'));
        return;
      }

      toast.success(`Exam terminated for ${candidate.candidate_name}. Malpractice recorded.`);
      fetchActiveCandidates();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setTerminating(null);
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor size={15} className="text-gray-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Live Exam Monitor</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? 'Loading...' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} currently active`}
              {lastRefresh && (
                <span className="ml-2 text-gray-300">
                  · Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {candidates.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          )}
          <button
            onClick={fetchActiveCandidates}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Monitor size={28} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No Active Exams</p>
          <p className="text-xs text-gray-400 max-w-xs">
            When candidates are taking exams during their scheduled window, their live status will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {candidates.map((candidate) => {
            const elapsed = getElapsedMinutes(candidate.start_time, candidate.exam_date);
            const isTerminating = terminating === candidate.candidate_id;

            return (
              <div key={candidate.id} className="px-4 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <User size={15} className="text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{candidate.candidate_name}</p>
                    <span className="text-[10px] font-mono text-gray-400">{candidate.candidate_id}</span>
                    {candidate.status === 'active' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        Writing
                      </span>
                    )}
                    {candidate.status === 'scheduled' && (
                      <span className="text-[10px] font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">
                        Logged in
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 truncate">{candidate.exam_name}</span>
                    <span className="text-xs text-gray-400">{candidate.subject}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={10} />
                      {formatTime(candidate.start_time)} – {formatTime(candidate.end_time)}
                    </span>
                    {elapsed > 0 && (
                      <span className="text-xs text-blue-500">{elapsed} min elapsed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-gray-400">✉ {candidate.candidate_email}</span>
                    {candidate.candidate_contact && (
                      <span className="text-[11px] text-gray-400">📞 {candidate.candidate_contact}</span>
                    )}
                  </div>
                </div>

                {/* Terminate button */}
                <button
                  onClick={() => handleTerminate(candidate)}
                  disabled={isTerminating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                  title="Terminate exam — malpractice"
                >
                  <AlertTriangle size={12} />
                  {isTerminating ? 'Terminating...' : 'Terminate'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">
            Auto-refreshes every 10 seconds · Realtime updates enabled · Terminate button immediately stops and submits candidate exam as malpractice
          </p>
        </div>
      )}
    </div>
  );
}
