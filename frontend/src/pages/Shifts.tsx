import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Clock, Plus, Edit, Trash2, MapPin, Calendar } from 'lucide-react';

export default function Shifts() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['admin', 'manager'].includes(user.role);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const res = await api.get('/shifts');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] })
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => editingShift 
      ? api.patch(`/shifts/${editingShift._id}`, data)
      : api.post('/shifts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setIsModalOpen(false);
      setEditingShift(null);
    }
  });

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Shift Schedules" 
        subtitle="Configure operational hours and geofencing parameters"
        actions={isAdmin && (
          <Button variant="primary" className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Create New Shift
          </Button>
        )}
      />

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Retrieving shift configurations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts?.map((shift: any) => (
            <Card key={shift._id} className="relative overflow-hidden group border-t-4 border-t-industrial-blue">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-industrial-slate">{shift.name}</h3>
                  <div className="flex items-center gap-2 text-industrial-gray text-xs font-bold uppercase mt-1">
                    <Calendar size={12} />
                    {shift.days?.join(', ') || 'All Week'}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(shift)}
                      className="p-1.5 text-industrial-gray hover:text-industrial-blue bg-industrial-light rounded-md"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => { if(confirm('Delete shift?')) deleteMutation.mutate(shift._id) }}
                      className="p-1.5 text-industrial-gray hover:text-red-600 bg-industrial-light rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-industrial-blue bg-white p-2 rounded-md shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-industrial-gray uppercase">Schedule</p>
                    <p className="text-lg font-extrabold text-industrial-slate">{shift.startTime} — {shift.endTime}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-industrial-light rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-industrial-gray uppercase mb-1">Grace Period</p>
                    <p className="text-sm font-bold text-industrial-slate">{shift.gracePeriodMinutes} mins</p>
                  </div>
                  <div className="p-2.5 bg-industrial-light rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-industrial-gray uppercase mb-1">Late After</p>
                    <p className="text-sm font-bold text-industrial-slate">{shift.lateAfterMinutes} mins</p>
                  </div>
                </div>

                {shift.location && (
                  <div className="flex items-center gap-2 text-xs text-industrial-gray font-medium pt-2 border-t border-gray-100">
                    <MapPin size={14} className="text-industrial-orange" />
                    <span>Geofenced: {shift.location.radius}m Radius</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 text-industrial-gray hover:border-industrial-blue hover:text-industrial-blue hover:bg-industrial-blue/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-3 group-hover:border-industrial-blue">
                <Plus size={24} />
              </div>
              <span className="font-bold">Add Another Shift</span>
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <ShiftModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingShift(null); }}
          onSave={(data: any) => upsertMutation.mutate(data)}
          initialData={editingShift}
          isLoading={upsertMutation.isPending}
        />
      )}
    </div>
  );
}

function ShiftModal({ onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    startTime: initialData?.startTime || '08:00',
    endTime: initialData?.endTime || '17:00',
    gracePeriodMinutes: initialData?.gracePeriodMinutes ?? 15,
    lateAfterMinutes: initialData?.lateAfterMinutes ?? 60,
    overtimeAfterMinutes: initialData?.overtimeAfterMinutes ?? 0,
    location: {
      lat: initialData?.location?.lat ?? 0,
      lng: initialData?.location?.lng ?? 0,
      radius: initialData?.location?.radius ?? 100
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate">
            {initialData ? 'Update Shift Parameters' : 'Define New Operational Shift'}
          </h2>
          <button onClick={onClose} className="text-industrial-gray hover:text-industrial-slate">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-industrial-gray uppercase">Shift Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Morning Ops" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Start Time</label>
              <input 
                type="time" 
                className="input-field" 
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">End Time</label>
              <input 
                type="time" 
                className="input-field" 
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Grace Period (Min)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.gracePeriodMinutes ?? ''}
                onChange={e => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Late After (Min)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.lateAfterMinutes ?? ''}
                onChange={e => setFormData({ ...formData, lateAfterMinutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

            <div className="pt-4 border-t border-gray-100">
             <p className="text-[10px] font-bold text-industrial-gray uppercase mb-3">Geofencing Configuration</p>
             <div className="grid grid-cols-3 gap-3">
               <input type="number" step="any" placeholder="Lat" className="input-field text-xs" value={formData.location.lat ?? ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, lat: parseFloat(e.target.value) || 0 }})} />
               <input type="number" step="any" placeholder="Lng" className="input-field text-xs" value={formData.location.lng ?? ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, lng: parseFloat(e.target.value) || 0 }})} />
               <input type="number" placeholder="Radius (m)" className="input-field text-xs" value={formData.location.radius ?? ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, radius: parseInt(e.target.value) || 0 }})} />
             </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={isLoading}>
              {initialData ? 'Apply Updates' : 'Initialize Shift'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

import { X } from 'lucide-react';
import { useState } from 'react';
