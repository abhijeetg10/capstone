import React from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const diseasesData = [
  { disease: 'Dengue Fever', total: 342, confirmed: 180, suspected: 162, trend: 'up', trendVal: '+15%', prediction: 45, status: 'Outbreak Warning' },
  { disease: 'Malaria', total: 210, confirmed: 95, suspected: 115, trend: 'down', trendVal: '-5%', prediction: 12, status: 'Stable' },
  { disease: 'Influenza', total: 530, confirmed: 310, suspected: 220, trend: 'up', trendVal: '+8%', prediction: 60, status: 'Monitoring' },
  { disease: 'Cholera', total: 45, confirmed: 15, suspected: 30, trend: 'flat', trendVal: '0%', prediction: 3, status: 'Stable' },
  { disease: 'Typhoid', total: 120, confirmed: 80, suspected: 40, trend: 'up', trendVal: '+2%', prediction: 10, status: 'Stable' }
];

const getStatusColor = (status) => {
  if (status === 'Outbreak Warning') return 'text-rose-600 bg-rose-50 border-rose-200';
  if (status === 'Monitoring') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
};

const getTrendIcon = (trend) => {
  if (trend === 'up') return <TrendingUp size={16} className="text-rose-500" />;
  if (trend === 'down') return <TrendingDown size={16} className="text-emerald-500" />;
  return <Minus size={16} className="text-slate-400" />;
};

const DiseaseSurveillanceTracker = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={20} />
            Comprehensive Disease Surveillance
          </h2>
          <p className="text-sm text-slate-500 mt-1">Simulated real-time tracking of confirmed vs suspected cases & outbreak alerts</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 rounded-t-lg">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Disease Cluster</th>
              <th className="px-4 py-3 font-semibold">Total Cases</th>
              <th className="px-4 py-3 font-semibold text-emerald-600">Confirmed</th>
              <th className="px-4 py-3 font-semibold text-amber-600">Suspected (Lab)</th>
              <th className="px-4 py-3 font-semibold">7-Day Trend</th>
              <th className="px-4 py-3 font-semibold text-purple-600">Predicted (Tmrw)</th>
              <th className="px-4 py-3 font-semibold rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody>
            {diseasesData.map((data, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800">{data.disease}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{data.total}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{data.confirmed}</td>
                <td className="px-4 py-3 font-semibold text-amber-600">{data.suspected}</td>
                <td className="px-4 py-3 flex items-center gap-2 font-medium">
                  {getTrendIcon(data.trend)} {data.trendVal}
                </td>
                <td className="px-4 py-3 font-bold text-purple-600">~{data.prediction}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(data.status)}`}>
                    {data.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        Continuously monitoring incoming patient records...
      </div>
    </div>
  );
};

export default DiseaseSurveillanceTracker;
