import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light font-sans">
      <Card className="w-full max-w-[450px] !p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-industrial-blue text-white rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">Forgot Password?</h1>
          <p className="text-industrial-gray text-sm mt-2 font-medium">Enter your email for reset instructions</p>
        </div>

        {success ? (
          <div className="text-center">
            <Alert type="success" message="Check your email for the reset link." className="mb-6" />
            <Link to="/login" className="flex items-center justify-center gap-2 text-industrial-blue font-bold hover:underline">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error" message={error} />}
            <Input 
              label="Corporate Email"
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" fullWidth className="h-14 text-lg" loading={loading}>
              Send Reset Link
            </Button>
            <div className="text-center mt-6">
              <Link to="/login" className="flex items-center justify-center gap-2 text-industrial-blue font-bold hover:underline">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
