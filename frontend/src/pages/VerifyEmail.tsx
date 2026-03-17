import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }
      try {
        await api.get(`/auth/confirm-email?token=${token}`);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light font-sans">
      <Card className="w-full max-w-[450px] !p-10 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 size={48} className="mx-auto text-industrial-blue animate-spin" />
            <h1 className="text-2xl font-black text-industrial-slate">Verifying Identity...</h1>
            <p className="text-industrial-gray font-medium">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full">
              <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-black text-industrial-slate">Email Verified!</h1>
            <p className="text-industrial-gray font-medium">Your email has been successfully confirmed. You can now access your account normally.</p>
            <Link to="/login" className="btn btn-primary w-full inline-block py-4">Sign In to Dashboard</Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 text-red-600 rounded-full">
              <XCircle size={40} />
            </div>
            <h1 className="text-3xl font-black text-industrial-slate">Verification Failed</h1>
            <p className="text-industrial-gray font-medium">{message}</p>
            <Link to="/login" className="btn btn-primary w-full inline-block py-4 bg-industrial-slate">Return to Login</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
