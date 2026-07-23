import React from 'react';
import AlertCards from '../components/alerts/AlertCards';
import NotificationTimeline from '../components/alerts/NotificationTimeline';
import { BellRing } from 'lucide-react';

const AlertDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <BellRing className="text-rose-500" />
            Emergency Alert Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time public health broadcast and tracking</p>
        </div>

        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          System Status: 
          <div className="flex items-center gap-1 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Monitoring
          </div>
        </div>
      </div>
      
      <AlertCards />
      
      <div className="mt-8">
        <NotificationTimeline />
      </div>
    </div>
  );
};

export default AlertDashboard;
