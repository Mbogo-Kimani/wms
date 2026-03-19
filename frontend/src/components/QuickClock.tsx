import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from './Card';
import Button from './Button';
import { LogIn, LogOut, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickClock() {
  const { location, error: geoError, getLocation } = useGeolocation();
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
    onSuccess: () => {
      toast.success('Clocked out successfully');
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
    <Card className="border-l-4 border-industrial-blue bg-white">
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
  );
}
