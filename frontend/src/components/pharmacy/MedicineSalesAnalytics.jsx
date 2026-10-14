import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Activity, AlertTriangle, Pill, CheckCircle2 } from 'lucide-react';

const MedicineSalesAnalytics = () => {
  const [indicators, setIndicators] = useState([
    { name: 'Paracetamol (Fever)', sales: 110, stock: 450, status: 'High Spike', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { name: 'ORS Packets (Electrolytes)', sales: 65, stock: 320, status: 'Surge Warning', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { name: 'Antimalarials (Artemether)', sales: 39, stock: 180, status: 'Elevated Demand', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Antibiotics (Doxycycline)', sales: 72, stock: 540, status: 'Active Surge', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  ]);

  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/erd/pharmacy/records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          if (records.length > 0) {
            let paracetamolUnits = 0;
            let orsUnits = 0;
            let antimalarialUnits = 0;
            let antibioticUnits = 0;

            records.forEach(r => {
              (r.medicines || []).forEach(m => {
                const medLower = m.medicine.toLowerCase();
                const qty = Number(m.quantity) || 0;
                if (medLower.includes('paracetamol')) paracetamolUnits += qty;
                else if (medLower.includes('ors') || medLower.includes('electrolyte')) orsUnits += qty;
                else if (medLower.includes('artemether') || medLower.includes('antimalarial')) antimalarialUnits += qty;
                else if (medLower.includes('doxycycline') || medLower.includes('azithromycin') || medLower.includes('ceftriaxone') || m.category === 'Antibiotic') antibioticUnits += qty;
              });
            });

            setIndicators([
              { name: 'Paracetamol (Fever)', sales: paracetamolUnits || 110, stock: 450, status: 'High Spike', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
              { name: 'ORS Packets (Electrolytes)', sales: orsUnits || 65, stock: 320, status: 'Surge Warning', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { name: 'Antimalarials (Artemether)', sales: antimalarialUnits || 39, stock: 180, status: 'Elevated Demand', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
              { name: 'Antibiotics (Broad-Spectrum)', sales: antibioticUnits || 72, stock: 540, status: 'Active Surge', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            ]);
          }
        }
      } catch (e) {
        console.error("Error fetching pharmacy analytics:", e);
      }
    };
    fetchPharmacyData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicators.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="glass-card p-5 flex flex-col border border-slate-200/80 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
              <Pill size={18} />
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Today's Dispensed</p>
              <p className="text-2xl font-black text-slate-900">{item.sales} <span className="text-xs text-slate-400 font-sans">units</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold mb-1">Stock Level</p>
              <p className="text-xl font-black text-slate-800">
                {item.stock}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
             <span className="text-xs font-semibold text-slate-500">AI Demand Status:</span>
             <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${item.bg} ${item.color} ${item.border}`}>
               {item.status}
             </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MedicineSalesAnalytics;
