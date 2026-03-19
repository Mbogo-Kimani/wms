import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  Settings, 
  LayoutDashboard, 
  Menu, 
  X,
  LogOut,
  Bell,
  TrendingUp,
  Shield,
  Archive as FileBox,
  UserCheck,
  User as UserIcon
} from 'lucide-react';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/attendance', icon: <Clock size={20} />, label: 'Attendance', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/pending-registrations', icon: <UserCheck size={20} />, label: 'Pending Registrations', roles: ['admin', 'manager'] },
    { path: '/admin/employees', icon: <Users size={20} />, label: 'Employees', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/shifts', icon: <Clock size={20} />, label: 'Shifts', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/leaves', icon: <Calendar size={20} />, label: 'Leave Requests', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/memos', icon: <Bell size={20} />, label: 'Memos', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/holidays', icon: <Calendar size={20} />, label: 'Holidays', roles: ['admin', 'manager'] },
    { path: '/admin/policies', icon: <Clock size={20} />, label: 'Policies', roles: ['admin', 'manager'] },
    { path: '/admin/schedules', icon: <Shield size={20} />, label: 'Scheduling', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/analytics', icon: <TrendingUp size={20} />, label: 'Analytics', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/reports', icon: <FileBox size={20} />, label: 'Reports', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/profile', icon: <UserIcon size={20} />, label: 'Profile', roles: ['admin', 'manager', 'supervisor'] },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings', roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-industrial-light overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-industrial-slate text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xl font-extrabold tracking-tight text-industrial-orange">INDUSTRIAL<span className="text-white">WMS</span></span>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors font-medium ${
                  location.pathname === item.path 
                    ? 'bg-industrial-blue text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-400 hover:bg-red-950 hover:text-red-400 transition-colors font-medium"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <button 
            className="md:hidden p-2 text-industrial-slate" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-industrial-gray hover:text-industrial-blue rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={20} />
            </button>
            <Link to="/admin/profile" className="flex items-center gap-2 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-industrial-orange flex items-center justify-center text-white font-bold text-sm">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-industrial-slate leading-none">{user.name || 'Admin'}</p>
                <p className="text-[8px] font-black text-industrial-orange uppercase tracking-tighter mt-1">{role}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}