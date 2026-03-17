import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { Calendar, Filter, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import dayjs from 'dayjs';

export default function LeaveRequestPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await api.get('/leaves');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      api.put(`/leaves/${id}/${status === 'approved' ? 'approve' : 'reject'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => api.post('/leaves', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setIsModalOpen(false);
    }
  });

  const filteredRequests = requests?.filter((r: any) => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isAdmin ? "Staff Leave Management" : "My Leave Requests"} 
        subtitle={isAdmin ? "Review and process employee time-off applications" : "Track status of your vacation and sick leave requests"}
        actions={
          !isAdmin && (
            <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
              <Calendar size={18} />
              Submit New Request
            </Button>
          )
        }
      />

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === f 
                ? 'bg-white text-industrial-blue shadow-sm' 
                : 'text-industrial-gray hover:text-industrial-slate'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Processing leave applications...</div>
      ) : (
        <Table headers={isAdmin ? ['Employee', 'Type', 'Duration', 'Reason', 'Status', 'Actions'] : ['Type', 'Duration', 'Reason', 'Status']}>
          {filteredRequests?.map((req: any) => (
            <tr key={req._id} className="hover:bg-gray-50 transition-colors">
              {isAdmin && (
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-industrial-light flex items-center justify-center text-industrial-blue font-bold text-xs uppercase">
                      {req.employeeId?.name?.[0] || 'E'}
                    </div>
                    <span className="font-semibold text-industrial-slate">{req.employeeId?.name || 'Unknown Staff'}</span>
                  </div>
                </td>
              )}
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-industrial-slate uppercase text-xs tracking-tight">{req.leaveType}</span>
                  <span className="text-[10px] text-industrial-gray font-medium">Requested: {dayjs(req.createdAt).format('DD MMM')}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-industrial-slate">
                    {dayjs(req.startDate).format('DD MMM')} — {dayjs(req.endDate).format('DD MMM')}
                  </span>
                  <span className="text-[10px] text-industrial-gray font-bold">
                    {dayjs(req.endDate).diff(dayjs(req.startDate), 'day') + 1} Business Days
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-industrial-gray font-medium max-w-[200px] truncate">{req.reason}</p>
              </td>
              <td className="px-6 py-4">
                <Badge variant={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'danger'}>
                  {req.status}
                </Badge>
              </td>
              {isAdmin && (
                <td className="px-6 py-4">
                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => approveMutation.mutate({ id: req._id, status: 'approved' })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        title="Approve Request"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => approveMutation.mutate({ id: req._id, status: 'rejected' })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Reject Request"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-industrial-gray uppercase italic tracking-widest">Finalized</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </Table>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-industrial-slate uppercase tracking-tight">Request Time Off</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-industrial-gray hover:text-industrial-slate">
                <X size={24} />
              </button>
            </div>

            <LeaveForm 
              onClose={() => setIsModalOpen(false)} 
              onSave={(data: any) => applyMutation.mutate(data)}
              isLoading={applyMutation.isPending}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

function LeaveForm({ onClose, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    reason: ''
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Leave Type</label>
        <select 
          className="input-field"
          value={formData.leaveType}
          onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
        >
          <option value="annual">Annual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="maternity">Maternity/Paternity</option>
          <option value="unpaid">Unpaid Leave</option>
          <option value="emergency">Emergency Leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Start Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">End Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Reason for Request</label>
        <textarea 
          className="input-field min-h-[100px] py-3 text-sm" 
          placeholder="Briefly explain the reason for your time-off request..."
          value={formData.reason}
          onChange={e => setFormData({ ...formData, reason: e.target.value })}
          required
        />
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <Button variant="outline" fullWidth onClick={onClose} type="button">Discard</Button>
        <Button variant="primary" fullWidth type="submit" loading={isLoading}>
          Submit Application
        </Button>
      </div>
    </form>
  );
}