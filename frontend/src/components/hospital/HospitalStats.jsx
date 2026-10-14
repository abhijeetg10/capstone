import React from 'react';
import { motion } from 'framer-motion';
import { Users, Cpu, Activity, AlertTriangle, RefreshCw, Globe } from 'lucide-react';

const stats = [
  { title: 'Total Confirmed Cases', value: '425', change: '+18 today', color: 'text-rose-600', bg: 'bg-rose-50', icon: <Users size={24} /> },
  { title: 'Suspected (Sent to Lab)', value: '1,204', change: 'Awaiting Results', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Activity size={24} /> },
  { title: 'Cases Last 24H', value: '89', change: '+12% from yesterday', color: 'text-blue-600', bg: 'bg-blue-50', icon: <RefreshCw size={24} /> },
  { title: 'Next Day Prediction', value: '110 Cases', change: 'High Confidence', color: 'text-purple-600', bg: 'bg-purple-50', icon: <Cpu size={24} /> },
  { title: 'Outbreak Risk', value: 'ELEVATED', change: 'Dengue Cluster Active', color: 'text-rose-600', bg: 'bg-rose-100', icon: <AlertTriangle size={24} /> },
  { title: 'Active AI Nodes', value: 'Online', change: 'Global Sync Active', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Globe size={24} /> },
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
