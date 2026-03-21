import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Input from '../components/Input';
import { Plus, Trash2, Edit, X, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

export default function HolidayManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'calendar' | 'requests'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [selectedShifts, setSelectedShifts] = useState<Record<string, string>>({});

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const res = await api.get('/shifts');
      return res.data;
    }
  });

  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await api.get('/holidays');
      return res.data;
    }
  });

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['holidayWorkRequests'],
    queryFn: async () => {
      const res = await api.get('/holiday-work-requests');
      return res.data;
    },
    enabled: activeTab === 'requests'
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => editingHoliday
      ? api.put(`/holidays/${editingHoliday._id}`, data)
      : api.post('/holidays', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsModalOpen(false);
      setEditingHoliday(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/holidays/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, shiftId }: { id: string; status: string; shiftId?: string }) => 
      api.put(`/holiday-work-requests/${id}/resolve`, { status, shiftId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidayWorkRequests'] });
      toast.success('Request updated');
    }
  });

  const unscheduleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/holiday-work-requests/${id}/unschedule`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidayWorkRequests'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Shift unscheduled');
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Holiday & Calendar Management" 
        subtitle="Manage national, religious and company specific non-working days"
        actions={
          activeTab === 'calendar' && (
            <Button onClick={() => { setEditingHoliday(null); setIsModalOpen(true); }} className="flex items-center gap-2">
              <Plus size={18} />
              Add Holiday
            </Button>
          )
        }
      />

      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === 'calendar' ? 'border-industrial-orange text-industrial-slate' : 'border-transparent text-industrial-gray hover:text-industrial-slate'}`}
        >
          Calendar Overview
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${activeTab === 'requests' ? 'border-industrial-orange text-industrial-slate' : 'border-transparent text-industrial-gray hover:text-industrial-slate'}`}
        >
          Work Requests 
          {requests?.filter((r: any) => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-industrial-orange text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.filter((r: any) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'calendar' ? (
        isHolidaysLoading ? (
          <div className="py-20 text-center text-industrial-gray font-medium">Fetching calendar data...</div>
        ) : (
          <Table headers={['Holiday Name', 'Date', 'Type', 'Description', 'Actions']}>
            {holidays?.map((h: any) => (
              <tr key={h._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-industrial-slate">{h.name}</td>
                <td className="px-6 py-4 font-medium text-industrial-gray">{dayjs(h.date).format('DD MMM YYYY')}</td>
                <td className="px-6 py-4">
                  <Badge variant={h.type === 'company' ? 'warning' : h.type === 'religious' ? 'neutral' : 'success'}>
                    {h.type}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-industrial-gray italic">{h.description || 'No description'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingHoliday(h); setIsModalOpen(true); }} className="p-2 text-industrial-gray hover:text-industrial-blue hover:bg-industrial-blue/5 rounded-lg transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(h._id) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )
      ) : (
        isRequestsLoading ? (
          <div className="py-20 text-center text-industrial-gray font-medium">Fetching requests...</div>
        ) : (
          <Table headers={['Employee', 'Holiday', 'Request Date', 'Reason', 'Status', 'Actions']}>
            {requests?.map((r: any) => (
              <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-industrial-slate">{r.employeeId?.name || 'Unknown'}</td>
                <td className="px-6 py-4 font-medium text-industrial-gray">
                  {r.holidayId?.name}
                  <p className="text-[10px] text-industrial-blue uppercase font-bold mt-1">
                    {dayjs(r.holidayId?.date).format('DD MMM YYYY')}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-industrial-gray">{dayjs(r.createdAt).format('DD MMM YYYY')}</td>
                <td className="px-6 py-4 text-xs text-industrial-gray italic max-w-xs truncate">{r.reason}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                      {r.status.toUpperCase()}
                    </Badge>
                    {r.status === 'approved' && (
                      <button 
                        onClick={() => { if(confirm('Unschedule this worker?')) unscheduleMutation.mutate(r._id) }}
                        disabled={unscheduleMutation.isPending}
                        className="mt-1 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 hover:border-red-200 hover:shadow-sm transition-all flex items-center gap-1 w-fit"
                      >
                        <Trash2 size={10} />
                        Unschedule
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <select 
                        className="text-[10px] font-bold p-1 border rounded bg-gray-50 focus:ring-1 focus:ring-industrial-blue outline-none"
                        value={selectedShifts[r._id] || r.employeeId?.shiftId?._id || ''}
                        onChange={(e) => setSelectedShifts({ ...selectedShifts, [r._id]: e.target.value })}
                      >
                        <option value="">Default Shift</option>
                        {shifts?.map((s: any) => (
                          <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime})</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => resolveMutation.mutate({ 
                            id: r._id, 
                            status: 'approved', 
                            shiftId: selectedShifts[r._id] || r.employeeId?.shiftId?._id 
                          })}
                          disabled={resolveMutation.isPending}
                          className="flex-1 p-1 px-3 text-[10px] font-black uppercase bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => resolveMutation.mutate({ id: r._id, status: 'rejected' })}
                          disabled={resolveMutation.isPending}
                          className="p-1 px-3 text-[10px] font-black uppercase bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center italic text-industrial-gray">No work requests found</td>
              </tr>
            )}
          </Table>
        )
      )}

      {isModalOpen && (
        <HolidayModal 
          onClose={() => { setIsModalOpen(false); setEditingHoliday(null); }}
          onSave={(data: any) => upsertMutation.mutate(data)}
          initialData={editingHoliday}
          isLoading={upsertMutation.isPending}
        />
      )}
    </div>
  );
}

function HolidayModal({ onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    date: dayjs().format('YYYY-MM-DD'),
    type: 'national',
    description: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate uppercase tracking-tight">
            {initialData ? 'Edit Holiday' : 'Add New Holiday'}
          </h2>
          <button onClick={onClose} className="text-industrial-gray hover:text-industrial-slate">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <Input 
            label="Holiday Name" 
            placeholder="e.g. Independence Day"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input 
            label="Date" 
            type="date"
            value={formData.date ? dayjs(formData.date).format('YYYY-MM-DD') : ''}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-industrial-gray uppercase">Holiday Type</label>
            <select 
              className="input-field"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="national">National Holiday</option>
              <option value="religious">Religious Observance</option>
              <option value="company">Company Specific</option>
            </select>
          </div>
          <Input 
            label="Description (Optional)" 
            placeholder="Additional context..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-4 pt-4">
            <Button variant="outline" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={isLoading}>
              {initialData ? 'Update Holiday' : 'Save Holiday'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
