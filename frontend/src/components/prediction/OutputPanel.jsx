import React from 'react';
import { AlertTriangle, MapPin, CheckCircle, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const OutputPanel = ({ result }) => {
  return (
    <div className="glass-card p-6 overflow-hidden relative border border-slate-200/50 shadow-xl bg-white/70 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-[80px] -z-10 opacity-50"></div>
      
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 text-gradient">AI Inference Results</h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Generated: {result.timestamp}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
          <div className="bg-white/80 border border-slate-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-full ${result.severity === 'High' ? 'bg-rose-100 text-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'bg-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Predicted Disease</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{result.disease}</p>
              <p className={`text-xs font-bold mt-1 ${result.severity === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>Severity: {result.severity}</p>
            </div>
          </div>

          <div className="bg-white/80 border border-slate-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <MapPin size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Predicted Hotspot</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">{result.hotspot}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-4">
          <div className="bg-white/80 border border-slate-100 rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-full bg-amber-100 text-amber-600 z-10 shadow-[0_0_15px_rgba(217,119,6,0.2)]">
              <Activity size={28} />
            </div>
            <div className="z-10 w-full">
              <p className="text-sm font-medium text-slate-500">Outbreak Risk Score</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-slate-800">{result.riskScore}</p>
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
            </div>
            {/* Background progress bar simulation */}
            <div 
              className={`absolute left-0 bottom-0 h-1.5 bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000 ease-out`} 
              style={{ width: `${result.riskScore}%` }}
            ></div>
          </div>

          <div className="bg-white/80 border border-slate-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Model Confidence</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{result.confidence}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recommended Actions Section */}
      {result.recommendedActions && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="text-primary-600" size={20} />
            <h4 className="font-bold text-slate-800">Recommended Preventive Actions</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3 bg-primary-50/50 p-3 rounded-xl border border-primary-100/50 hover:bg-primary-50 transition-colors">
                <div className="mt-0.5 bg-primary-100 rounded-full p-1 text-primary-600">
                  <ArrowRight size={14} />
                </div>
                <span className="text-sm text-slate-700 font-medium">{action}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OutputPanel;
