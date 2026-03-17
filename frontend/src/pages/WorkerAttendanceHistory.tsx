import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Clock, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';

export default function WorkerAttendanceHistory() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendanceHistory'],
    queryFn: async () => {
      const res = await api.get('/attendance/history');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Records" 
        subtitle="Chronological log of shift signatures and verification data"
      />

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Retrieving operational logs...</div>
      ) : (
        <div className="space-y-4">
          {records?.map((record: any) => (
            <Card key={record._id} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Calendar size={12} />
                    {dayjs(record.date).format('DD MMMM YYYY')}
                  </span>
                  <p className="text-lg font-black text-industrial-slate">
                    {record.status === 'absent' ? 'Duty Not Performed' : 'Standard Shift Log'}
                  </p>
                </div>
                <Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                  {record.status}
                </Badge>
              </div>

              {record.status !== 'absent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-industrial-light p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-industrial-blue" />
                        <span className="text-[9px] font-bold text-industrial-gray uppercase">Sign In</span>
                    </div>
                    <p className="text-xl font-black text-industrial-slate">
                      {record.signInTime ? dayjs(record.signInTime).format('HH:mm') : '--:--'}
                    </p>
                    {record.signInLocation && (
                      <div className="flex items-center gap-1 text-[9px] text-industrial-gray font-bold mt-1">
                        <MapPin size={10} />
                        VERIFIED
                      </div>
                    )}
                  </div>

                  <div className="bg-industrial-light p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-industrial-orange" />
                        <span className="text-[9px] font-bold text-industrial-gray uppercase">Sign Out</span>
                    </div>
                    <p className="text-xl font-black text-industrial-slate">
                      {record.signOutTime ? dayjs(record.signOutTime).format('HH:mm') : '--:--'}
                    </p>
                    {record.signOutLocation && (
                      <div className="flex items-center gap-1 text-[9px] text-industrial-gray font-bold mt-1">
                        <MapPin size={10} />
                        VERIFIED
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {record.overtimeMinutes > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-industrial-orange bg-orange-50 p-2 rounded-lg">
                  <CheckCircle2 size={14} />
                  OVERTIME LOGGED: {record.overtimeMinutes} MINUTES
                </div>
              )}
            </Card>
          ))}
          
          {(!records || records.length === 0) && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-industrial-gray font-bold italic">No log entries found for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}