import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { UserPlus, Trash2, Edit, Search, X } from 'lucide-react';

const DEPARTMENTS = ['Operations', 'Logistics', 'Security', 'HR', 'IT', 'Maintenance', 'Administration', 'Quality Control'];
const POSITIONS = ['Standard', 'Supervisor', 'Lead', 'Manager', 'Technician', 'Specialist', 'Intern'];

export default function Employees() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
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
                    onClick={() => handleEdit(emp)}
                    className="p-2 text-industrial-gray hover:text-industrial-blue hover:bg-industrial-blue/5 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => { if(confirm('Are you sure you want to remove this employee?')) deleteMutation.mutate(emp._id) }}
                    className="p-2 text-industrial-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
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
    </div>
  );
}

function EmployeeModal({ isOpen, onClose, onSave, initialData, isLoading }: any) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    password: '',
    department: 'Operations',
    position: 'Standard',
    shiftId: initialData?.shiftId?._id || '', 
    status: 'active',
    dateHired: initialData?.dateHired ? new Date(initialData.dateHired).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-industrial-slate">
            {initialData ? 'Update Staff Member' : 'Register New Personnel'}
          </h2>
          <Button variant="outline" className="p-1 h-auto" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
