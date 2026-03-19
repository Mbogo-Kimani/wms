import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { UserPlus, Trash2, Edit, Search, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Operations', 'Logistics', 'Security', 'HR', 'IT', 'Maintenance', 'Administration', 'Quality Control'];
const POSITIONS = ['Standard', 'Supervisor', 'Lead', 'Manager', 'Technician', 'Specialist', 'Intern'];

export default function Employees() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data;
    }
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => editingEmployee 
      ? api.put(`/employees/${editingEmployee._id}`, data)
      : api.post('/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setEditingEmployee(null);
      toast.success(editingEmployee ? 'Staff profile updated' : 'Personnel registered successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Access Forbidden: Only Admins or Managers can perform this action');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee record removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Access Denied: Insufficient permissions to delete records');
    }
  });

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const filteredEmployees = employees?.filter((emp: any) => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workforce Management" 
        subtitle="Manage employee records, roles and departmental assignments"
        actions={
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} />
            Add Staff Member
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search by name, ID or department..."
          className="input-field pl-11 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-industrial-gray font-medium">Loading workforce database...</div>
      ) : (
        <Table headers={['Staff Member', 'ID', 'Department', 'Position', 'Status', 'Actions']}>
          {filteredEmployees?.map((emp: any) => (
            <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-industrial-slate text-white flex items-center justify-center font-bold shadow-sm">
                    {emp.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-industrial-slate">{emp.name}</span>
                    <span className="text-xs text-industrial-gray font-medium">{emp.email}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-sm font-bold text-industrial-blue">
                {emp.employeeId}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-industrial-gray">
                {emp.department}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-industrial-slate">
                {emp.position}
              </td>
              <td className="px-6 py-4">
                <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'on_leave' ? 'warning' : 'danger'}>
                  {emp.status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewingEmployee(emp)}
                    className="p-2 text-industrial-gray hover:text-industrial-blue hover:bg-industrial-blue/5 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleEdit(emp)}
                    className="p-2 text-industrial-gray hover:text-industrial-blue hover:bg-industrial-blue/5 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  {(role === 'admin' || role === 'manager') && (
                    <button 
                      onClick={() => { if(confirm('Are you sure you want to remove this employee?')) deleteMutation.mutate(emp._id) }}
                      className="p-2 text-industrial-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {isModalOpen && (
        <EmployeeModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }}
          onSave={(data: any) => upsertMutation.mutate(data)}
          initialData={editingEmployee}
          isLoading={upsertMutation.isPending}
        />
      )}

      {viewingEmployee && (
        <WorkerDetailsModal 
          employee={viewingEmployee} 
          onClose={() => setViewingEmployee(null)} 
        />
      )}
    </div>
  );
}

function WorkerDetailsModal({ employee, onClose }: any) {
  const { data: details, isLoading } = useQuery({
    queryKey: ['employee', employee._id],
    queryFn: async () => {
      const res = await api.get(`/employees/${employee._id}`);
      return res.data;
    }
  });

  const { data: activity } = useQuery({
    queryKey: ['employee-activity', employee._id],
    queryFn: async () => {
      const res = await api.get(`/employees/${employee._id}/activity`);
      return res.data;
    }
  });

  const stats = details?.stats;
  const emp = details?.employee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl !p-0 overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        <div className="relative h-32 bg-industrial-slate shrink-0">
           <div className="absolute inset-0 bg-gradient-to-r from-industrial-blue/20 to-transparent" />
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl p-2 text-white transition-all shadow-lg border border-white/20"
           >
             <X size={20} />
           </button>
           <div className="absolute -bottom-12 left-8">
             <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                {emp?.profilePhoto ? (
                  <img src={emp.profilePhoto} className="w-full h-full object-cover" alt={emp.name} />
                ) : (
                  <span className="text-4xl font-black text-industrial-blue">{employee.name[0]}</span>
                )}
             </div>
           </div>
        </div>

        <div className="px-8 pt-16 pb-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <h2 className="text-2xl font-black text-industrial-slate">{employee.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="info">{employee.employeeId}</Badge>
               <Badge variant={employee.status === 'active' ? 'success' : 'warning'}>{employee.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
             <StatMini label="Reliability" value={`${stats?.reliabilityScore || 0}%`} color="text-industrial-orange" />
             <StatMini label="Presence" value={stats?.presentCount || 0} color="text-green-600" />
             <StatMini label="Late" value={stats?.lateCount || 0} color="text-amber-600" />
             <StatMini label="Absence" value={stats?.absenceCount || 0} color="text-red-600" />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <StatMini label="Annual Leave Total" value={details?.balance?.annualLeaveTotal || 0} color="text-industrial-blue" />
             <StatMini label="Leave Used" value={(details?.balance?.annualLeaveUsed || 0) + (details?.balance?.sickLeaveUsed || 0)} color="text-amber-600" />
             <StatMini label="Leave Remaining" value={details?.balance?.remainingLeave || 0} color="text-green-600" />
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-industrial-gray uppercase tracking-widest border-b border-gray-100 pb-2">Employment Details</h3>
                <DetailRow label="System Role" value={emp?.userId?.role || employee.role || 'Worker'} />
                <DetailRow label="Department" value={emp?.department || employee.department} />
                <DetailRow label="Position" value={emp?.position || employee.position} />
                <DetailRow label="Joined" value={new Date(emp?.dateHired || employee.dateHired).toLocaleDateString()} />
                <DetailRow label="Email" value={emp?.email || employee.email} />
                <DetailRow label="Phone" value={emp?.phone || employee.phone || 'N/A'} />
                <DetailRow label="Religion" value={emp?.religion || employee.religion || 'N/A'} />
                <DetailRow label="Rest Day" value={emp?.religiousRestDay || employee.religiousRestDay || 'None'} />
                <DetailRow label="Assigned Shift" value={emp?.shiftId?.name || employee.shiftId?.name || 'Standard Shift'} />
                <DetailRow label="Shift Hours" value={emp?.shiftId ? `${emp.shiftId.startTime} — ${emp.shiftId.endTime}` : (employee.shiftId ? `${employee.shiftId.startTime} — ${employee.shiftId.endTime}` : '08:00 — 17:00')} />
                <DetailRow label="Worker Availability Score" value={`${stats?.reliabilityScore || 100}%`} />
             </div>
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-industrial-gray uppercase tracking-widest border-b border-gray-100 pb-2">Recent Timeline</h3>
                <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                   {activity?.length > 0 ? activity.slice(0, 5).map((act: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100/50">
                        <div className="font-bold text-industrial-slate">{new Date(act.date).toLocaleDateString()}</div>
                        <Badge variant={act.status === 'present' ? 'success' : act.status === 'late' ? 'warning' : 'danger'} className="!text-[8px] !px-1.5 h-4">
                          {act.status}
                        </Badge>
                     </div>
                   )) : <p className="text-xs text-industrial-gray py-4 text-center">No activity found</p>}
                </div>
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatMini({ label, value, color }: any) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center">
       <span className="text-[8px] font-black text-industrial-gray uppercase tracking-widest mb-1">{label}</span>
       <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
       <span className="text-industrial-gray font-medium">{label}</span>
       <span className="font-bold text-industrial-slate">{value}</span>
    </div>
  );
}

function EmployeeModal({ isOpen, onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    phone: initialData?.phone || '',
    password: '',
    department: 'Operations',
    position: 'Standard',
    religion: initialData?.religion || '',
    religiousRestDay: initialData?.religiousRestDay || 'None',
    weekendWorker: initialData?.weekendWorker || false,
    holidayWorker: initialData?.holidayWorker || false,
    shiftId: initialData?.shiftId?._id || '', 
    status: 'active',
    dateHired: initialData?.dateHired ? new Date(initialData.dateHired).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate">
            {initialData ? 'Update Staff Member' : 'Register New Personnel'}
          </h2>
          <Button variant="outline" className="p-1 h-auto" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar p-6 pt-0">
          <Input 
            label="Full Name" 
            placeholder="John Doe" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input 
            label="Corporate Email" 
            type="email"
            placeholder="john@company.com" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {!initialData && (
            <Input 
              label="Initial Password" 
              type="password"
              placeholder="Leave blank for default: Wms@2026" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-industrial-gray uppercase">Department</label>
                <select 
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-industrial-gray uppercase">Default Shift</label>
                <ShiftSelector 
                  value={formData.shiftId}
                  onChange={(val: string) => setFormData({ ...formData, shiftId: val })}
                />
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-industrial-gray uppercase">Position</label>
                <select 
                  className="input-field"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-industrial-gray uppercase">Status</label>
              <select 
                className="input-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
               label="Phone Number" 
               placeholder="+254..." 
               value={formData.phone}
               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
             />
             <Input 
               label="Religion" 
               placeholder="e.g. Christian" 
               value={formData.religion}
               onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-industrial-gray uppercase">Rest Day</label>
                <select 
                  className="input-field"
                  value={formData.religiousRestDay}
                  onChange={(e) => setFormData({ ...formData, religiousRestDay: e.target.value })}
                >
                  <option value="None">None</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
            </div>
            <div className="flex flex-col gap-2 pb-2">
               <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    checked={formData.weekendWorker} 
                    onChange={(e) => setFormData({...formData, weekendWorker: e.target.checked})}
                    className="rounded border-gray-300 text-industrial-blue focus:ring-industrial-blue"
                  />
                  <span className="font-bold text-industrial-slate">Weekend Worker</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    checked={formData.holidayWorker} 
                    onChange={(e) => setFormData({...formData, holidayWorker: e.target.checked})}
                    className="rounded border-gray-300 text-industrial-blue focus:ring-industrial-blue"
                  />
                  <span className="font-bold text-industrial-slate">Holiday Worker</span>
               </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={isLoading}>
              {initialData ? 'Save Changes' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ShiftSelector({ value, onChange }: any) {
  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const res = await api.get('/shifts');
      return res.data;
    }
  });

  return (
    <select 
      className="input-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="">Select Shift</option>
      {shifts?.map((s: any) => (
        <option key={s._id} value={s._id}>{s.name}</option>
      ))}
    </select>
  );
}
