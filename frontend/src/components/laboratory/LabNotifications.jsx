import React from 'react';
import { Bell, CheckCircle2, CloudDownload, Cpu, TrendingUp } from 'lucide-react';

const LabNotifications = () => {
  const notifications = [
    {
      id: 1,
      title: 'Local Training Completed',
      message: 'Local AI model successfully trained on new LIMS data.',
      time: '10 mins ago',
      icon: <Cpu size={16} className="text-emerald-500" />,
      unread: true
    },
    {
      id: 2,
      title: 'New Global Model Received',
      message: 'Global model v2.4 synced via Flower Server.',
      time: '1 hour ago',
      icon: <CloudDownload size={16} className="text-blue-500" />,
      unread: true
    },
    {
      id: 3,
      title: 'Synchronization Successful',
      message: 'Imported 120 new test records from LIMS.',
      time: '3 hours ago',
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      unread: false
    },
    {
      id: 4,
      title: 'Positive Trend Detected',
      message: 'Unusual spike in Dengue positive tests identified.',
      time: '5 hours ago',
      icon: <TrendingUp size={16} className="text-rose-500" />,
      unread: false
    }
  ];

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="text-primary-600" size={20} />
            Notifications
          </h2>
        </div>
        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full cursor-pointer hover:bg-primary-100 transition-colors">
          Mark all read
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex gap-3 items-start group">
            <div className={`p-2 rounded-full mt-0.5 ${notif.unread ? 'bg-slate-100' : 'bg-slate-50'}`}>
              {notif.icon}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${notif.unread ? 'text-slate-800' : 'text-slate-600'}`}>
                {notif.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {notif.message}
              </p>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                {notif.time}
              </span>
            </div>
            {notif.unread && (
              <div className="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabNotifications;
