import React from 'react';
import { Users, AlertTriangle, Hospital, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { title: 'Total Cases', value: '0', change: '-', isPositive: false, icon: <Users size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'High Risk Areas', value: '0', change: '-', isPositive: false, icon: <AlertTriangle size={24} />, color: 'text-rose-600', bg: 'bg-rose-50' },
  { title: 'Participating Hospitals', value: '0', change: '-', isPositive: true, icon: <Hospital size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'Model Accuracy', value: '-', change: '-', isPositive: true, icon: <Target size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'Active Alerts', value: '0', change: '-', isPositive: true, icon: <Activity size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const StatCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="glass-card p-5 hover:-translate-y-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {stat.change}
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
          <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatCards;
