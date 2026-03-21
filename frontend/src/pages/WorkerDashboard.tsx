import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Clock, LogOut, LogIn, Calendar, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

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
      if (!user.employeeId || user.employeeId === 'null') {
        throw new Error('No employee profile associated with this account');
      }
      const res = await api.get(`/employees/${user.employeeId}`);
      return res.data;
    },
    retry: false
  });

  useEffect(() => {
    if (!user.employeeId || user.employeeId === 'null') {
      toast.error("Your account has no associated employee profile. Please contact admin.");
      localStorage.clear();
      window.location.href = '/login';
    }
  }, [user.employeeId]);

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

  const { data: holidays } = useQuery({
    queryKey: ['upcomingHolidays'],
    queryFn: async () => {
      const res = await api.get('/holidays/upcoming');
      return res.data;
    }
  });

  const { data: mySchedules } = useQuery({
    queryKey: ['mySchedules'],
    queryFn: async () => {
      const res = await api.get('/schedules/my');
      return res.data;
    }
  });

  const { data: myHolidayRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['myHolidayRequests'],
    queryFn: async () => {
      const res = await api.get('/holiday-work-requests/my');
      return res.data;
    }
  });

  const requestWorkMutation = useMutation({
    mutationFn: (holidayId: string) => api.post('/holiday-work-requests', { holidayId }),
    onSuccess: () => {
      toast.success('Work request submitted successfully!');
      refetchRequests();
    }
  });

  const latestMemo = memos?.[0];

  useEffect(() => { getLocation(); }, []);

  const clockInMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signin', coords),
    onSuccess: () => refetch(),
    onError: (err: any) => {
      // toast.error is already handled by api.ts interceptor
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signout', coords),
    onSuccess: () => refetch(),
    onError: (err: any) => {
      // toast.error is already handled by api.ts interceptor
    }
  });

  const handleClockAction = (type: 'in' | 'out') => {
    // Non-blocking location fetch
    if (!location) {
      toast.loading("Fetching GPS... Attempting clock action anyway.", { duration: 2000 });
      getLocation();
    }
    
    const payload = location || { lat: 0, lng: 0 }; // Send empty coords if not available
    if (type === 'in') clockInMutation.mutate(payload);
    if (type === 'out') clockOutMutation.mutate(payload);
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
            {profile?.employee?.shiftId?.name || 'Assigned Shift'}: {profile?.employee?.shiftId?.startTime || '07:00'} — {profile?.employee?.shiftId?.endTime || '15:00'}
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

      {(profile?.employee?.religiousRestDay || profile?.religiousRestDay) === dayjs().format('dddd') && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100">
          <Bell size={20} className="animate-bounce" />
          <p className="text-sm font-bold">
            Notice: Today is your religious rest day ({profile?.employee?.religiousRestDay || profile?.religiousRestDay}).
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

      <Card className="!p-6">
        <h3 className="font-bold text-industrial-slate mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-industrial-blue" />
          Upcoming Holidays
        </h3>
        <div className="space-y-3">
          {holidays?.map((h: any) => {
            const existingRequest = myHolidayRequests?.find((r: any) => r.holidayId?._id === h._id);
            return (
              <div key={h._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group">
                <div>
                  <p className="font-bold text-sm text-industrial-slate">{h.name}</p>
                  <p className="text-[10px] font-bold text-industrial-blue uppercase">
                    {dayjs(h.date).format('ddd, DD MMM YYYY')}
                  </p>
                </div>
                <div>
                  {existingRequest ? (
                    <Badge variant={
                      existingRequest.status === 'approved' ? 'success' : 
                      existingRequest.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {existingRequest.status.toUpperCase()}
                    </Badge>
                  ) : (
                    <button 
                      onClick={() => requestWorkMutation.mutate(h._id)}
                      disabled={requestWorkMutation.isPending}
                      className="text-[10px] font-black uppercase tracking-widest text-industrial-blue bg-white px-3 py-1.5 rounded-lg border border-industrial-blue/20 hover:bg-industrial-blue hover:text-white transition-all shadow-sm"
                    >
                      {requestWorkMutation.isPending ? 'Sending...' : 'Request to Work'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(!holidays || holidays.length === 0) && (
            <div className="text-center p-4 italic text-xs text-industrial-gray">No upcoming holidays scheduled</div>
          )}
        </div>
      </Card>

      {/* Upcoming Schedule Overrides */}
      {Array.isArray(mySchedules) && mySchedules.length > 0 && (
        <Card className="!p-6 border-industrial-orange/20 border-l-4">
          <h3 className="font-bold text-industrial-slate mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-industrial-orange" />
            Your Special Assignments
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {mySchedules.map((s: any) => (
              <div key={s._id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-industrial-orange uppercase tracking-wider">
                    {dayjs(s.date).format('dddd, DD MMM')}
                  </span>
                  <Badge variant={s.isHolidayShift ? 'info' : 'warning'} className="text-[8px] px-1.5 py-0">
                    {s.isHolidayShift ? 'Holiday' : 'Override'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-industrial-slate">
                  <Clock size={12} className="text-industrial-gray" />
                  <span className="text-sm font-bold">{s.shiftId?.name}</span>
                  <span className="text-xs text-industrial-gray font-medium">({s.shiftId?.startTime} - {s.shiftId?.endTime})</span>
                </div>
                {s.notes && (
                  <p className="text-[10px] text-industrial-gray italic mt-1 border-t border-gray-50 pt-1 line-clamp-1">
                    {s.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-industrial-gray mt-4 bg-gray-50 p-3 rounded-xl italic">
            Note: These are special assignments outside your regular profile.
          </p>
        </Card>
      )}

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