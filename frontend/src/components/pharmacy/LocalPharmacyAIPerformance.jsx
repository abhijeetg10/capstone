import React from 'react';
import { Target, Activity, Zap } from 'lucide-react';

const LocalPharmacyAIPerformance = () => {
  return (
    <div className="glass-card p-6 flex flex-col h-full border-t-4 border-t-primary-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Local AI Model (Demand Anomaly)</h3>
        <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          <Zap size={12} className="text-slate-400" />
          Awaiting Training
        </span>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Target size={16} className="text-slate-400" />
              Detection Accuracy
            </div>
            <span className="text-lg font-black text-slate-800">-</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-slate-300 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Activity size={16} className="text-slate-400" />
              Recall (True Positive Rate)
            </div>
            <span className="text-lg font-black text-slate-800">-</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-slate-300 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4">
          <p className="text-xs text-slate-500 font-medium">Model Status</p>
          <p className="text-sm font-bold text-slate-800 mt-1">Insufficient data to evaluate pattern recognition. Awaiting robust PMS sync.</p>
        </div>
      </div>
    </div>
  );
};

export default LocalPharmacyAIPerformance;
