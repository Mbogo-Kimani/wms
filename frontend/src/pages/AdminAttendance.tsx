import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import { Search, MapPin, Clock, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

export default function AdminAttendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['adminAttendance', selectedDate],
    queryFn: async () => {
      const res = await api.get('/attendance/all-history'); 
      return res.data as any;
    }
  });

  const filtered = attendance?.filter((record: any) => 
    record.employeeId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeId?.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendance Monitoring" 
        subtitle="Live verification of workforce presence and shift compliance"
      />

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search by name or employee ID..."
            className="input-field pl-11 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
           <Calendar size={18} className="ml-2 text-industrial-gray" />
           <input 
             type="date" 
             className="border-none focus:ring-0 text-sm font-bold text-industrial-slate"
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
           />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Synchronizing with timeclock servers...</div>
      ) : (
        <Table headers={['Worker', 'Shift', 'Sign In', 'Sign Out', 'Status', 'Verification']}>
          {filtered?.map((record: any) => (
            <tr key={record._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-industrial-slate">{record.employeeId?.name || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-industrial-blue">{record.employeeId?.employeeId || 'N/A'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-industrial-gray font-medium">
                {record.shiftId?.name || 'Standard'}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-industrial-slate">
                {record.signInTime ? dayjs(record.signInTime).format('HH:mm') : '--:--'}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-industrial-slate">
                {record.signOutTime ? dayjs(record.signOutTime).format('HH:mm') : '--:--'}
              </td>
              <td className="px-6 py-4">
                <Badge variant={record.status === 'present' || record.status === 'overtime' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                  {record.status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                 <div className="flex gap-2">
                    {record.signInLocation && (
                      <div className="p-1 bg-green-100 text-green-700 rounded shadow-sm" title="GPS Verified Sign-In">
                        <MapPin size={14} />
                      </div>
                    )}
                    {record.signInMethod === 'wifi' && (
                      <div className="p-1 bg-blue-100 text-blue-700 rounded shadow-sm" title="WiFi Verified">
                        <Clock size={14} />
                      </div>
                    )}
                 </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {(!filtered || filtered.length === 0) && !isLoading && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-industrial-gray font-medium">No activity log found for this selection</p>
        </div>
      )}
    </div>
  );
}
