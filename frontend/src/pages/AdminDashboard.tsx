import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Users, Clock, Calendar, AlertTriangle, UserCheck } from 'lucide-react';
import QuickClock from '../components/QuickClock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;
  const employeeId = user.employeeId;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/attendance-overview');
      return res.data;
    }
  });

  const { data: myHolidayRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['myHolidayRequests'],
    queryFn: async () => {
      const res = await api.get('/holiday-work-requests/my');
      return res.data;
    },
    enabled: !!employeeId
  });

  const { data: mySchedules } = useQuery({
    queryKey: ['mySchedules'],
    queryFn: async () => {
      const res = await api.get('/schedules/my');
      return res.data;
    },
    enabled: !!employeeId
  });

  const requestWorkMutation = useMutation({
    mutationFn: (holidayId: string) => api.post('/holiday-work-requests', { holidayId }),
    onSuccess: () => {
      toast.success('Work request submitted successfully!');
      refetchRequests();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit request');
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
  
  const { data: trendData } = useQuery({
    queryKey: ['attendanceTrend'],
    queryFn: async () => {
      const res = await api.get('/analytics/attendance-trend');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-industrial-gray font-medium">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Operations Overview" 
        subtitle="Real-time workforce distribution and attendance metrics"
      />

      <QuickClock />

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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }} />
                <Bar dataKey="present" name="Present/Late" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="absent" name="Absent" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-industrial-slate mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-industrial-blue" />
              Upcoming Holidays
            </h3>
            <div className="space-y-3">
              {Array.isArray(upcomingHolidays) && upcomingHolidays.length > 0 ? upcomingHolidays.map((h: any) => {
                const existingRequest = myHolidayRequests?.find((r: any) => r.holidayId?._id === h._id);
                return (
                  <div key={h._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-industrial-slate">{h.name}</span>
                      <span className="text-[10px] font-extrabold text-industrial-blue uppercase">{dayjs(h.date).format('DD MMM')}</span>
                    </div>
                    
                    {employeeId ? (
                      <div className="flex justify-end">
                        {existingRequest ? (
                          <Badge variant={
                            existingRequest.status === 'approved' ? 'success' : 
                            existingRequest.status === 'rejected' ? 'danger' : 'warning'
                          } className="text-[9px] px-2 py-0.5">
                            {existingRequest.status.toUpperCase()}
                          </Badge>
                        ) : (
                          <button 
                            onClick={() => requestWorkMutation.mutate(h._id)}
                            disabled={requestWorkMutation.isPending}
                            className="text-[9px] font-black uppercase tracking-widest text-industrial-blue bg-white px-3 py-1.5 rounded-lg border border-industrial-blue/20 hover:bg-industrial-blue hover:text-white transition-all shadow-sm"
                          >
                            {requestWorkMutation.isPending ? 'Sending...' : 'Request to Work'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-400 italic text-right">Profile Required to Request</p>
                    )}
                  </div>
                );
              }) : (
                <p className="text-xs text-gray-400 italic text-center py-4">No upcoming holidays scheduled</p>
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

          {/* Special Assignments for Admins/Managers with Profiles */}
          {Array.isArray(mySchedules) && mySchedules.length > 0 && (
            <Card className="border-industrial-orange/20 border-l-4">
              <h3 className="font-bold text-industrial-slate mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-industrial-orange" />
                Your Special Assignments
              </h3>
              <div className="space-y-3">
                {mySchedules.map((s: any) => (
                  <div key={s._id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[10px] text-industrial-orange uppercase tracking-wider">
                        {dayjs(s.date).format('ddd, DD MMM')}
                      </span>
                      <Badge variant={s.isHolidayShift ? 'info' : 'warning'} className="text-[8px] px-1.5 py-0">
                        {s.isHolidayShift ? 'Holiday' : 'Override'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-industrial-slate">
                      <Clock size={12} className="text-industrial-gray" />
                      <span className="text-xs font-bold">{s.shiftId?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}