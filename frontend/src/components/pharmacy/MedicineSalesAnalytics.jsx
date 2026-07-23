import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Activity, AlertTriangle, Pill } from 'lucide-react';

const MedicineSalesAnalytics = () => {
  const [indicators, setIndicators] = useState([
    { name: 'Paracetamol (Fever)', sales: 0, stock: 0, status: 'Awaiting Data', color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'ORS Packets (Cholera)', sales: 0, stock: 0, status: 'Awaiting Data', color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'Antimalarials', sales: 0, stock: 0, status: 'Awaiting Data', color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'Antibiotics', sales: 0, stock: 0, status: 'Awaiting Data', color: 'text-slate-400', bg: 'bg-slate-50' },
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicators.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="glass-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">{item.name}</h3>
            <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
              <Pill size={18} />
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500 mb-1">Today's Sales</p>
              <p className="text-xl font-black text-slate-800">{item.sales}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Stock Level</p>
              <p className="text-xl font-black text-slate-800">
                {item.stock}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
             <span className="text-xs font-semibold text-slate-500">AI Status:</span>
             <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.bg} ${item.color}`}>
               {item.status}
             </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MedicineSalesAnalytics;
