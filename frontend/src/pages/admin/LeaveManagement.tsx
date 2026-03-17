import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { LeaveRequest } from '../../types';

export default function LeaveManagement() {
  const queryClient = useQueryClient();

  const { data: leaves, isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['adminLeaves'],
    queryFn: async () => {
      const res = await api.get('/leaves/all'); // Assumes an admin route exists
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/leaves/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminLeaves'] })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Leave Requests</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Employee</th>
              <th className="p-4 font-semibold text-gray-600">Type</th>
              <th className="p-4 font-semibold text-gray-600">Dates</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves?.map((leave: any) => (
              <tr key={leave._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">{leave.employeeId?.name || 'Unknown'}</td>
                <td className="p-4 capitalize">{leave.leaveType}</td>
                <td className="p-4">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {leave.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {leave.status === 'pending' && (
                    <button 
                      onClick={() => approveMutation.mutate(leave._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}