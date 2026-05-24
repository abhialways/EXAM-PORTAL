import React from 'react';
import MetricCard from '@/components/ui/MetricCard';
import { Users, CheckCircle, XCircle, Star, BarChart3 } from 'lucide-react';

export default function HRKPIGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="col-span-2 md:col-span-2">
        <MetricCard
          title="Total Candidates Evaluated"
          value="0"
          subtitle="No candidates have completed exams yet"
          icon={Users}
          size="hero"
        />
      </div>
      <MetricCard
        title="Fully Cleared (All 3 Rounds)"
        value="0"
        subtitle="No completions yet"
        icon={CheckCircle}
      />
      <MetricCard
        title="Did Not Clear"
        value="0"
        subtitle="No eliminations yet"
        icon={XCircle}
      />
      <MetricCard
        title="Shortlisted for Interview"
        value="0"
        subtitle="No shortlisted candidates"
        icon={Star}
      />
      <MetricCard
        title="Avg Score (Final Round)"
        value="—"
        subtitle="No final round data yet"
        icon={BarChart3}
      />
    </div>
  );
}