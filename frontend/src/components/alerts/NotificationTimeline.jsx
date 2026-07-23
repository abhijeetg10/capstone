import React from 'react';
import { Mail, Smartphone, Hospital, Building2 } from 'lucide-react';

const notifications = [
  { id: 1, type: 'SMS', icon: <Smartphone size={18} />, target: 'Citizens (North Ward)', message: 'High Dengue risk in your area. Use repellents and clear stagnant water.', time: '10 mins ago', status: 'Sent', color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 2, type: 'Hospital Alert', icon: <Hospital size={18} />, target: 'City General & Mercy Hospital', message: 'Prepare for potential surge in Influenza cases (Predicted +15%).', time: '1 hour ago', status: 'Acknowledged', color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 3, type: 'Municipality', icon: <Building2 size={18} />, target: 'Sanitation Dept', message: 'Dispatch fogging teams to Central District. Risk score critical.', time: '3 hours ago', status: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 4, type: 'Email', icon: <Mail size={18} />, target: 'Registered Clinics', message: 'Weekly surveillance report and updated protocols attached.', time: '1 day ago', status: 'Sent', color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

const NotificationTimeline = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Dispatch Timeline</h3>
      
      <div className="space-y-6">
        {notifications.map((notif, index) => (
          <div key={notif.id} className="relative flex gap-4">
            {/* Timeline Line */}
            {index !== notifications.length - 1 && (
              <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
            )}
            
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${notif.bg} ${notif.color} flex items-center justify-center shrink-0 z-10 ring-4 ring-white`}>
              {notif.icon}
            </div>
            
            {/* Content */}
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">{notif.type}</span>
                  <span className="text-sm font-semibold text-slate-800">Target: {notif.target}</span>
                </div>
                <span className="text-xs text-slate-400">{notif.time}</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{notif.message}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  notif.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                  notif.status === 'Acknowledged' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {notif.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationTimeline;
