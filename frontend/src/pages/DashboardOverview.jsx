import React from 'react';
import StatCards from '../components/dashboard/StatCards';
import Charts from '../components/dashboard/Charts';
import StatusPanel from '../components/dashboard/StatusPanel';
import AggregatedStatsOverview from '../components/dashboard/AggregatedStatsOverview';

const DashboardOverview = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Global Operations Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">System overview and aggregated metrics</p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          System Status: 
          <div className="flex items-center gap-1 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Active
          </div>
        </div>
      </div>
      
      <AggregatedStatsOverview />
      <StatCards />
      <Charts />
      <StatusPanel />
    </div>
  );
};

export default DashboardOverview;
