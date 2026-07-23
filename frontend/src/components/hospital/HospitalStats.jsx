import React from 'react';
import { motion } from 'framer-motion';
import { Users, Cpu, Activity, AlertTriangle, RefreshCw, Globe } from 'lucide-react';

const stats = [
  { title: 'Patients Registered Today', value: '142', change: '+12', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Users size={24} /> },
  { title: 'Patients Processed by AI', value: '142', change: '100% Coverage', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Cpu size={24} /> },
  { title: 'Active Symptom Clusters', value: '3', change: 'Dengue, Malaria, Flu', color: 'text-rose-600', bg: 'bg-rose-50', icon: <Activity size={24} /> },
  { title: 'High Risk Patients', value: '8', change: 'Flagged by AI', color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertTriangle size={24} /> },
  { title: 'Last FL Sync', value: '12:30 PM', change: 'Successful', color: 'text-purple-600', bg: 'bg-purple-50', icon: <RefreshCw size={24} /> },
  { title: 'Global Model Version', value: 'v1.2.0', change: 'Synced', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Globe size={24} /> },
];

const HospitalStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="glass-card p-4 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            <h3 className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">{stat.title}</h3>
            <span className="text-xs font-semibold text-slate-400 mt-2 block truncate">
              {stat.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HospitalStats;
