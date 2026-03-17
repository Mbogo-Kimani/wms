import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Alert from '../components/Alert';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'worker') navigate('/worker');
      else navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light">
      <Card className="w-full max-w-[400px] !p-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-industrial-blue text-white rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">System Login</h1>
          <p className="text-industrial-gray text-sm mt-2 font-medium">Workforce Management Access</p>
        </div>
        
        {error && <Alert type="error" message={error} className="mb-6" />}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Corporate Email"
            type="email" 
            placeholder="name@company.com"
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input 
            label="Security Password"
            type="password" 
            placeholder="••••••••"
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <div className="flex justify-end pr-1">
            <Link to="/forgot-password" className="text-[10px] font-bold text-industrial-gray hover:text-industrial-blue uppercase tracking-widest transition-colors">
              Recover Access Credentials
            </Link>
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            className="h-14 text-lg"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm font-medium text-industrial-gray">
            New employee? <Link to="/register" className="text-industrial-orange hover:underline font-bold">Register Account</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}