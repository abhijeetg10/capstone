import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const alertStats = [
  { title: 'Critical Alerts', count: 3, label: 'Active', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: <AlertTriangle size={24} /> },
  { title: 'Moderate Alerts', count: 8, label: 'Monitoring', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle size={24} /> },
  { title: 'Resolved Alerts', count: 42, label: 'Past 30 Days', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={24} /> },
];

const AlertCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {alertStats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className={`glass-card ${stat.border} p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden`}
        >
          {stat.title === 'Critical Alerts' && (
             <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {stat.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-500">{stat.title}</h3>
          <p className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.count}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default AlertCards;
