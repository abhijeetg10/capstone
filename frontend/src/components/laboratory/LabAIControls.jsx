import React from 'react';
import { Activity, Target, CheckCircle, Database } from 'lucide-react';

const LabAIControls = () => {
  const metrics = [
    { label: 'Model Accuracy', value: '-', icon: <Target size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Precision', value: '-', icon: <CheckCircle size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Recall', value: '-', icon: <Activity size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'F1 Score', value: '-', icon: <Target size={18} />, color: 'text-slate-400', bg: 'bg-slate-50' },
  ];

  return (
    <div className="glass-card p-6 flex flex-col gap-6 h-full">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Local AI Monitoring</h3>
        <p className="text-sm text-slate-500 mb-6">Evaluation of your automated local model</p>
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Local Model V1.2</p>
                <p className="text-xs text-slate-500">Global Model V2.4</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">Synced</p>
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

        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Database size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Local Records Analyzed</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Last Sync</p>
              <p className="text-sm font-semibold">Pending</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Last Training</p>
              <p className="text-sm font-semibold text-slate-400">Pending</p>
            </div>
            <div className="col-span-2 pt-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Next Auto Training</p>
              <p className="text-sm font-semibold text-slate-400">Pending data sync</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LabAIControls;
