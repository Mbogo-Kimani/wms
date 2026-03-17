import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Clock, LogOut, LogIn, Calendar, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';

export default function WorkerDashboard() {
  const { location, error: geoError, getLocation } = useGeolocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: todayStatus, refetch, isLoading } = useQuery({
    queryKey: ['attendanceToday'],
    queryFn: async () => {
      const res = await api.get('/attendance/today');
      return res.data;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['employeeProfile'],
    queryFn: async () => {
      const res = await api.get(`/employees/${user.employeeId}`);
      return res.data;
    }
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: async () => {
      const res = await api.get('/leaves/balance');
      return res.data;
    }
  });

  const { data: memos } = useQuery({
    queryKey: ['memos'],
    queryFn: async () => {
      const res = await api.get('/memos');
      return res.data;
    }
  });

  const latestMemo = memos?.[0];

  useEffect(() => { getLocation(); }, []);

  const clockInMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signin', coords),
    onSuccess: () => refetch(),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock in')
  });

  const clockOutMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signout', coords),
    onSuccess: () => refetch(),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock out')
  });

  const handleClockAction = (type: 'in' | 'out') => {
    if (!location) {
      alert("Fetching GPS... Please enable location services.");
      getLocation();
      return;
    }
    if (type === 'in') clockInMutation.mutate(location);
    if (type === 'out') clockOutMutation.mutate(location);
  };

  if (isLoading) return <div className="p-8 text-center text-industrial-gray font-bold">Initializing Workstation...</div>;

  const isSignedOut = !!todayStatus?.signOutTime;
  const isSignedIn = !!todayStatus?.signInTime;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="bg-industrial-slate p-6 rounded-3xl shadow-xl text-white relative overflow-hidden border-b-4 border-industrial-orange">
        <div className="relative z-10">
          <p className="text-industrial-orange font-black uppercase tracking-widest text-xs mb-1">Personnel Profile</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 font-bold uppercase tracking-wider">
            <Clock size={16} className="text-industrial-blue" />
            Active Duty Shift: 07:00 — 15:00
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <ShieldAlert size={120} />
        </div>
      </div>

      {geoError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-pulse">
          <ShieldAlert size={20} />
          <p className="text-sm font-bold">{geoError}</p>
        </div>
      )}

      {profile?.religiousRestDay === dayjs().format('dddd') && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100">
          <Bell size={20} className="animate-bounce" />
          <p className="text-sm font-bold">
            Notice: Today is your religious rest day ({profile.religiousRestDay}).
            Sign-in requires manager authorization.
          </p>
        </div>
      )}

      {/* Primary Actions */}
      <div className="space-y-4">
        {!isSignedIn ? (
          <button 
            onClick={() => handleClockAction('in')}
            disabled={clockInMutation.isPending}
            className="w-full bg-industrial-blue h-32 rounded-3xl text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-active:translate-y-0 transition-transform duration-300" />
            <LogIn size={40} className="mb-1" />
            <span className="text-2xl font-black tracking-tighter uppercase">Clock In Now</span>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Digital Signature Required</span>
          </button>
        ) : !isSignedOut ? (
          <button 
            onClick={() => handleClockAction('out')}
            disabled={clockOutMutation.isPending}
            className="w-full bg-industrial-orange h-32 rounded-3xl text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
          >
             <div className="absolute inset-0 bg-white/10 translate-y-full group-active:translate-y-0 transition-transform duration-300" />
            <LogOut size={40} className="mb-1" />
            <span className="text-2xl font-black tracking-tighter uppercase">Sign Out</span>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">End Shift Log</span>
          </button>
        ) : (
          <div className="w-full bg-green-500/10 border-2 border-green-500 h-32 rounded-3xl text-green-700 flex flex-col items-center justify-center gap-1">
            <CheckCircle2 size={40} className="mb-1" />
            <span className="text-2xl font-black tracking-tighter uppercase">Shift Completed</span>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Work Log Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center text-center py-6">
          <Calendar className="text-industrial-blue mb-2" size={24} />
          <p className="text-[10px] font-bold text-industrial-gray uppercase">Leave Balance</p>
          <p className="text-2xl font-black text-industrial-slate">{leaveBalance?.remainingLeave || 0}d</p>
        </Card>
        <Card className="flex flex-col items-center text-center py-6">
          <Bell className="text-industrial-orange mb-2" size={24} />
          <p className="text-[10px] font-bold text-industrial-gray uppercase">Pending Memos</p>
          <p className="text-2xl font-black text-industrial-slate">{memos?.length || 0}</p>
        </Card>
      </div>

      <Card className="!p-6 bg-white border-dashed border-2 border-gray-200">
        <h3 className="font-bold text-industrial-slate mb-4 flex items-center justify-between">
          Latest Circular
          {latestMemo && dayjs(latestMemo.createdAt).isAfter(dayjs().subtract(24, 'hour')) && (
            <Badge variant="danger">New</Badge>
          )}
        </h3>
        {latestMemo ? (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="font-bold text-sm text-industrial-slate">{latestMemo.title}</p>
            <p className="text-xs text-industrial-gray mt-1 leading-relaxed">
              {latestMemo.message}
            </p>
            <p className="text-[8px] font-bold text-industrial-blue uppercase mt-2">
              Issued {dayjs(latestMemo.createdAt).format('DD MMM YYYY')}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-center text-xs text-industrial-gray">
            No active communications pending
          </div>
        )}
        <a href="/worker/memos" className="block text-center mt-4 text-industrial-blue text-xs font-bold uppercase tracking-widest hover:underline">
          View All Communications
        </a>
      </Card>
    </div>
  );
}