'use client';
import React, { useState } from 'react';
import { X, Calendar, Clock, Mail, BookOpen, User, Copy, Check, Loader2, Briefcase, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleExamModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  candidateEmail: string;
  candidateName: string;
  candidateContact: string;
  examName: string;
  subject: string;
  jobRole: string;
  examDate: string;
  startHour: string;
  startMinute: string;
  startAmPm: 'AM' | 'PM';
  endHour: string;
  endMinute: string;
  endAmPm: 'AM' | 'PM';
}

interface GeneratedCredentials {
  candidateId: string;
  password: string;
  candidateEmail: string;
  candidateContact: string;
  examName: string;
  subject: string;
  jobRole: string;
  examDate: string;
  startTime: string;
  endTime: string;
  startTimeDisplay: string;
  endTimeDisplay: string;
}

const SUBJECTS = [
  'Communication Test',
  'Excel Test',
  'Data Analyst',
  'Accountant',
  'Core Technical',
];

const JOB_ROLES = [
  { value: 'Data Analyst', label: 'Data Analyst', rounds: ['Communication Test', 'Excel Test', 'Core Test (Data Analyst)'] },
  { value: 'Accountant', label: 'Accountant', rounds: ['Communication Test', 'Excel Test', 'Core Test (Accountant)'] },
  { value: 'Core Technical', label: 'Core Technical', rounds: ['Communication Test', 'Excel Test', 'Core Test (Technical)'] },
  { value: 'Other', label: 'Other', rounds: ['Communication Test', 'Excel Test', 'Core Test'] },
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function to24Hour(hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  let h = parseInt(hour, 10);
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function formatDisplayTime(hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  return `${hour}:${minute} ${ampm}`;
}

function generateCandidateId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(100 + Math.random() * 900);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `CND-${year}-${num}${suffix}`;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '@#$!';
  let pass = '';
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];
  pass += Math.floor(10 + Math.random() * 90);
  return pass.split('').sort(() => Math.random() - 0.5).join('');
}

const emptyForm: FormData = {
  candidateEmail: '',
  candidateName: '',
  candidateContact: '',
  examName: '',
  subject: '',
  jobRole: '',
  examDate: '',
  startHour: '09',
  startMinute: '00',
  startAmPm: 'AM',
  endHour: '10',
  endMinute: '00',
  endAmPm: 'AM',
};

export default function ScheduleExamModal({ open, onClose, onSuccess }: ScheduleExamModalProps) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<GeneratedCredentials | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'time', string>>>({});

  const selectedRole = JOB_ROLES.find((r) => r.value === form.jobRole);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData | 'time', string>> = {};
    if (!form.candidateEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.candidateEmail))
      errs.candidateEmail = 'Valid email required';
    if (!form.candidateName.trim()) errs.candidateName = 'Candidate name required';
    if (!form.candidateContact.trim() || !/^\+?[\d\s\-()]{7,15}$/.test(form.candidateContact.trim()))
      errs.candidateContact = 'Valid contact number required';
    if (!form.examName.trim()) errs.examName = 'Exam name required';
    if (!form.subject) errs.subject = 'Subject required';
    if (!form.jobRole) errs.jobRole = 'Job role required';
    if (!form.examDate) errs.examDate = 'Date required';

    const start24 = to24Hour(form.startHour, form.startMinute, form.startAmPm);
    const end24 = to24Hour(form.endHour, form.endMinute, form.endAmPm);
    if (start24 >= end24) errs.time = 'End time must be after start time';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field.startsWith('start') || field.startsWith('end')) setErrors((prev) => ({ ...prev, time: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const candidateId = generateCandidateId();
      const password = generatePassword();

      const start24 = to24Hour(form.startHour, form.startMinute, form.startAmPm);
      const end24 = to24Hour(form.endHour, form.endMinute, form.endAmPm);

      const res = await fetch('/api/admin/schedule-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_email: form.candidateEmail.trim().toLowerCase(),
          candidate_name: form.candidateName.trim(),
          candidate_contact: form.candidateContact.trim(),
          exam_name: form.examName.trim(),
          subject: form.subject,
          job_role: form.jobRole,
          exam_date: form.examDate,
          start_time: start24,
          end_time: end24,
          candidate_id: candidateId,
          candidate_password: password,
          status: 'scheduled',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'duplicate') {
          toast.error('A schedule with this candidate ID already exists. Please try again.');
        } else {
          toast.error('Failed to save schedule: ' + (data.message ?? data.error ?? 'Unknown error'));
        }
        setLoading(false);
        return;
      }

      setCredentials({
        candidateId,
        password,
        candidateEmail: form.candidateEmail.trim().toLowerCase(),
        candidateContact: form.candidateContact.trim(),
        examName: form.examName.trim(),
        subject: form.subject,
        jobRole: form.jobRole,
        examDate: form.examDate,
        startTime: start24,
        endTime: end24,
        startTimeDisplay: formatDisplayTime(form.startHour, form.startMinute, form.startAmPm),
        endTimeDisplay: formatDisplayTime(form.endHour, form.endMinute, form.endAmPm),
      });

      toast.success('Exam scheduled successfully! 3-round sequence initialized.');
      onSuccess?.();
    } catch (err: any) {
      toast.error('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    setForm(emptyForm);
    setCredentials(null);
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded border border-gray-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Schedule Exam</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign a role to auto-map the 3-round test sequence</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500">
            <X size={16} />
          </button>
        </div>

        {/* Credentials display after success */}
        {credentials ? (
          <div className="p-5 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} className="text-green-600" />
                <p className="text-sm font-semibold text-green-700">Exam Scheduled Successfully</p>
              </div>
              <p className="text-xs text-gray-600">
                3-round sequence initialized for <strong>{credentials.jobRole}</strong> role. Share credentials with the candidate.
              </p>
            </div>

            {/* Round sequence info */}
            <div className="border border-gray-200 rounded p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Round Sequence — {credentials.jobRole}</p>
              <div className="space-y-1.5">
                {['Communication Test', 'Excel Test', 'Core Test'].map((round, i) => (
                  <div key={round} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-xs text-gray-700">{round}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">Min 30 marks to pass</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam info */}
            <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
              {[
                { label: 'Exam', value: credentials.examName },
                { label: 'Subject', value: credentials.subject },
                { label: 'Email', value: credentials.candidateEmail },
                { label: 'Contact', value: credentials.candidateContact },
                { label: 'Date', value: new Date(credentials.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                { label: 'Time', value: `${credentials.startTimeDisplay} – ${credentials.endTimeDisplay}` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Credentials */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700">Login Credentials</p>
              {[
                { label: 'Candidate ID (Username)', value: credentials.candidateId, field: 'id' },
                { label: 'Password', value: credentials.password, field: 'pass' },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-4 py-3">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{item.value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.value, item.field)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-500"
                    title="Copy"
                  >
                    {copied === item.field ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setCredentials(null);
                  setForm(emptyForm);
                }}
                className="flex-1 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 transition-colors"
              >
                Schedule Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Candidate Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Mail size={12} />Candidate Email</span>
              </label>
              <input
                type="email"
                value={form.candidateEmail}
                onChange={(e) => handleChange('candidateEmail', e.target.value)}
                placeholder="candidate@example.com"
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.candidateEmail ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.candidateEmail && <p className="text-xs text-red-500 mt-1">{errors.candidateEmail}</p>}
            </div>

            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><User size={12} />Candidate Name</span>
              </label>
              <input
                type="text"
                value={form.candidateName}
                onChange={(e) => handleChange('candidateName', e.target.value)}
                placeholder="Full name"
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.candidateName ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.candidateName && <p className="text-xs text-red-500 mt-1">{errors.candidateName}</p>}
            </div>

            {/* Candidate Contact Number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Phone size={12} />Contact Number</span>
              </label>
              <input
                type="tel"
                value={form.candidateContact}
                onChange={(e) => handleChange('candidateContact', e.target.value)}
                placeholder="+91 9876543210"
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.candidateContact ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.candidateContact && <p className="text-xs text-red-500 mt-1">{errors.candidateContact}</p>}
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Briefcase size={12} />Job Role</span>
              </label>
              <select
                value={form.jobRole}
                onChange={(e) => handleChange('jobRole', e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.jobRole ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select role...</option>
                {JOB_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.jobRole && <p className="text-xs text-red-500 mt-1">{errors.jobRole}</p>}
              {selectedRole && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-2.5">
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">Auto-mapped 3-round sequence</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedRole.rounds.map((r, i) => (
                      <React.Fragment key={r}>
                        <span className="text-[10px] text-gray-700 bg-gray-200 px-2 py-0.5 rounded">{r}</span>
                        {i < selectedRole.rounds.length - 1 && <span className="text-[10px] text-gray-400">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exam Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><BookOpen size={12} />Exam Name</span>
              </label>
              <input
                type="text"
                value={form.examName}
                onChange={(e) => handleChange('examName', e.target.value)}
                placeholder="e.g. May 2026 Recruitment Drive"
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.examName ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.examName && <p className="text-xs text-red-500 mt-1">{errors.examName}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject / Category</label>
              <select
                value={form.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.subject ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1.5"><Calendar size={12} />Exam Date</span>
              </label>
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => handleChange('examDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors.examDate ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.examDate && <p className="text-xs text-red-500 mt-1">{errors.examDate}</p>}
            </div>

            {/* Time range with AM/PM */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1.5"><Clock size={12} />Exam Time</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Start Time</p>
                  <div className="flex gap-1">
                    <select
                      value={form.startHour}
                      onChange={(e) => handleChange('startHour', e.target.value)}
                      className="flex-1 px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select
                      value={form.startMinute}
                      onChange={(e) => handleChange('startMinute', e.target.value)}
                      className="flex-1 px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={form.startAmPm}
                      onChange={(e) => handleChange('startAmPm', e.target.value as 'AM' | 'PM')}
                      className="px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {/* End Time */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">End Time</p>
                  <div className="flex gap-1">
                    <select
                      value={form.endHour}
                      onChange={(e) => handleChange('endHour', e.target.value)}
                      className="flex-1 px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select
                      value={form.endMinute}
                      onChange={(e) => handleChange('endMinute', e.target.value)}
                      className="flex-1 px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={form.endAmPm}
                      onChange={(e) => handleChange('endAmPm', e.target.value as 'AM' | 'PM')}
                      className="px-2 py-2 rounded border border-gray-300 text-sm text-gray-900 bg-white outline-none focus:border-blue-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              {errors.time && <p className="text-xs text-red-500">{errors.time}</p>}
              <p className="text-[10px] text-gray-400">
                Scheduled: {formatDisplayTime(form.startHour, form.startMinute, form.startAmPm)} → {formatDisplayTime(form.endHour, form.endMinute, form.endAmPm)}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-600">
                Selecting a job role auto-initializes a 3-round sequence (Communication → Excel → Core Test). Minimum passing score per round: <strong>30 marks</strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" />Scheduling...</>
                ) : (
                  'Schedule & Generate Credentials'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
