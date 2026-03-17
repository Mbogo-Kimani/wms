import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import { Users, Clock, Calendar, AlertTriangle, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/attendance-overview');
      return res.data;
    }
  });

  const { data: upcomingHolidays } = useQuery({
    queryKey: ['upcomingHolidays'],
    queryFn: async () => {
      const res = await api.get('/holidays/upcoming');
      return res.data;
    }
  });

  const { data: reliability } = useQuery({
    queryKey: ['topReliability'],
    queryFn: async () => {
      const res = await api.get('/analytics/reliability-scores');
      return res.data.slice(0, 3);
    }
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['pendingCount'],
    queryFn: async () => {
      const res = await api.get('/onboarding/pending');
      return res.data.length;
    },
    enabled: role === 'admin' || role === 'manager'
  });

  if (isLoading) return <div className="p-8 text-center text-industrial-gray font-medium">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Operations Overview" 
        subtitle="Real-time workforce distribution and attendance metrics"
      />

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Workforce" 
          value={stats?.details?.total || 0} 
          icon={<Users size={24} />}
          trend={{ value: '0%', isUp: true }}
        />
        {(role === 'admin' || role === 'manager') && (
          <StatCard 
            label="Pending Approvals" 
            value={pendingCount || 0} 
            icon={<UserCheck size={24} />}
            className={pendingCount > 0 ? 'ring-2 ring-industrial-orange animate-pulse' : ''}
            onClick={() => window.location.href = '/admin/pending-registrations'}
          />
        )}
        <StatCard 
          label="On-Site Today" 
          value={stats?.details?.present || 0} 
          icon={<Clock size={24} />}
          trend={{ value: `${stats?.attendanceRate || 0}% Rate`, isUp: true }}
        />
        <StatCard 
          label="Late Occurrences" 
          value={stats?.details?.late || 0} 
          icon={<AlertTriangle size={24} />}
          trend={{ value: `${stats?.lateRate || 0}% Impact`, isUp: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity or Chart Placeholder */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold text-industrial-slate mb-6">Attendance Density</h2>
          <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-industrial-gray italic text-sm">
            Activity heat map visualization placeholder
          </div>
        </Card>

        {/* Quick Actions / System Status */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-industrial-slate mb-4">Upcoming Holidays</h3>
            <div className="space-y-3">
              {Array.isArray(upcomingHolidays) ? upcomingHolidays.map((h: any) => (
                <div key={h._id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                  <span className="font-bold text-industrial-slate">{h.name}</span>
                  <span className="text-[10px] font-extrabold text-industrial-orange uppercase">{dayjs(h.date).format('DD MMM')}</span>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic">No upcoming holidays</p>
              )}
            </div>
          </Card>

          <Card className="bg-industrial-slate text-white">
            <h3 className="font-bold mb-4">Top Reliable Workers</h3>
            <div className="space-y-3">
              {Array.isArray(reliability) ? reliability.map((r: any) => (
                <div key={r.id} className="flex justify-between items-center text-sm">
                  <span className="opacity-80 font-medium">{r.name}</span>
                  <span className="text-industrial-orange font-black">{r.score}</span>
                </div>
              )) : (
                <p className="text-xs text-white/50 italic">No reliability data available</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import dayjs from 'dayjs';