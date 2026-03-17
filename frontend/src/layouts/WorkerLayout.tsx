import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Bell, User, LogOut, Clock } from 'lucide-react';

export default function WorkerLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/worker', icon: <Home size={24} />, label: 'Home' },
    { path: '/worker/attendance', icon: <Clock size={24} />, label: 'Attendance' },
    { path: '/worker/leave', icon: <Calendar size={24} />, label: 'Leave' },
    { path: '/worker/memos', icon: <Bell size={24} />, label: 'Memos' },
    { path: '/worker/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-industrial-light flex flex-col pb-24">
      {/* Mobile Top Bar */}
      <header className="h-16 bg-industrial-slate text-white flex items-center justify-between px-6 sticky top-0 z-40 shadow-md">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-industrial-orange">WMS</span> MOBILE
        </span>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>
      
      {/* Content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`flex flex-col items-center min-w-[64px] transition-colors ${
              location.pathname === item.path 
                ? 'text-industrial-blue' 
                : 'text-industrial-gray'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              location.pathname === item.path ? 'bg-industrial-blue bg-opacity-10 scale-110' : ''
            }`}>
              {item.icon}
            </div>
            <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${
              location.pathname === item.path ? 'opacity-100' : 'opacity-60'
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}