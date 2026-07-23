import React from 'react';
import { AlertCircle, Server, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const alerts = [
  { id: 1, message: 'Unusual spike in respiratory cases in North Zone', time: '10 mins ago', severity: 'high' },
  { id: 2, message: 'New node connected: City General Hospital', time: '1 hour ago', severity: 'info' },
  { id: 3, message: 'Dengue risk threshold exceeded in East District', time: '3 hours ago', severity: 'medium' },
];

const StatusPanel = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Recent Alerts */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Recent Alerts</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex gap-4 items-start p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="mt-0.5">
                {alert.severity === 'high' && <AlertCircle size={20} className="text-rose-500" />}
                {alert.severity === 'medium' && <AlertCircle size={20} className="text-amber-500" />}
                {alert.severity === 'info' && <CheckCircle2 size={20} className="text-emerald-500" />}
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-medium leading-tight mb-1">{alert.message}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Model & Federated Status */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-card p-6 flex flex-col gap-6"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Federated Learning Status</h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Server size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Global Model V2.4</p>
                <p className="text-xs text-slate-500">Last aggregated 12 mins ago</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">Healthy</p>
              <p className="text-xs text-slate-500">99.9% Uptime</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Current Round: 142</p>
            <p className="text-sm font-medium text-slate-700">85% Complete</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Waiting for 3 more nodes to complete local training...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StatusPanel;
