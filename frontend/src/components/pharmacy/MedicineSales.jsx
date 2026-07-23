import React from 'react';
import { motion } from 'framer-motion';
import { Package, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

const inventory = [
  { name: 'Paracetamol', sales: 450, stock: 1200, status: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'ORS Packets', sales: 320, stock: 400, status: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Antibiotics', sales: 180, stock: 85, status: 'Low', color: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'Dengue Test Kits', sales: 45, stock: 12, status: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50' },
];

const MedicineSales = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {inventory.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="glass-card p-5 hover:-translate-y-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">{item.name}</h3>
            <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
              {item.status === 'Critical' || item.status === 'Low' ? <AlertTriangle size={18} /> : <Package size={18} />}
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500 mb-1">Weekly Sales</p>
              <p className="text-xl font-black text-slate-800">{item.sales}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Current Stock</p>
              <p className={`text-xl font-black ${item.status === 'Critical' ? 'text-rose-600' : 'text-slate-800'}`}>
                {item.stock}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
             <span className="text-xs font-semibold text-slate-500">Stock Status:</span>
             <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.bg} ${item.color}`}>
               {item.status}
             </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MedicineSales;
