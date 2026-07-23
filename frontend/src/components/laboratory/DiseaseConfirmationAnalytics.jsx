import React from 'react';
import { Microscope, TrendingUp, BarChart2, CheckCircle2 } from 'lucide-react';

const DiseaseConfirmationAnalytics = () => {
  // Mock data based on requested metrics
  const positivityStats = [
    { label: 'Daily Positivity Rate', value: '-%', status: 'neutral' },
    { label: 'Weekly Positivity Trend', value: '-%', status: 'neutral' },
    { label: 'Test Volume Trend', value: '-%', status: 'neutral' },
  ];

  const topDiseases = [
    { name: 'Dengue', confirmed: 0, percentage: '0%' },
    { name: 'Influenza', confirmed: 0, percentage: '0%' },
    { name: 'Malaria', confirmed: 0, percentage: '0%' },
    { name: 'Typhoid', confirmed: 0, percentage: '0%' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Microscope size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Disease Confirmation Analytics</h2>
          <p className="text-sm text-slate-500">Automated insights from LIMS positive results</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {positivityStats.map((stat, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
            <span className="text-xs font-medium text-slate-500 mb-1">{stat.label}</span>
            <div className="flex items-center gap-2 mt-auto">
              <span className={`text-xl font-bold ${stat.status === 'up' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stat.value}
              </span>
              {stat.status === 'up' && <TrendingUp size={16} className="text-rose-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 mt-2">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-slate-400" />
          Top Confirmed Diseases
        </h3>
        <div className="space-y-3">
          {topDiseases.map((disease, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 w-24">{disease.name}</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${index === 0 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                  style={{ width: disease.percentage }}
                ></div>
              </div>
              <div className="flex flex-col text-right w-16">
                <span className="text-sm font-bold text-slate-700">{disease.confirmed}</span>
                <span className="text-[10px] text-slate-400">cases</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiseaseConfirmationAnalytics;
