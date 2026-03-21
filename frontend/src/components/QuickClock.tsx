import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from './Card';
import Button from './Button';
import { LogIn, LogOut, Clock, MapPin, CheckCircle2, AlertCircle, TrendingUp, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickClock() {
  const { location, error: geoError, getLocation } = useGeolocation();
  const [summary, setSummary] = useState<any>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: todayStatus, refetch, isLoading } = useQuery({
    queryKey: ['attendanceTodayQuick'],
    queryFn: async () => {
      const res = await api.get('/attendance/today');
      return res.data;
    }
  });

  const clockInMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signin', coords),
    onSuccess: () => {
      toast.success('Clocked in successfully');
      refetch();
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: (coords: any) => api.post('/attendance/signout', coords),
    onSuccess: (res) => {
      toast.success('Clocked out successfully');
      setSummary(res.data.summary);
      refetch();
    }
  });

  const handleClockAction = (type: 'in' | 'out') => {
    if (!location) {
      getLocation();
    }
    
    const payload = location || { lat: 0, lng: 0 };
    if (type === 'in') clockInMutation.mutate(payload);
    if (type === 'out') clockOutMutation.mutate(payload);
  };

  if (!user.employeeId || user.employeeId === 'null') return null;
  if (isLoading) return <Card className="animate-pulse h-32 flex items-center justify-center">Loading Status...</Card>;

  const isSignedIn = !!todayStatus?.signInTime;
  const isSignedOut = !!todayStatus?.signOutTime;

  return (
    <>
      <Card className="border-l-4 border-industrial-blue bg-white relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-industrial-blue/10 text-industrial-blue rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-industrial-slate">Duty Status</h3>
              <p className="text-xs text-industrial-gray font-medium">
                {isSignedOut ? 'Shift Completed' : isSignedIn ? 'Currently on duty' : 'Not clocked in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isSignedIn ? (
              <Button 
                onClick={() => handleClockAction('in')}
                loading={clockInMutation.isPending}
                className="flex-1 sm:flex-none bg-industrial-blue flex items-center gap-2"
              >
                <LogIn size={18} />
                Clock In
              </Button>
            ) : !isSignedOut ? (
              <Button 
                onClick={() => handleClockAction('out')}
                loading={clockOutMutation.isPending}
                className="flex-1 sm:flex-none bg-industrial-orange flex items-center gap-2"
              >
                <LogOut size={18} />
                Clock Out
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm font-bold">
                <Clock size={16} />
                Day Finished
              </div>
            )}
          </div>
        </div>
        {geoError && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg">
            <MapPin size={12} />
            {geoError}
          </div>
        )}
      </Card>

      {/* Result Summary Modal */}
      {summary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-industrial-slate/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-industrial-blue"></div>
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-industrial-blue/10 text-industrial-blue rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <h2 className="text-xl font-black text-industrial-slate uppercase tracking-tight">Shift Summary</h2>
                </div>
                <button onClick={() => setSummary(null)} className="text-industrial-gray hover:text-industrial-slate transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-industrial-gray">Final Status</span>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        summary.status === 'overtime' ? 'bg-green-100 text-green-700' :
                        summary.status === 'late' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {summary.status}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest mb-1">Morning Lateness</p>
                        <p className={`text-xl font-black ${summary.lateSignInMinutes > 0 ? 'text-orange-600' : 'text-industrial-slate'}`}>
                            {summary.lateSignInMinutes} <span className="text-[10px] font-medium">min</span>
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest mb-1">Evening Overtime</p>
                        <p className="text-xl font-black text-industrial-slate">
                            {summary.rawOvertime} <span className="text-[10px] font-medium">min</span>
                        </p>
                    </div>
                </div>

                {summary.adjustmentApplied > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-industrial-blue shrink-0" size={18} />
                        <div>
                            <p className="text-[11px] font-bold text-industrial-blue uppercase tracking-tight">Lateness Adjustment</p>
                            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                                We've subtracted **{summary.adjustmentApplied} minutes** of morning lateness from your evening overtime.
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center px-4 py-3 bg-industrial-slate text-white rounded-xl shadow-lg">
                        <span className="text-sm font-bold">Payable Overtime</span>
                        <span className="text-lg font-black">{summary.finalOvertime} min</span>
                    </div>
                </div>

                <Button variant="outline" fullWidth onClick={() => setSummary(null)} className="mt-2">
                    Close Summary
                </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
