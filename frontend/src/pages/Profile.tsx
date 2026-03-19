import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { User, Mail, Shield, Smartphone, LogOut, Briefcase, History } from 'lucide-react';
import toast from 'react-hot-toast';
import ActivityTimeline from '../components/ActivityTimeline';

export default function Profile() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const profile = profileData?.user;
  const employee = profileData?.employee;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(employee?.phone || '');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = uploadRes.data.url;
      
      await api.put('/auth/update-profile', { profilePhoto: photoUrl });
      toast.success('Profile photo updated!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    setUpdatingPhone(true);
    try {
      await api.put('/auth/update-profile', { phone: tempPhone });
      setEditingPhone(false);
      window.location.reload(); 
    } catch (err) {} finally {
      setUpdatingPhone(false);
    }
  };

  const handleVerifyRequest = async () => {
    setVerifying(true);
    try {
      await api.post('/auth/request-verification');
      toast.success('Verification email sent! Please check your inbox.');
    } catch (err) {} finally {
      setVerifying(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-industrial-gray font-medium">Loading profile...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-industrial-slate rounded-3xl overflow-hidden relative border-b-4 border-industrial-blue">
        <div className="h-24 bg-gradient-to-r from-industrial-blue to-industrial-slate" />
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6 group">
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border-4 border-white flex items-center justify-center overflow-hidden relative">
                {uploading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">...</div>
                ) : employee?.profilePhoto ? (
                  <img src={employee.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-industrial-blue">{profile?.name?.[0]}</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <User size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </label>
          </div>
          <div className="pt-16">
            <h1 className="text-2xl font-black text-white">{profile?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info">{profile?.role}</Badge>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l border-gray-700 pl-2">
                Operational Status: {profile?.accountStatus || 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="!p-0 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Employment Identification</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-industrial-gray uppercase">Corporate Email</p>
                  {profile?.isEmailVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <button 
                      onClick={handleVerifyRequest}
                      disabled={verifying}
                      className="text-[8px] font-bold text-industrial-blue uppercase hover:underline"
                    >
                      {verifying ? 'Sending...' : 'Verify Now'}
                    </button>
                  )}
                </div>
                <p className="text-sm font-bold text-industrial-slate">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue">
                <Smartphone size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-industrial-gray uppercase">Mobile Liaison</p>
                  <button 
                    onClick={() => {
                        setEditingPhone(!editingPhone);
                        setTempPhone(employee?.phone || '');
                    }}
                    className="text-[8px] font-bold text-industrial-blue uppercase hover:underline"
                  >
                    {editingPhone ? 'Cancel' : 'Update'}
                  </button>
                </div>
                {editingPhone ? (
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      className="flex-1 px-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-industrial-blue"
                      value={tempPhone}
                      onChange={e => setTempPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                    <Button 
                      className="!h-8 !py-0 !px-4 !text-[10px]"
                      onClick={handlePhoneUpdate}
                      loading={updatingPhone}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-industrial-slate">{employee?.phone || 'Not Registered'}</p>
                )}
              </div>
            </div>

            {employee && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-gray uppercase">Departmental Assignment</p>
                  <p className="text-sm font-bold text-industrial-slate">{employee?.department || 'Not Assigned'}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-industrial-gray uppercase">Access Clearance</p>
                <p className="text-sm font-bold text-industrial-slate">
                  {profile?.role === 'admin' ? 'Administrator (Full System Control)' : 
                   profile?.role === 'manager' ? 'Operations Manager' : 
                   profile?.role === 'supervisor' ? 'Floor Supervisor' : 
                   'Personnel Access'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {employee && (
          <Card className="!p-0 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <History size={16} className="text-industrial-blue" />
              <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Recent Activity Timeline</p>
            </div>
            <div className="p-6">
              <ActivityTimeline employeeId={employee?.employeeId} />
            </div>
          </Card>
        )}

        <Card className="!p-0 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-bold text-industrial-gray uppercase tracking-widest">Account Security</p>
          </div>
          <div className="p-6 space-y-4">
            <PasswordResetForm role={profile?.role} />
            <div className="pt-4 border-t border-gray-100">
              <Button variant="outline" fullWidth className="!border-red-600 !text-red-600 hover:!bg-red-600 hover:!text-white flex items-center justify-center gap-2" onClick={handleLogout}>
                <LogOut size={18} />
                Terminate Session
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-[10px] font-bold text-industrial-gray uppercase tracking-widest pb-8">
          System v2.4.0-Production
        </p>
      </div>
    </div>
  );
}

function PasswordResetForm({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/update-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <div className="flex items-center gap-2 text-amber-800 mb-2">
          <Shield size={16} />
          <p className="text-xs font-bold uppercase tracking-wider">Administrative Security</p>
        </div>
        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
          Management of administrative credentials is restricted to the primary security console. 
          Password updates for this role must be performed via the "Forgot Password" flow or by the System Owner.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-industrial-gray uppercase">Current Password</label>
        <input 
          type="password" 
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-industrial-blue/20 text-sm" 
          placeholder="••••••••"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-industrial-gray uppercase">New Password</label>
        <input 
          type="password" 
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-industrial-blue/20 text-sm" 
          placeholder="••••••••"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-industrial-gray uppercase">Confirm New Password</label>
        <input 
          type="password" 
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-industrial-blue/20 text-sm" 
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Update Password
      </Button>
    </form>
  );
}
