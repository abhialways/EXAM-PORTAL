'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AdminKPIGrid from './AdminKPIGrid';
import LiveExamMonitor from './LiveExamMonitor';
import RoundFunnelChart from './RoundFunnelChart';
import ActivityFeed from './ActivityFeed';
import DailyAttemptsChart from './DailyAttemptsChart';
import ScheduleExamModal from './ScheduleExamModal';
import { createClient } from '../../../lib/supabase/client';
import ScheduledExamsList from './ScheduledExamsList';

export default function AdminDashboardContent() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [scheduledToday, setScheduledToday] = useState(0);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = new Date()?.toISOString()?.split('T')?.[0];
      const { count } = await supabase?.from('exam_schedules')?.select('*', { count: 'exact', head: true })?.eq('exam_date', today);
      setScheduledToday(count ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Exam cycle overview</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          + Schedule Exam
        </button>
      </div>

      <AdminKPIGrid scheduledToday={scheduledToday} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <DailyAttemptsChart />
        </div>
        <div className="lg:col-span-2">
          <RoundFunnelChart />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <LiveExamMonitor />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <ScheduleExamModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          fetchStats();
          setScheduleRefreshKey((k) => k + 1);
        }}
      />

      <ScheduledExamsList refreshKey={scheduleRefreshKey} />
    </div>
  );
}