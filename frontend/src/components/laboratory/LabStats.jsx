import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const stats = [
  { title: "Positive Tests", value: '45', change: '+5%', color: 'text-rose-600', bg: 'bg-rose-50', icon: <CheckCircle size={24} /> },
  { title: 'Negative Tests', value: '180', change: '-2%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <XCircle size={24} /> },
  { title: 'Pending Reports', value: '32', change: 'In Queue', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={24} /> },
  { title: 'Total Processed', value: '257', change: 'Today', color: 'text-blue-600', bg: 'bg-blue-50', icon: <FileText size={24} /> },
];

const LabStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="glass-card p-5 hover:-translate-y-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
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

export default LabStats;
