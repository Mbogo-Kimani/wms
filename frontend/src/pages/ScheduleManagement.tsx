import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { Calendar, User, Clock, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import dayjs from 'dayjs';

export default function ScheduleManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isWeekendShift, setIsWeekendShift] = useState(false);
  const [isHolidayShift, setIsHolidayShift] = useState(false);

  const fetchData = async () => {
    try {
      const [empRes, shiftRes] = await Promise.all([
        api.get('/employees'),
        api.get('/shifts')
      ]);
      setEmployees(empRes.data);
      setShifts(shiftRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !selectedShift) return;
    setLoading(true);
    try {
      // For now, updating employee record directly if no separate schedule API is ready
      // or we can implement a /schedules endpoint.
      // Given the requirement Part 8 - WorkSchedule model, I should probably use that.
      // But I haven't implemented scheduleRoutes yet. Let's do that quickly.
      await api.post('/schedules', {
        employeeId: selectedStaff,
        shiftId: selectedShift,
        date: dayjs(date).toISOString(),
        isWeekendShift,
        isHolidayShift,
        notes: 'Shift assigned via management console'
      });
      // Success toast handled by api interceptor
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">Work Scheduling</h1>
        <p className="text-industrial-gray font-medium">Assign workers to specific dates, weekend shifts, and holiday duties</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 !p-8 border-industrial-orange/20">
          <h2 className="text-xl font-bold text-industrial-slate mb-6 flex items-center gap-2">
            <Calendar className="text-industrial-orange" /> Assign Duty
          </h2>
          <form onSubmit={handleAssign} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-industrial-slate ml-1">Staff Member</label>
              <select 
                className="input-field cursor-pointer"
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-industrial-slate ml-1">Shift</label>
              <select 
                className="input-field cursor-pointer"
                value={selectedShift}
                onChange={e => setSelectedShift(e.target.value)}
              >
                <option value="">Select Shift</option>
                {shifts.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-industrial-slate ml-1">Date</label>
              <input 
                type="date" 
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isWeekendShift} onChange={e => setIsWeekendShift(e.target.checked)} />
                <span className="text-sm font-bold text-industrial-slate">Weekend Shift</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isHolidayShift} onChange={e => setIsHolidayShift(e.target.checked)} />
                <span className="text-sm font-bold text-industrial-slate">Holiday Duty</span>
              </label>
            </div>

            <Button type="submit" fullWidth loading={loading} className="h-12 mt-4">
              Confirm Assignment
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-industrial-slate">Scheduled Workforce Today</h2>
            <Badge variant="neutral">{dayjs().format('DD MMM YYYY')}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-industrial-gray text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Rest Day</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-industrial-slate text-white flex items-center justify-center text-xs font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-industrial-slate">{emp.name}</p>
                          <p className="text-[10px] text-industrial-gray font-medium uppercase tracking-tighter">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-industrial-gray">{emp.department}</td>
                    <td className="px-6 py-4">
                       <Badge variant={emp.religiousRestDay === dayjs().format('dddd') ? 'warning' : 'neutral'}>
                        {emp.religiousRestDay || 'None'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {emp.weekendWorker && <Badge variant="success">Weekend Ok</Badge>}
                        {emp.holidayWorker && <Badge variant="info">Holiday Ok</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
