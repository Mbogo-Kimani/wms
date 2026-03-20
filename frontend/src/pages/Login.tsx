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
      const message = err.response?.data?.message || 
                     (err.request ? 'Unable to connect to service. Please check your connection.' : 'Invalid email or password');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const [showDemo, setShowDemo] = useState(true);
  const [demoStep, setDemoStep] = useState(1);
  const totalSteps = 3;

  const fillDemo = () => {
    setEmail('admin@wms.com');
    setPassword('password123');
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-industrial-light relative overflow-hidden">
      {/* Enhanced Multi-Step Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-slate/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-[440px] !p-0 border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header with Progress */}
            <div className="bg-industrial-slate p-6 text-white relative">
              <div className="absolute top-0 left-0 h-1 bg-industrial-orange transition-all duration-500" style={{ width: `${(demoStep / totalSteps) * 100}%` }} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">System Trial</h2>
                  <p className="text-industrial-gray text-xs font-bold uppercase tracking-widest mt-1">Onboarding Guide</p>
                </div>
                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black">STEP {demoStep} OF {totalSteps}</span>
              </div>
            </div>

            <div className="p-8">
              {demoStep === 1 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="w-12 h-12 bg-industrial-orange/10 rounded-2xl flex items-center justify-center mb-6">
                    <Lock className="text-industrial-orange" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-industrial-slate mb-3">Admin Master Access</h3>
                  <p className="text-sm text-industrial-gray mb-6 leading-relaxed">
                    Start by exploring the system as a <strong>System Administrator</strong>. This gives you oversight of all operations, staff, and analytics.
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-black text-industrial-gray uppercase tracking-widest mb-1">Demo Credentials</div>
                      <div className="text-sm font-bold text-industrial-slate">admin@wms.com</div>
                      <div className="text-sm font-medium text-industrial-gray">password123</div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-industrial-blue/5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-industrial-blue animate-pulse" />
                    </div>
                  </div>
                  <Button fullWidth onClick={() => setDemoStep(2)} className="h-12">
                    Next: Experience as Worker
                  </Button>
                </div>
              )}

              {demoStep === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="w-12 h-12 bg-industrial-blue/10 rounded-2xl flex items-center justify-center mb-6">
                    <Mail className="text-industrial-blue" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-industrial-slate mb-3">Worker Registration</h3>
                  <p className="text-sm text-industrial-gray mb-6 leading-relaxed">
                    To see the full lifecycle, you should <strong>register as a worker</strong>. New workers are held in a "Pending" state until an admin verifies them.
                  </p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-industrial-slate font-medium">
                      <div className="w-5 h-5 rounded-full bg-industrial-orange/20 text-industrial-orange text-[10px] flex items-center justify-center font-black">1</div>
                      Click "Register Account" below the login form
                    </div>
                    <div className="flex items-center gap-3 text-sm text-industrial-slate font-medium">
                      <div className="w-5 h-5 rounded-full bg-industrial-orange/20 text-industrial-orange text-[10px] flex items-center justify-center font-black">2</div>
                      Submit your worker application
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-12" onClick={() => setDemoStep(1)}>Back</Button>
                    <Button className="flex-[2] h-12" onClick={() => setDemoStep(3)}>Next: Verify Worker</Button>
                  </div>
                </div>
              )}

              {demoStep === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                    <div className="w-6 h-6 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-industrial-slate mb-3">Verification Lifecycle</h3>
                  <p className="text-sm text-industrial-gray mb-8 leading-relaxed">
                    Once you've registered, log in as <strong>Admin</strong> to verify your worker profile. This activates the account and allows worker-level access to the portal.
                  </p>
                  <div className="space-y-3">
                    <Button fullWidth onClick={fillDemo} className="!bg-industrial-orange hover:!bg-orange-600 h-14 text-base shadow-lg shadow-orange-500/20">
                      Auto-Fill Admin & Explore
                    </Button>
                    <Button fullWidth variant="outline" onClick={() => { setShowDemo(false); navigate('/register'); }} className="h-12">
                      Register as Worker
                    </Button>
                    <button 
                      onClick={() => setShowDemo(false)}
                      className="w-full pt-2 text-[10px] font-bold text-industrial-gray hover:text-industrial-slate uppercase tracking-widest transition-colors"
                    >
                      I'll explore the login form
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-[400px] !p-10 z-10">
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