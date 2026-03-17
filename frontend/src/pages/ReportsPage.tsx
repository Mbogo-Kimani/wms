import React from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import { FileText, Download, TrendingUp, Users, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ReportsPage() {
  const { data: dailyStats } = useQuery({
    queryKey: ['daily-attendance-pts'],
    queryFn: async () => {
      const res = await api.get('/reports/daily-attendance');
      return res.data.data || { present: 0, late: 0, total: 0, absent: 0, onLeave: 0 };
    }
  });

  const reports = [
    { title: 'Daily Attendance Report', description: 'Complete log of sign-ins, lates, and absences for today.', icon: <Users className="text-blue-600" />, type: 'Attendance' },
    { title: 'Shift Performance Summary', description: 'Efficiency metrics and late trends per shift.', icon: <TrendingUp className="text-green-600" />, type: 'Operations' },
    { title: 'Leave Utilization', description: 'Analysis of leave requests and balances across departments.', icon: <Calendar className="text-orange-600" />, type: 'HR' },
    { title: 'System Audit Logs', description: 'Security and access logs for the last 30 days.', icon: <FileText className="text-slate-600" />, type: 'Security' },
  ];

  const handleExport = () => {
    console.log('Preparing global data export...');
  };

  const handleView = (title: string) => {
    console.log(`Opening ${title} for online viewing...`);
    // Logic for viewing would go here
  };

  const handleDownload = (title: string) => {
    console.log(`Generating PDF for ${title}...`);
    // Logic for downloading would go here
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
          value="124" 
          trend={{ value: '+12%', isUp: true }} 
          icon={<FileText size={20} />} 
        />
        <StatCard 
          label="Data Accuracy" 
          value="99.9%" 
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
    </div>
  );
}
