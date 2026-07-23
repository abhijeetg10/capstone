import React from 'react';
import FLAnimationSVG from '../components/network/FLAnimationSVG';
import { Network } from 'lucide-react';

const NetworkDashboard = () => {
  return (
    <div className="bg-slate-900 rounded-3xl min-h-[calc(100vh-120px)] p-6 lg:p-12 relative overflow-hidden flex flex-col shadow-2xl border border-slate-800">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-primary-600/20 blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <Network className="text-primary-400" size={32} />
            Federated Learning Network
          </h1>
          <p className="text-slate-300 mt-2 text-lg">Decentralized training with encrypted aggregation</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-emerald-400 text-sm font-bold tracking-wider uppercase">Live Training</span>
        </div>
      </div>
      
      <div className="flex-1 w-full flex items-center justify-center relative z-10">
        <FLAnimationSVG />
      </div>
    </div>
  );
};

export default NetworkDashboard;
