'use client';
import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import { Users, CheckCircle, BookOpen, AlertTriangle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AdminKPIGridProps {
  scheduledToday?: number;
}

export default function AdminKPIGrid({ scheduledToday = 0 }: AdminKPIGridProps) {
  const [totalScheduled, setTotalScheduled] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from('exam_schedules')
          .select('*', { count: 'exact', head: true });
        setTotalScheduled(count ?? 0);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="col-span-2 md:col-span-2">
        <MetricCard
          title="Total Scheduled Candidates"
          value={loading ? '—' : String(totalScheduled)}
          subtitle="All exam schedules created via portal"
          icon={Users}
          size="hero"
        />
      </div>
      <MetricCard title="Scheduled Today" value={String(scheduledToday)} subtitle="Exams scheduled for today" icon={Calendar} />
      <MetricCard title="Active Exams Now" value="0" subtitle="Live exams in progress" icon={BookOpen} />
      <MetricCard title="Overall Pass Rate" value="—" subtitle="No results yet" icon={CheckCircle} />
      <MetricCard title="Avg Score (Round 1)" value="—" subtitle="No exam data yet" icon={TrendingUp} />
      <MetricCard title="Anti-Cheat Alerts" value="0" subtitle="No violations detected" icon={AlertTriangle} />
      <MetricCard title="Round 3 Qualifiers" value="0" subtitle="Cleared R1 + R2" icon={Clock} />
    </div>
  );
}