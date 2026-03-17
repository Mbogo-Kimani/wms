import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from './Card';
import Badge from './Badge';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function ActivityTimeline({ employeeId }: { employeeId: string }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['employee-activity', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/activity`);
      return res.data;
    },
    enabled: !!employeeId && employeeId !== 'undefined'
  });

  if (isLoading) return <div className="text-center py-4 text-industrial-gray text-sm">Loading activity logs...</div>;

  return (
    <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
      {timeline?.map((item: any, i: number) => (
        <div key={i} className="relative pl-10">
          <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10">
            {item.type === 'attendance' ? <Clock size={14} className="text-industrial-blue" /> : <Calendar size={14} className="text-industrial-orange" />}
          </div>
          <Card className="!p-4 bg-white/50 hover:bg-white transition-colors cursor-default">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-industrial-slate text-sm">
                  {item.type === 'attendance' ? `Clocked ${item.status}` : `${item.leaveType} Leave ${item.status}`}
                </p>
                <p className="text-[10px] font-bold text-industrial-gray uppercase mt-1 tracking-tight">
                  {dayjs(item.date).format('DD MMMM YYYY')} {item.time ? `@ ${dayjs(item.time).format('HH:mm')}` : ''}
                </p>
              </div>
              <Badge variant={item.status === 'present' || item.status === 'approved' ? 'success' : item.status === 'late' ? 'warning' : 'danger'}>
                {item.status}
              </Badge>
            </div>
          </Card>
        </div>
      ))}
      {!timeline?.length && (
        <div className="pl-10 text-sm text-industrial-gray font-medium italic">No recent activity detected</div>
      )}
    </div>
  );
}
