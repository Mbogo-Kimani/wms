import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <div className="p-8 text-center text-red-600 font-bold">Invalid or missing token.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light font-sans">
      <Card className="w-full max-w-[450px] !p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-industrial-blue text-white rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">Reset Password</h1>
          <p className="text-industrial-gray text-sm mt-2 font-medium">Create a strong new security password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <Alert type="success" message="Password successfully reset! Redirecting to login..." />
            <Link to="/login" className="text-industrial-blue font-bold hover:underline block pt-4">Proceed to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error" message={error} />}
            <Input 
              label="New Security Password"
              type="password"
              placeholder="••••••••"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <Input 
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" fullWidth className="h-14 text-lg" loading={loading}>
              Update Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
