import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import { X, FileText, Download, TrendingUp, Users, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { data: dailyStats } = useQuery({
    queryKey: ['daily-attendance-pts'],
    queryFn: async () => {
      const res = await api.get('/reports/daily-attendance');
      return res.data.data || { present: 0, late: 0, total: 0, absent: 0, onLeave: 0 };
    }
  });

  const { data: reportStats } = useQuery({
    queryKey: ['report-stats'],
    queryFn: async () => {
      const res = await api.get('/reports/stats');
      return res.data.data || { generatedCount: 0, accuracy: "99.9" };
    }
  });

  const [viewingReport, setViewingReport] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<any[]>([]);

  const reports = [
    { title: 'Daily Attendance Report', description: 'Complete log of sign-ins, lates, and absences for today.', icon: <Users className="text-blue-600" />, type: 'Attendance', reportKey: 'Daily' },
    { title: 'Shift Performance Summary', description: 'Efficiency metrics and late trends per shift.', icon: <TrendingUp className="text-green-600" />, type: 'Operations', reportKey: 'Shift' },
    { title: 'Leave Utilization', description: 'Analysis of leave requests and balances across departments.', icon: <Calendar className="text-orange-600" />, type: 'HR', reportKey: 'Leaves' },
    { title: 'System Audit Logs', description: 'Security and access logs for the last 30 days.', icon: <FileText className="text-slate-600" />, type: 'Security', reportKey: 'Audit' },
  ];

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/export/Attendance', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Full_Attendance_Dump_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleView = async (title: string) => {
    try {
      const report = reports.find(r => r.title === title);
      if (!report) return;
      
      setViewingReport(title);
      const res = await api.get(`/reports/export/${report.reportKey}?format=json`);
      setPreviewData(Array.isArray(res.data.data) ? res.data.data.slice(0, 10) : []);
    } catch (err) {
      console.error('View failed:', err);
      setPreviewData([]);
    }
  };

  const handleDownload = async (title: string) => {
    try {
      const report = reports.find(r => r.title === title);
      if (!report) return;

      const response = await api.get(`/reports/export/${report.reportKey}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.reportKey}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Intelligence & Reporting" 
        subtitle="Generate and export system-wide performance analytics"
        actions={
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={18} />
            Export All Data
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Today's Turnout" 
          value={`${dailyStats?.present || 0}%`} 
          trend={{ value: '+2.4%', isUp: true }} 
          icon={<Users size={20} />} 
        />
        <StatCard 
          label="Late Index" 
          value={dailyStats?.late || 0} 
          trend={{ value: '-10%', isUp: false }} 
          icon={<FileText size={20} />} 
        />
        <StatCard 
          label="Reports Generated" 
          value={reportStats?.generatedCount || 0} 
          trend={{ value: '+12%', isUp: true }} 
          icon={<FileText size={20} />} 
        />
        <StatCard 
          label="Data Accuracy" 
          value={`${reportStats?.accuracy || 99.9}%`} 
          icon={<TrendingUp size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, i) => (
          <Card key={i} className="hover:border-industrial-blue transition-colors cursor-pointer group">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-industrial-blue group-hover:text-white transition-colors">
                {report.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-industrial-slate">{report.title}</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-industrial-gray bg-gray-100 px-2 py-1 rounded">{report.type}</span>
                </div>
                <p className="text-sm text-industrial-gray mt-1 font-medium">{report.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="text-xs py-1.5 h-auto" onClick={() => handleView(report.title)}>View Online</Button>
                  <Button variant="outline" className="text-xs py-1.5 h-auto" onClick={() => handleDownload(report.title)}>Download PDF</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-industrial-slate text-white">
              <div>
                <h2 className="text-xl font-bold">{viewingReport}</h2>
                <p className="text-xs text-blue-200 uppercase tracking-widest mt-1">Live Data Preview (Recent Entries)</p>
              </div>
              <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {previewData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-industrial-gray border-b border-gray-100">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Employee</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Sign In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {previewData.map((row, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-4 font-bold text-industrial-slate">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="py-4 text-industrial-gray">{row.employeeId?.name || 'N/A'}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              row.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-4 text-industrial-gray">{row.signInTime ? new Date(row.signInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-industrial-gray">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">No preview data available for this report type.</p>
                  <p className="text-xs mt-1">Use the Download PDF/CSV option for the full report.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingReport(null)}>Close Preview</Button>
              <Button onClick={() => handleDownload(viewingReport)}>Download Full Report</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
