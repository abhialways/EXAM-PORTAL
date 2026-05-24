'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Send, Loader2, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Phone, Mail, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import CandidateExamReviewModal from './CandidateExamReviewModal';

interface RoundResult {
  id: string;
  schedule_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_contact: string;
  job_role: string;
  round_number: number;
  round_name: string;
  marks_obtained: number;
  total_marks: number;
  pass_mark: number;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  notification_status: 'not_sent' | 'sent' | 'failed';
  submitted_at: string | null;
  answers: Record<string, string> | null;
  hr_validated: boolean;
  hr_verdict: string | null;
  hr_notes: string | null;
}

interface CandidateGroup {
  schedule_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_contact: string;
  job_role: string;
  rounds: RoundResult[];
}

function StatusBadge({ status, hrValidated }: { status: RoundResult['status']; hrValidated?: boolean }) {
  if (status === 'passed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle size={10} />{hrValidated ? 'PASS (HR)' : 'PASS'}
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} />{hrValidated ? 'FAIL (HR)' : 'FAIL'}
    </span>
  );
  if (status === 'in_progress') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
      <Clock size={10} />IN PROGRESS
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <AlertCircle size={10} />PENDING
    </span>
  );
}

function OverallBadge({ rounds }: { rounds: RoundResult[] }) {
  const completed = rounds.filter((r) => r.status === 'passed' || r.status === 'failed');
  const allPassed = completed.length === 3 && completed.every((r) => r.status === 'passed');
  const anyFailed = completed.some((r) => r.status === 'failed');
  if (allPassed) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">ALL PASSED</span>;
  if (anyFailed) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">FAILED</span>;
  if (completed.length > 0) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">IN PROGRESS</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">NOT STARTED</span>;
}

export default function CandidatePerformanceTable() {
  const [groups, setGroups] = useState<CandidateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [reviewRound, setReviewRound] = useState<{ group: CandidateGroup; round: RoundResult } | null>(null);
  const supabase = createClient();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_round_results')
        .select('*')
        .order('candidate_name', { ascending: true })
        .order('round_number', { ascending: true });

      if (error) throw error;

      const map = new Map<string, CandidateGroup>();
      (data ?? []).forEach((row: RoundResult) => {
        if (!map.has(row.schedule_id)) {
          map.set(row.schedule_id, {
            schedule_id: row.schedule_id,
            candidate_id: row.candidate_id,
            candidate_name: row.candidate_name,
            candidate_email: row.candidate_email,
            candidate_contact: row.candidate_contact ?? '',
            job_role: row.job_role,
            rounds: [],
          });
        }
        map.get(row.schedule_id)!.rounds.push(row);
      });

      setGroups(Array.from(map.values()));
    } catch (err: any) {
      toast.error('Failed to load results: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const channel = supabase
      .channel('hr-results-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_round_results' }, () => { fetchResults(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'exam_schedules' }, () => { fetchResults(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchResults]);

  const toggleExpand = (scheduleId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) next.delete(scheduleId);
      else next.add(scheduleId);
      return next;
    });
  };

  const handleSendNotification = async (group: CandidateGroup) => {
    setSending((prev) => new Set(prev).add(group.schedule_id));
    try {
      const res = await fetch('/api/hr/send-result-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: group.schedule_id,
          candidate_email: group.candidate_email,
          candidate_name: group.candidate_name,
          candidate_id: group.candidate_id,
          job_role: group.job_role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Resend API key not configured') {
          toast.error('Email service not configured. Add RESEND_API_KEY to environment variables.');
        } else {
          toast.error('Failed to send: ' + (data.error ?? 'Unknown error'));
        }
      } else {
        toast.success(`Result email sent to ${group.candidate_email}`);
        fetchResults();
      }
    } catch (err: any) {
      toast.error('Send failed: ' + err.message);
    } finally {
      setSending((prev) => {
        const next = new Set(prev);
        next.delete(group.schedule_id);
        return next;
      });
    }
  };

  const uniqueRoles = Array.from(new Set(groups.map((g) => g.job_role).filter(Boolean)));

  const filtered = groups.filter((g) => {
    const matchSearch =
      !search ||
      g.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      g.candidate_id.toLowerCase().includes(search.toLowerCase()) ||
      g.candidate_email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || g.job_role === roleFilter;
    const completed = g.rounds.filter((r) => r.status === 'passed' || r.status === 'failed');
    const allPassed = completed.length === 3 && completed.every((r) => r.status === 'passed');
    const anyFailed = completed.some((r) => r.status === 'failed');
    const overallResult = allPassed ? 'pass' : anyFailed ? 'fail' : 'pending';
    const matchResult = !resultFilter || overallResult === resultFilter;
    return matchSearch && matchRole && matchResult;
  });

  return (
    <>
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Candidate Round Results</h3>
            <button
              onClick={fetchResults}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 flex-1 min-w-40">
              <Search size={13} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or email..."
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white text-gray-700 outline-none"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white text-gray-700 outline-none"
            >
              <option value="">All Results</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <p className="text-sm text-gray-500">
              {groups.length === 0
                ? 'Candidate results will appear here once exams are completed.'
                : 'No candidates match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((group) => {
              const isExpanded = expanded.has(group.schedule_id);
              const isSending = sending.has(group.schedule_id);
              const notifSent = group.rounds.some((r) => r.notification_status === 'sent');
              const hasAnyResult = group.rounds.some((r) => r.status === 'passed' || r.status === 'failed');
              // Show review button if round 1 has been submitted
              const round1 = group.rounds.find((r) => r.round_number === 1);
              const canReview = round1 && round1.submitted_at;

              return (
                <div key={group.schedule_id}>
                  <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{group.candidate_name}</span>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{group.candidate_id}</span>
                        <OverallBadge rounds={group.rounds} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} className="text-gray-400" />{group.candidate_email}</span>
                        {group.candidate_contact && (
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} className="text-gray-400" />{group.candidate_contact}</span>
                        )}
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{group.job_role}</span>
                      </div>
                    </div>

                    {/* Round score pills */}
                    <div className="hidden md:flex items-center gap-1.5">
                      {group.rounds.map((r) => (
                        <div
                          key={r.round_number}
                          className={`text-xs px-2 py-0.5 rounded border ${r.status === 'passed' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                          title={r.round_name}
                        >
                          R{r.round_number}: {r.status === 'pending' ? '—' : `${r.marks_obtained}`}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Review Exam button — shown when round 1 is submitted */}
                      {canReview && (
                        <button
                          onClick={() => setReviewRound({ group, round: round1! })}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors border ${round1?.hr_validated ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}
                          title="Review exam responses and validate"
                        >
                          <Eye size={11} />
                          {round1?.hr_validated ? 'Re-Review' : 'Review'}
                        </button>
                      )}
                      {hasAnyResult && (
                        <button
                          onClick={() => handleSendNotification(group)}
                          disabled={isSending}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${notifSent ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                          {notifSent ? 'Resend' : 'Notify'}
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(group.schedule_id)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded round details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      {/* Candidate contact info */}
                      <div className="pt-3 pb-2 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={12} className="text-gray-400" />
                          <span>{group.candidate_email}</span>
                        </div>
                        {group.candidate_contact && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone size={12} className="text-gray-400" />
                            <span>{group.candidate_contact}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                        {group.rounds.map((round) => (
                          <div key={round.round_number} className="bg-white border border-gray-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-xs text-gray-400">Round {round.round_number}</p>
                                <p className="text-sm font-medium text-gray-800">{round.round_name}</p>
                              </div>
                              <StatusBadge status={round.status} hrValidated={round.hr_validated} />
                            </div>

                            {round.status !== 'pending' ? (
                              <>
                                <p className="text-xl font-semibold text-gray-900 mb-1">
                                  {round.marks_obtained}<span className="text-sm font-normal text-gray-400"> / {round.total_marks}</span>
                                </p>
                                <div className="w-full bg-gray-100 rounded-full h-1 mb-1.5">
                                  <div
                                    className={`h-1 rounded-full ${round.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, (round.marks_obtained / round.total_marks) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400">Pass mark: {round.pass_mark}</p>
                                {round.hr_validated && round.hr_notes && (
                                  <p className="text-xs text-purple-600 mt-1.5 pt-1.5 border-t border-gray-100 italic">
                                    HR note: {round.hr_notes}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400 py-2">Awaiting exam completion</p>
                            )}

                            {round.submitted_at && (
                              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                                Submitted: {new Date(round.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            )}

                            {/* Review button inside expanded card for round 1 */}
                            {round.round_number === 1 && round.submitted_at && (
                              <button
                                onClick={() => setReviewRound({ group, round })}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 transition-colors"
                              >
                                <Eye size={11} />
                                {round.hr_validated ? 'Re-Review & Validate' : 'Review & Validate'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Email notification:</span>
                        {group.rounds[0]?.notification_status === 'sent' ? (
                          <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} />Sent</span>
                        ) : group.rounds[0]?.notification_status === 'failed' ? (
                          <span className="text-xs text-red-600 flex items-center gap-1"><XCircle size={10} />Failed</span>
                        ) : (
                          <span className="text-xs text-gray-400">Not sent yet</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {groups.length} candidates</p>
          <p className="text-xs text-gray-400">Pass mark: 30 per round</p>
        </div>
      </div>

      {/* HR Exam Review Modal */}
      {reviewRound && (
        <CandidateExamReviewModal
          candidateName={reviewRound.group.candidate_name}
          candidateId={reviewRound.group.candidate_id}
          round={reviewRound.round}
          onClose={() => setReviewRound(null)}
          onValidated={fetchResults}
        />
      )}
    </>
  );
}