import React from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

const alerts = [];

const EarlyLaboratoryAlerts = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Early Laboratory Alerts
          </h2>
          <p className="text-sm text-slate-500 mt-1">Automated anomaly detection from testing trends</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
            <Info size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No laboratory anomalies detected.</p>
            <p className="text-xs">Awaiting sufficient LIMS data sync.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border ${alert.bg} ${alert.border}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">{alert.title}</h4>
                    <span className="text-[10px] font-medium text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EarlyLaboratoryAlerts;
