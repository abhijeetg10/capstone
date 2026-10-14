import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Info, ShieldAlert } from 'lucide-react';

const AbnormalDemandAlerts = () => {
  const [alerts, setAlerts] = useState([
    {
      medicine: 'Paracetamol 650mg (Antipyretic)',
      type: 'Unusual Sales Velocity (Fever Outbreak)',
      deviation: '+240% Surge',
      currentValue: '110 units / day',
      expectedValue: '32 units / day'
    },
    {
      medicine: 'Doxycycline 100mg (Antibiotic)',
      type: 'Leptospirosis Prophylaxis Demand',
      deviation: '+185% Surge',
      currentValue: '72 units / day',
      expectedValue: '25 units / day'
    },
    {
      medicine: 'ORS & Zinc Electrolyte Packets',
      type: 'Acute Gastroenteritis Cluster',
      deviation: '+140% Surge',
      currentValue: '65 units / day',
      expectedValue: '20 units / day'
    },
    {
      medicine: 'Artemether + Lumefantrine 80/480mg',
      type: 'Malaria Treatment Demand Spike',
      deviation: '+115% Surge',
      currentValue: '39 units / day',
      expectedValue: '15 units / day'
    }
  ]);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/erd/pharmacy/records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          const surging = records.filter(r => r.surgeFlag === 'Surging' || r.surgeFlag === 'High Demand');
          if (surging.length > 0) {
            const dynamicAlerts = surging.map(r => {
              const mainMed = (r.medicines && r.medicines[0]) ? r.medicines[0].medicine : 'Antipyretic / Antibiotic';
              return {
                medicine: `${mainMed} (${r.patientName})`,
                type: `Surge Flagged by PMS Integration (${r.doctor})`,
                deviation: r.surgeFlag === 'Surging' ? '+210% Surge' : '+140% High Demand',
                currentValue: `${r.totalQuantity || 35} units dispensed`,
                expectedValue: '12 units baseline'
              };
            });
            setAlerts(dynamicAlerts);
          }
        }
      } catch (e) {
        console.error("Error fetching pharmacy alerts:", e);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="glass-card p-6 flex flex-col h-full border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          Abnormal Sales Demand Alerts
        </h3>
        <span className="text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full">
          {alerts.length} Active Surges
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
            <Info size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No abnormal spikes detected.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="p-4 rounded-2xl border border-rose-200/90 bg-rose-50/60 relative overflow-hidden group shadow-xs">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{alert.medicine}</h4>
                  <p className="text-xs text-rose-700 font-semibold">{alert.type}</p>
                </div>
                <div className="flex items-center gap-1 text-rose-800 bg-rose-200/80 border border-rose-300 px-2.5 py-1 rounded-lg text-xs font-black">
                  <TrendingUp size={13} />
                  {alert.deviation}
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Current rate: <span className="font-bold text-slate-900">{alert.currentValue}</span> 
                {' '}(Expected Baseline: <span className="font-bold text-slate-700">{alert.expectedValue}</span>)
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AbnormalDemandAlerts;
