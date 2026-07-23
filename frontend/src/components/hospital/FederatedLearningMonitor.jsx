import React, { useState, useEffect } from 'react';
import { Server, Zap, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const FederatedLearningMonitor = () => {
  // Simulate 2 hour countdown
  const [timeLeft, setTimeLeft] = useState(7200); 

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"></div>
      
      <div className="mb-6 z-10 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server size={20} className="text-primary-400" />
            Federated Learning Monitor
          </h2>
          <p className="text-sm text-slate-400 mt-1">Automated privacy-preserving training</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          Connected to FL Server
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 z-10">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Current Training Round</p>
          <p className="text-xl font-bold text-white">-</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Last Synchronization</p>
          <p className="text-xl font-bold text-white">Pending</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Global Model Version</p>
          <p className="text-xl font-bold text-primary-400">-</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Local Model Version</p>
          <p className="text-xl font-bold text-emerald-400">-</p>
        </div>
      </div>

      <div className="mt-auto bg-slate-900/80 rounded-xl p-5 border border-slate-700 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clock size={16} className="text-amber-400" />
            Next Scheduled Training
          </div>
          <span className="text-amber-400 font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
        
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <motion.div 
            className="bg-amber-400 h-1.5 rounded-full" 
            initial={{ width: '0%' }}
            animate={{ width: `${((7200 - timeLeft) / 7200) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          The background scheduler will automatically train the local model and securely aggregate weights with the global server via Flower.
        </p>
      </div>
    </div>
  );
};

export default FederatedLearningMonitor;
