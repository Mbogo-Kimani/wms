import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkerDashboard from './pages/WorkerDashboard';
import LeaveRequestPage from './pages/LeaveRequestPage';
import AdminDashboard from './pages/AdminDashboard';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Memos from './pages/Memos';
import Profile from './pages/Profile';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import HolidayManagement from './pages/HolidayManagement';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import WorkPolicyManagement from './pages/WorkPolicyManagement';
import ScheduleManagement from './pages/ScheduleManagement';
import WorkerAttendanceHistory from './pages/WorkerAttendanceHistory';
import AdminAttendance from './pages/AdminAttendance';
import WorkerLayout from './layouts/WorkerLayout';
import AdminLayout from './layouts/AdminLayout';
import PendingRegistrations from './pages/PendingRegistrations';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Mobile Worker Routes */}
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<WorkerDashboard />} />
            <Route path="attendance" element={<WorkerAttendanceHistory />} />
            <Route path="leave" element={<LeaveRequestPage />} />
            <Route path="memos" element={<Memos />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pending-registrations" element={<PendingRegistrations />} />
            <Route path="my-attendance" element={<WorkerAttendanceHistory />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="employees" element={<Employees />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="leaves" element={<LeaveRequestPage />} />
            <Route path="memos" element={<Memos />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="holidays" element={<HolidayManagement />} />
            <Route path="policies" element={<WorkPolicyManagement />} />
            <Route path="schedules" element={<ScheduleManagement />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}