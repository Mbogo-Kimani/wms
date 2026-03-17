import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Input from '../components/Input';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import dayjs from 'dayjs';

export default function HolidayManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await api.get('/holidays');
      return res.data;
    }
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Holiday & Calendar Management" 
        subtitle="Manage national, religious and company specific non-working days"
        actions={
          <Button onClick={() => { setEditingHoliday(null); setIsModalOpen(true); }} className="flex items-center gap-2">
            <Plus size={18} />
            Add Holiday
          </Button>
        }
      />

      {isLoading ? (
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
