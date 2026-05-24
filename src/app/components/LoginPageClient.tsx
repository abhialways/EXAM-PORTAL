'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, Users, User, Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type Role = 'admin' | 'hr' | 'candidate';

interface LoginForm {
  username: string;
  password: string;
}

const roleConfig = {
  admin: { icon: Shield, label: 'Admin', desc: 'Full system control' },
  hr: { icon: Users, label: 'HR', desc: 'Recruitment analytics' },
  candidate: { icon: User, label: 'Candidate', desc: 'Take your exam' },
};

const adminAccounts = [
  { role: 'admin' as Role, username: 'admin@examportal.in', password: 'Admin@2026', label: 'Admin', route: '/admin-dashboard' },
  { role: 'hr' as Role, username: 'hr.manager@examportal.in', password: 'HR@secure2026', label: 'HR Manager', route: '/hr-dashboard' },
];

export default function LoginPageClient() {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const router = useRouter();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAutofill = (account: typeof adminAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setSelectedRole(account.role);
    toast.success(`Autofilled ${account.label} credentials`);
  };

  const validate = (): boolean => {
    const errs: Partial<LoginForm> = {};
    if (!username.trim()) errs.username = 'This field is required';
    if (!password.trim()) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (selectedRole === 'candidate') {
        const supabase = createClient();
        const { data: schedule, error } = await supabase
          .from('exam_schedules')
          .select('*')
          .eq('candidate_id', username.trim())
          .eq('candidate_password', password.trim())
          .maybeSingle();

        if (error) {
          toast.error('Login error: ' + error.message);
          setIsLoading(false);
          return;
        }

        if (!schedule) {
          toast.error('Invalid Candidate ID or password.');
          setIsLoading(false);
          return;
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (schedule.exam_date !== todayStr) {
          toast.error(`Your exam is scheduled for ${schedule.exam_date}.`);
          setIsLoading(false);
          return;
        }

        const [startH, startM] = schedule.start_time.split(':').map(Number);
        const [endH, endM] = schedule.end_time.split(':').map(Number);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
          // Format start/end for display with AM/PM
          const fmtTime = (h: number, m: number) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 === 0 ? 12 : h % 12;
            return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
          };
          toast.error(`Exam window is ${fmtTime(startH, startM)} – ${fmtTime(endH, endM)}. Please wait until the scheduled start time.`);
          setIsLoading(false);
          return;
        }

        // Store candidate session for exam interface
        if (typeof window !== 'undefined') {
          localStorage.setItem('candidate_id', schedule.candidate_id);
          localStorage.setItem('candidate_name', schedule.candidate_name || '');
          localStorage.setItem('exam_schedule_id', schedule.id);
        }

        toast.success('Welcome! Starting your exam...');
        setTimeout(() => router.push('/candidate-exam-interface'), 800);
        return;
      }

      const supabase = createClient();
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email: username.trim(),
        password: password.trim(),
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials') || authError.message.toLowerCase().includes('invalid credentials')) {
          toast.error('Invalid email or password.');
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          toast.error('Email not confirmed. Contact the administrator.');
        } else {
          toast.error('Login failed: ' + authError.message);
        }
        setIsLoading(false);
        return;
      }

      const user = signInData?.user;
      if (!user) {
        toast.error('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const metaRole = user.raw_user_meta_data?.role || user.app_metadata?.role || selectedRole;
      const routeMap: Record<string, string> = {
        admin: '/admin-dashboard',
        hr: '/hr-dashboard',
        candidate: '/candidate-exam-interface',
      };

      toast.success(`Welcome! Signing in as ${metaRole}...`);
      setTimeout(() => router.push(routeMap[metaRole] ?? '/admin-dashboard'), 800);
    } catch (err: any) {
      toast.error('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = roleConfig[selectedRole];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">EP</span>
          </div>
          <span className="font-semibold text-gray-900">ExamPortal</span>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-5">Select your role and enter credentials</p>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(Object.entries(roleConfig) as [Role, typeof roleConfig.admin][]).map(([role, config]) => {
            const RoleIcon = config.icon;
            const isSelected = selectedRole === role;
            return (
              <button
                key={`role-${role}`}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded border text-xs transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <RoleIcon size={15} />
                <span className="font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Candidate notice */}
        {selectedRole === 'candidate' && (
          <div className="flex items-start gap-2 p-3 rounded border border-blue-200 bg-blue-50 mb-4">
            <Clock size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Use your Candidate ID and password provided by the admin. Login is only allowed during your scheduled exam window.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {selectedRole === 'candidate' ? 'Candidate ID' : 'Email Address'}
            </label>
            <input
              type={selectedRole === 'candidate' ? 'text' : 'email'}
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors((p) => ({ ...p, username: undefined })); }}
              placeholder={selectedRole === 'candidate' ? 'e.g. CND-2026-001' : selectedRole === 'admin' ? 'admin@examportal.in' : 'hr@examportal.in'}
              className={`w-full px-3 py-2 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                errors.username ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 pr-9 rounded border text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In as {currentRole.label}</span>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        {selectedRole !== 'candidate' && (
          <div className="mt-5 rounded border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 flex items-center gap-1.5">
              <AlertCircle size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">Demo accounts — click to autofill</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-100">
                {adminAccounts.map((acc) => (
                  <tr
                    key={`demo-${acc.role}`}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAutofill(acc)}
                  >
                    <td className="px-3 py-2 font-medium text-gray-700">{acc.label}</td>
                    <td className="px-3 py-2 font-mono text-gray-500 truncate max-w-[110px]">{acc.username}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(acc.password, acc.role); }}
                        className="p-1 rounded text-gray-400 hover:text-gray-600"
                        title="Copy password"
                      >
                        {copiedField === acc.role ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedRole === 'candidate' && (
          <div className="mt-5 bg-gray-50 rounded border border-gray-200 p-3">
            <p className="text-xs text-gray-500">
              Your Candidate ID and password are provided by the admin when your exam is scheduled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}