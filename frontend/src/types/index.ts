export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'supervisor' | 'worker';
}

export interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface Attendance {
  _id: string;
  date: string;
  signInTime?: string;
  signOutTime?: string;
  status: 'present' | 'late' | 'absent' | 'overtime';
  overtimeMinutes: number;
}

export interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}