import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Bell, Megaphone, Plus, Calendar, User, Edit, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';

export default function Memos() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<any>(null);

  const { data: memos, isLoading } = useQuery({
    queryKey: ['memos'],
    queryFn: async () => {
      const res = await api.get('/memos');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/memos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
    }
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => editingMemo 
      ? api.patch(`/memos/${editingMemo._id}`, data)
      : api.post('/memos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      setIsModalOpen(false);
      setEditingMemo(null);
    }
  });

  const handleEdit = (memo: any) => {
    setEditingMemo(memo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Company Communications" 
        subtitle="Official circulars, safety memos, and operational updates"
        actions={
          isAdmin && (
            <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
              <Megaphone size={18} />
              Broadcast Memo
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Downloading circulars...</div>
      ) : (
        <div className="space-y-4">
          {memos?.map((memo: any) => (
            <Card key={memo._id} className="border-l-4 border-l-industrial-orange hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={memo.priority === 'urgent' ? 'danger' : memo.priority === 'high' ? 'warning' : 'info'}>
                    {memo.priority || 'Normal'} Priority
                  </Badge>
                  <span className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} />
                    {dayjs(memo.createdAt).format('DD MMM YYYY')}
                  </span>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(memo)}
                      className="p-1.5 text-industrial-gray hover:text-industrial-blue bg-industrial-light rounded-md"
                      title="Edit Memo"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(memo._id)}
                      className="p-1.5 text-industrial-gray hover:text-red-600 bg-industrial-light rounded-md"
                      title="Delete Memo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-extrabold text-industrial-slate mb-2">{memo.title}</h3>
              <p className="text-industrial-gray leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                {memo.message}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-industrial-gray font-bold uppercase">
                  <User size={14} className="text-industrial-blue" />
                  Issued By: <span className="text-industrial-blue">{memo.createdBy?.name || 'Authorized Personnel'}</span>
                </div>
                {!isAdmin && (
                  <button className="text-xs font-bold text-industrial-blue hover:underline">
                    Acknowledge Receipt
                  </button>
                )}
              </div>
            </Card>
          ))}
          
          {(!memos || memos.length === 0) && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-industrial-gray font-bold">No active circulars to display</p>
            </div>
          )}
        </div>
      )}
      {isModalOpen && (
        <MemoModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingMemo(null); }}
          onSave={(data: any) => upsertMutation.mutate(data)}
          initialData={editingMemo}
          isLoading={upsertMutation.isPending}
        />
      )}
    </div>
  );
}

function MemoModal({ onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    message: '',
    department: 'all',
    priority: 'normal'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate uppercase">
            {initialData ? 'Update Operational Memo' : 'Issue Operational Memo'}
          </h2>
          <button onClick={onClose} className="text-industrial-gray hover:text-industrial-slate">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-industrial-gray uppercase">Memo Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Safety Protocol Update" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Department</label>
              <select 
                className="input-field"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="all">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Security">Security</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Priority</label>
              <select 
                className="input-field"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-industrial-gray uppercase">Memo Content</label>
            <textarea 
              className="input-field min-h-[150px] py-3" 
              placeholder="Detail the operational changes or announcements here..."
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={isLoading}>
              {initialData ? 'Apply Updates' : 'Broadcast Now'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
