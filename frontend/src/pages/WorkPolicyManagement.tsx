import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { Settings, ShieldCheck, Trash2, Plus, Edit, X } from 'lucide-react';

export default function WorkPolicyManagement() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/policies');
      setPolicies(res.data);
    } catch (err) {
      setError('Failed to fetch policies');
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSave = async (data: any) => {
    setLoading(true);
    try {
      if (editingPolicy) {
        await api.put(`/policies/${editingPolicy._id}`, data);
      } else {
        await api.post('/policies', data);
      }
      setIsModalOpen(false);
      setEditingPolicy(null);
      fetchPolicies();
    } catch (err) {
      setError('Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/policies/${id}`);
      fetchPolicies();
    } catch (err) {
      setError('Failed to delete policy');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">Work Policies</h1>
          <p className="text-industrial-gray font-medium">Configure strict login windows and attendance rules</p>
        </div>
        <Button onClick={() => { setEditingPolicy(null); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus size={18} /> New Policy
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map(policy => (
          <Card key={policy._id} className="hover:border-industrial-blue transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-industrial-slate text-white rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-industrial-slate">{policy.name}</h3>
                  {policy.isDefault && <Badge variant="success">Global Default</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingPolicy(policy); setIsModalOpen(true); }} 
                  className="text-gray-400 hover:text-industrial-blue transition-colors"
                >
                  <Edit size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(policy._id)} 
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-industrial-gray font-medium">Regular Days</span>
                <span className="font-bold text-industrial-slate">{policy.regularLoginStart} – {policy.regularLoginEnd}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-industrial-gray font-medium">Holidays</span>
                <span className="font-bold text-industrial-slate">{policy.holidayLoginStart} – {policy.holidayLoginEnd}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-industrial-gray font-medium">Weekends</span>
                <span className="font-bold text-industrial-slate">{policy.weekendLoginStart} – {policy.weekendLoginEnd}</span>
              </div>
              <div className="flex gap-4 pt-2">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-industrial-gray">
                  Grace: {policy.gracePeriodMinutes}m
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-industrial-gray">
                  Late: {policy.lateAfterMinutes}m
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <PolicyModal 
          onClose={() => { setIsModalOpen(false); setEditingPolicy(null); }}
          onSave={handleSave}
          initialData={editingPolicy}
          isLoading={loading}
        />
      )}
    </div>
  );
}

function PolicyModal({ onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    regularLoginStart: '06:00',
    regularLoginEnd: '09:30',
    holidayLoginStart: '07:00',
    holidayLoginEnd: '10:00',
    weekendLoginStart: '07:00',
    weekendLoginEnd: '09:30',
    gracePeriodMinutes: 15,
    lateAfterMinutes: 30,
    isDefault: false
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate uppercase tracking-tight">
            {initialData ? 'Edit Policy' : 'Create New Policy'}
          </h2>
          <button onClick={onClose} className="text-industrial-gray hover:text-industrial-slate">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Policy Name" 
                placeholder="e.g. Standard Shift Rules" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Regular Days Login Window</p>
              <div className="grid grid-cols-2 gap-4">
                <Input type="time" label="Start" value={formData.regularLoginStart} onChange={e => setFormData({...formData, regularLoginStart: e.target.value})} />
                <Input type="time" label="End" value={formData.regularLoginEnd} onChange={e => setFormData({...formData, regularLoginEnd: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Holidays Login Window</p>
              <div className="grid grid-cols-2 gap-4">
                <Input type="time" label="Start" value={formData.holidayLoginStart} onChange={e => setFormData({...formData, holidayLoginStart: e.target.value})} />
                <Input type="time" label="End" value={formData.holidayLoginEnd} onChange={e => setFormData({...formData, holidayLoginEnd: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Weekends Login Window</p>
              <div className="grid grid-cols-2 gap-4">
                <Input type="time" label="Start" value={formData.weekendLoginStart} onChange={e => setFormData({...formData, weekendLoginStart: e.target.value})} />
                <Input type="time" label="End" value={formData.weekendLoginEnd} onChange={e => setFormData({...formData, weekendLoginEnd: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="number" 
                label="Grace (Min)" 
                value={formData.gracePeriodMinutes} 
                onChange={e => setFormData({...formData, gracePeriodMinutes: parseInt(e.target.value)})} 
              />
              <Input 
                type="number" 
                label="Late After (Min)" 
                value={formData.lateAfterMinutes} 
                onChange={e => setFormData({...formData, lateAfterMinutes: parseInt(e.target.value)})} 
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isDefault"
                checked={formData.isDefault}
                onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                className="w-4 h-4 rounded text-industrial-blue focus:ring-industrial-blue"
              />
              <label htmlFor="isDefault" className="text-sm font-bold text-industrial-slate cursor-pointer">Set as Global Default Policy</label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button variant="outline" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={isLoading}>
              {initialData ? 'Update Policy' : 'Create Policy'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
