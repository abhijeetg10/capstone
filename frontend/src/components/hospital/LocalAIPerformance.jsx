import React from 'react';
import { Target, Activity, CheckCircle, Database } from 'lucide-react';

const LocalAIPerformance = () => {
  const metrics = [
    { label: 'Model Accuracy', value: '-', icon: <Target size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Precision', value: '-', icon: <CheckCircle size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Recall', value: '-', icon: <Activity size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'F1 Score', value: '-', icon: <Target size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Local AI Performance</h2>
          <p className="text-sm text-slate-500">Evaluation of your isolated local model</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className={`p-2 rounded-lg ${metric.bg} ${metric.color}`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{metric.label}</p>
              <p className="text-lg font-bold text-slate-800">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-white gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Database size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Local Samples Analyzed</p>
            <p className="text-lg font-bold">0</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-right">
            <p className="text-xs text-slate-400">Last Automated Training</p>
            <p className="text-sm font-semibold text-slate-400">Pending</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Next Automatic Training</p>
            <p className="text-sm font-semibold text-slate-400">Pending data sync</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalAIPerformance;
