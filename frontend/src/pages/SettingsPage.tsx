import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { Settings as SettingsIcon, Save, MapPin, Wifi, Shield, Bell } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    companyName: 'WMS Industrial',
    latitude: 0,
    longitude: 0,
    allowedRadiusMeters: 500,
    allowedWifiSSID: 'Company_Guest'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/settings');
        if (res.data) setSettings(res.data);
      } catch (err) {
        setError('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings', settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-industrial-gray">Loading infrastructure config...</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="System Settings" 
        subtitle="Global configuration and infrastructure management"
        actions={
          <Button onClick={handleSave} loading={saving} className="flex items-center gap-2">
            <Save size={18} />
            Save Changes
          </Button>
        }
      />

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <MapPin className="text-industrial-orange" size={20} />
              <h3 className="font-bold text-industrial-slate">Geofencing Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Site Latitude" 
                value={settings.latitude} 
                onChange={e => setSettings({...settings, latitude: parseFloat(e.target.value)})}
                type="number"
              />
              <Input 
                label="Site Longitude" 
                value={settings.longitude} 
                onChange={e => setSettings({...settings, longitude: parseFloat(e.target.value)})}
                type="number"
              />
              <Input 
                label="Allowed Radius (Meters)" 
                value={settings.allowedRadiusMeters} 
                onChange={e => setSettings({...settings, allowedRadiusMeters: parseInt(e.target.value)})}
                type="number" 
              />
              <Input label="Location Buffer" defaultValue="15" type="number" disabled />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <Wifi className="text-industrial-blue" size={20} />
              <h3 className="font-bold text-industrial-slate">WiFi Verification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Corporate SSID" 
                value={settings.allowedWifiSSID} 
                onChange={e => setSettings({...settings, allowedWifiSSID: e.target.value})}
              />
              <Input label="Allowed MAC Ranges" placeholder="FF:FF:FF..." disabled />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-industrial-slate text-white">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
              <Shield className="text-industrial-orange" size={20} />
              <h3 className="font-bold">Security & Roles</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">2FA Enforcement</span>
                <span className="font-bold">ENABLED</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Session Timeout</span>
                <span className="font-bold">12 HOURS</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Password Policy</span>
                <span className="font-bold text-green-400">STRICT</span>
              </div>
            </div>
            <Button variant="accent" fullWidth className="mt-8">Audit Access Logs</Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <Bell className="text-industrial-blue" size={20} />
              <h3 className="font-bold text-industrial-slate">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['Email Alerts', 'SMS Gateways', 'System Push'].map((n) => (
                <label key={n} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <span className="text-sm font-medium text-industrial-gray">{n}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-industrial-blue" />
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
