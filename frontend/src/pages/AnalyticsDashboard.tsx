import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data: attendance } = useQuery({
    queryKey: ['analytics-attendance'],
    queryFn: async () => {
      const res = await api.get('/analytics/attendance-overview');
      return res.data;
    }
  });

  const { data: deptAttendance } = useQuery({
    queryKey: ['analytics-dept'],
    queryFn: async () => {
      const res = await api.get('/analytics/department-attendance');
      return res.data;
    }
  });

  const { data: trendData } = useQuery({
    queryKey: ['analytics-trend'],
    queryFn: async () => {
      const res = await api.get('/analytics/attendance-trend');
      return res.data;
    }
  });

  const COLORS = ['#1E3A5F', '#EA580C', '#22C55E', '#64748B'];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Workforce Intelligence" 
        subtitle="Advanced data analytics and employee reliability metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Attendance Rate" 
          value={`${attendance?.attendanceRate || 0}%`} 
          trend={attendance?.trends?.attendance} 
          icon={<Users size={24} />} 
        />
        <StatCard 
          label="Late Frequency" 
          value={`${attendance?.lateRate || 0}%`} 
          trend={attendance?.trends?.late} 
          icon={<Clock size={24} />} 
        />
        <StatCard 
          label="Absence Index" 
          value={`${attendance?.absenceRate || 0}%`} 
          trend={attendance?.trends?.absence} 
          icon={<AlertTriangle size={24} />} 
        />
        <StatCard 
          label="Active Reliability" 
          value={`${attendance?.avgReliability || 0}%`} 
          trend={attendance?.trends?.reliability} 
          icon={<TrendingUp size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="font-bold text-industrial-slate mb-6">Attendance by Department</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAttendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E3A5F', color: '#fff', borderRadius: '12px', border: 'none' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="present" fill="#1E3A5F" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-industrial-slate mb-6 text-center">7-Day Attendance Trend</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E3A5F', color: '#fff', borderRadius: '12px', border: 'none' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="present" name="Present" stroke="#1E3A5F" strokeWidth={3} dot={{ r: 4, fill: '#1E3A5F' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#EA580C" strokeWidth={3} dot={{ r: 4, fill: '#EA580C' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-industrial-slate mb-6">Workforce Distribution</h3>
          <div className="h-80 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'On Site', value: attendance?.details?.present || 0 },
                    { name: 'On Leave', value: attendance?.details?.onLeave || 0 },
                    { name: 'Absent', value: attendance?.details?.absent || 0 },
                  ]}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-industrial-slate">{attendance?.details?.total || 0}</span>
              <span className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Total Staff</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
