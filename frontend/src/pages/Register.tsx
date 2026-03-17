import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Alert from '../components/Alert';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    religion: '',
    religiousRestDay: 'None'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light font-sans">
        <Card className="w-full max-w-[450px] !p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6">
            <UserPlus size={40} />
          </div>
          <h1 className="text-3xl font-black text-industrial-slate mb-4">Registration Received</h1>
          <div className="bg-green-50 border border-green-100 p-6 rounded-2xl mb-8">
            <p className="text-green-800 font-bold text-lg leading-relaxed">
              Your account is awaiting administrator approval. 
            </p>
            <p className="text-green-700 text-sm mt-2 font-medium">
              You will receive an email notification once your account has been verified.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary w-full inline-block text-center py-4">
            Return to Login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light font-sans">
      <Card className="w-full max-w-[450px] !p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-industrial-orange text-white rounded-2xl mb-4 shadow-lg shadow-orange-900/20">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-industrial-slate tracking-tight">Worker Registration</h1>
          <p className="text-industrial-gray text-sm mt-2 font-medium">Onboarding Portal</p>
        </div>
        
        {error && <Alert type="error" message={error} className="mb-6" />}

        <form onSubmit={handleRegister} className="space-y-5">
          <Input 
            label="Full Name"
            placeholder="John Doe"
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={loading}
          />
          <Input 
            label="Work Email"
            type="email" 
            placeholder="john@company.com"
            required 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={loading}
          />
          <Input 
            label="Security Password"
            type="password" 
            placeholder="Min. 6 characters"
            required 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            disabled={loading}
          />

          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-industrial-slate ml-1">Religion</label>
              <Input 
                placeholder="e.g. Christian"
                value={formData.religion} 
                onChange={(e) => setFormData({...formData, religion: e.target.value})}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-industrial-slate ml-1">Rest Day</label>
              <select 
                className="input-field cursor-pointer"
                value={formData.religiousRestDay} 
                onChange={(e) => setFormData({...formData, religiousRestDay: e.target.value})}
                disabled={loading}
              >
                <option value="None">None</option>
                <option value="Sunday">Sunday</option>
                <option value="Saturday">Saturday</option>
                <option value="Friday">Friday</option>
                <option value="Monday">Monday</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            variant="accent"
            className="h-14 text-lg mt-4"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Register for Verification'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm font-medium text-industrial-gray">
            Already have an account? <Link to="/login" className="text-industrial-blue hover:underline font-bold">Sign In</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
