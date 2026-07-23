import React from 'react';
import { Activity, TrendingUp, BarChart2, PieChart } from 'lucide-react';

const DiseaseTrendAnalytics = () => {
  // Mock data for analytics
  const trends = [
    { label: 'Daily Symptom Trends (Fever/Rash)', value: '+12%', status: 'up' },
    { label: 'Weekly Disease Trends (Dengue)', value: '+8%', status: 'up' },
    { label: 'Disease Growth Rate', value: '1.2x', status: 'warning' },
  ];

  const wardData = [
    { name: 'Pediatric', count: 45, percentage: '40%' },
    { name: 'General', count: 32, percentage: '28%' },
    { name: 'ICU', count: 12, percentage: '11%' },
    { name: 'OPD', count: 24, percentage: '21%' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Disease Trend Analytics</h2>
          <p className="text-sm text-slate-500">Real-time local epidemiological metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {trends.map((trend, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
            <span className="text-xs font-medium text-slate-500 mb-1">{trend.label}</span>
            <div className="flex items-center gap-2 mt-auto">
              <span className={`text-xl font-bold ${trend.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {trend.value}
              </span>
              {trend.status === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 mt-2">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <PieChart size={16} className="text-slate-400" />
          Ward-wise Trend Distribution
        </h3>
        <div className="space-y-3">
          {wardData.map((ward, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 w-24">{ward.name}</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: ward.percentage }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-slate-700 w-12 text-right">{ward.percentage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiseaseTrendAnalytics;
