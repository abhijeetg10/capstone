import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';

const AbnormalDemandAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    // Zero Data State: We explicitly set this to empty array to fulfill the requirement.
    setAlerts([]);
  }, []);

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          Abnormal Demand Alerts
        </h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          {alerts.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
            <Info size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No abnormal spikes detected.</p>
            <p className="text-xs">Awaiting sufficient PMS data sync.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{alert.medicine}</h4>
                  <p className="text-xs text-rose-600 font-medium">{alert.type}</p>
                </div>
                <div className="flex items-center gap-1 text-rose-600 bg-rose-100 px-2 py-1 rounded-md text-xs font-bold">
                  <TrendingUp size={12} />
                  {alert.deviation}
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Current rate: <span className="font-semibold text-slate-800">{alert.currentValue}</span> 
                (Expected: {alert.expectedValue})
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AbnormalDemandAlerts;
