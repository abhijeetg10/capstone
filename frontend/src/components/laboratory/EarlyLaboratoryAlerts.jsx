import React from 'react';
import { ShieldAlert, AlertTriangle, Info, TrendingUp, CheckCircle2 } from 'lucide-react';

const alerts = [
  {
    id: 1,
    title: 'Leptospirosis Cluster (Serology MAT Positive)',
    time: '15 mins ago',
    message: 'High positivity velocity detected (7 positive PCR/MAT specimens in 48 hours). Concentrated around Ishwarpur North Ward / Station Area.',
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    icon: <AlertTriangle size={18} className="text-rose-600" />
  },
  {
    id: 2,
    title: 'Dengue NS1 Antigen Surge (Type 2 Serotype)',
    time: '45 mins ago',
    message: 'NS1 positivity rate increased by +34% over 7-day baseline. 12 positive lab reports confirmed across Suburban District.',
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    icon: <TrendingUp size={18} className="text-amber-600" />
  },
  {
    id: 3,
    title: 'Salmonella Enterica Stool Culture Isolation',
    time: '2 hours ago',
    message: 'Waterborne pathogen isolated from 4 inpatient samples. Municipal water sampling initiated in Thane Central.',
    bg: 'bg-blue-50/80',
    border: 'border-blue-200',
    icon: <ShieldAlert size={18} className="text-blue-600" />
  }
];

const EarlyLaboratoryAlerts = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={20} />
            Early Laboratory Anomaly Alerts
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Automated detection from LIMS specimen testing trends</p>
        </div>
        <span className="text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full">
          {alerts.length} Active
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-2xl border ${alert.bg} ${alert.border} shadow-xs`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-white/80 rounded-xl shadow-xs">
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <span className="text-[10px] font-bold text-slate-500 font-mono bg-white/80 px-2 py-0.5 rounded-md">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarlyLaboratoryAlerts;
