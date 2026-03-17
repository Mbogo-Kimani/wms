import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { UserCheck, UserX, Info, Shield, Clock, Briefcase, MapPin } from 'lucide-react';
import dayjs from 'dayjs';

export default function PendingRegistrations() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [verificationData, setVerificationData] = useState({
    role: 'worker',
    department: '',
    position: '',
    shiftId: '',
    annualLeave: 20,
    sickLeave: 10,
    phoneNumber: '',
  });

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pendingRegistrations'],
    queryFn: async () => {
      const res = await api.get('/onboarding/pending');
      return res.data;
    }
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const res = await api.get('/shifts');
      return res.data;
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/onboarding/verify', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      setSelectedUser(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await api.delete(`/onboarding/reject/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
    }
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    verifyMutation.mutate({
      userId: selectedUser._id,
      ...verificationData
    });
  };

  if (isLoading) return <div className="p-8 text-center text-industrial-gray">Loading pending registrations...</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Pending Registrations" 
        subtitle="Review and verify new worker accounts before system access"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          {!pendingUsers?.length && (
            <Card className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <UserCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-industrial-slate">All caught up!</h3>
              <p className="text-industrial-gray font-medium">No pending worker registrations at the moment.</p>
            </Card>
          )}

          {pendingUsers?.map((user: any) => (
            <Card key={user._id} className="hover:border-industrial-blue transition-colors group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-industrial-light rounded-xl flex items-center justify-center text-industrial-blue font-black text-xl border border-gray-100">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-industrial-slate text-lg">{user.name}</h3>
                    <p className="text-industrial-gray text-sm font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-industrial-gray uppercase tracking-widest mb-1">Religion</span>
                    <span className="text-sm font-bold text-industrial-slate">{user.religion || 'Not specified'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-industrial-gray uppercase tracking-widest mb-1">Rest Day</span>
                    <Badge variant="warning">{user.religiousRestDay}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 py-2 px-4"
                    onClick={() => rejectMutation.mutate(user._id)}
                  >
                    <UserX size={16} className="mr-2" /> Reject
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 md:flex-none py-2 px-4"
                    onClick={() => {
                      setSelectedUser(user);
                      setVerificationData(prev => ({ ...prev, department: '', position: '' }));
                    }}
                  >
                    <UserCheck size={16} className="mr-2" /> Verify
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="xl:col-span-1">
          {selectedUser ? (
            <Card className="sticky top-8 border-industrial-blue shadow-lg shadow-blue-900/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-industrial-slate">Worker Verification</h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-industrial-slate">
                  <Info size={20} />
                </button>
              </div>

              <div className="bg-industrial-light p-4 rounded-xl mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-industrial-blue text-white rounded-lg flex items-center justify-center font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-industrial-slate leading-none">{selectedUser.name}</p>
                  <p className="text-[11px] text-industrial-gray font-bold mt-1 uppercase tracking-tight">{selectedUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-industrial-gray uppercase tracking-wider ml-1">Access Level (Role)</label>
                  <select 
                    className="input-field cursor-pointer border-gray-200" 
                    required
                    value={verificationData.role}
                    onChange={(e) => setVerificationData({...verificationData, role: e.target.value})}
                  >
                    <option value="worker">Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Department" 
                    placeholder="e.g. Operations" 
                    required 
                    value={verificationData.department}
                    onChange={(e) => setVerificationData({...verificationData, department: e.target.value})}
                  />
                  <Input 
                    label="Position" 
                    placeholder="e.g. Technician" 
                    required 
                    value={verificationData.position}
                    onChange={(e) => setVerificationData({...verificationData, position: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-industrial-gray uppercase tracking-wider ml-1">Assigned Shift</label>
                  <select 
                    className="input-field cursor-pointer border-gray-200" 
                    required
                    value={verificationData.shiftId}
                    onChange={(e) => setVerificationData({...verificationData, shiftId: e.target.value})}
                  >
                    <option value="">Select a shift...</option>
                    {shifts?.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Annual Leave" 
                    type="number" 
                    required 
                    value={verificationData.annualLeave}
                    onChange={(e) => setVerificationData({...verificationData, annualLeave: parseInt(e.target.value)})}
                  />
                  <Input 
                    label="Sick Leave" 
                    type="number" 
                    required 
                    value={verificationData.sickLeave}
                    onChange={(e) => setVerificationData({...verificationData, sickLeave: parseInt(e.target.value)})}
                  />
                </div>

                <Button 
                  type="submit" 
                  fullWidth 
                  variant="primary" 
                  className="h-12 mt-6"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? 'Processing...' : 'Complete Onboarding'}
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-gray-200 h-full">
              <Shield size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium text-sm">Select a worker from the list to begin verification</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
