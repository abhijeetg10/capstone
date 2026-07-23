import React from 'react';
import { Bell, Globe, CheckCircle, AlertTriangle, Cloud, Activity } from 'lucide-react';

const notifications = [
  { id: 1, type: 'success', text: 'Global Model Updated Successfully', time: '10 mins ago', icon: <Globe size={16} /> },
  { id: 2, type: 'success', text: 'Local Training Completed (Round 24)', time: '1 hour ago', icon: <CheckCircle size={16} /> },
  { id: 3, type: 'success', text: 'Flower Synchronization Successful', time: '2 hours ago', icon: <Cloud size={16} /> },
  { id: 4, type: 'warning', text: 'High Dengue Trend Detected locally', time: '5 hours ago', icon: <Activity size={16} /> },
  { id: 5, type: 'alert', text: 'New Disease Alert Received from Municipal Auth', time: '1 day ago', icon: <AlertTriangle size={16} /> },
];

const getIconColor = (type) => {
  switch(type) {
    case 'success': return 'text-emerald-500 bg-emerald-50';
    case 'warning': return 'text-amber-500 bg-amber-50';
    case 'alert': return 'text-rose-500 bg-rose-50';
    default: return 'text-blue-500 bg-blue-50';
  }
};

const HospitalNotifications = () => {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Bell size={20} className="text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">System Notifications</h2>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex gap-3">
            <div className={`mt-0.5 p-2 rounded-full h-fit flex-shrink-0 ${getIconColor(notif.type)}`}>
              {notif.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{notif.text}</p>
              <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
        View All Notifications
      </button>
    </div>
  );
};

export default HospitalNotifications;
