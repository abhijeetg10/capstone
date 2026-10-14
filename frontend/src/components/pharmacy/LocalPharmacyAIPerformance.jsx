import React from 'react';
import { Target, Activity, Zap, CheckCircle2 } from 'lucide-react';

const LocalPharmacyAIPerformance = () => {
  return (
    <div className="glass-card p-6 flex flex-col h-full border-t-4 border-t-purple-600 border-x border-b border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">Local AI Model (Demand Anomaly)</h3>
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Active Model v2.4
        </span>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Target size={16} className="text-purple-600" />
              Detection Accuracy
            </div>
            <span className="text-lg font-black text-purple-700">94.2%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '94.2%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Activity size={16} className="text-indigo-600" />
              Recall (True Positive Rate)
            </div>
            <span className="text-lg font-black text-indigo-700">91.8%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '91.8%' }}></div>
          </div>
        </div>

        <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl mt-4">
          <p className="text-xs text-purple-800 font-bold uppercase tracking-wider">Federated Learning Status</p>
          <p className="text-xs font-medium text-slate-700 mt-1 leading-relaxed">
            Local anomaly detection active. Data-local federated updates synced with central surveillance engine.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocalPharmacyAIPerformance;
