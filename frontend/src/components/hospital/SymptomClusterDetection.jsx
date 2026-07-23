import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

const clusters = [];

const getConfidenceColor = (confidence) => {
  if (confidence > 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (confidence > 80) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

const SymptomClusterDetection = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="text-primary-600" size={20} />
            AI Symptom Cluster Detection
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time symptom clustering from incoming HIS records</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 rounded-t-lg">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Cluster ID</th>
              <th className="px-4 py-3 font-semibold">Common Symptoms</th>
              <th className="px-4 py-3 font-semibold">Patients Count</th>
              <th className="px-4 py-3 font-semibold">Predicted Disease</th>
              <th className="px-4 py-3 font-semibold rounded-tr-lg">AI Confidence</th>
            </tr>
          </thead>
          <tbody>
            {clusters.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium mt-2">No symptom clusters detected.</p>
                    <p className="text-xs">Awaiting sufficient HIS data for analysis.</p>
                  </div>
                </td>
              </tr>
            ) : (
              clusters.map((cluster, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{cluster.id}</td>
                <td className="px-4 py-3 text-slate-500">{cluster.symptoms}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{cluster.patients}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                  {cluster.confidence > 90 && <ShieldAlert size={14} className="text-rose-500" />}
                  {cluster.disease}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(cluster.confidence)}`}>
                    {cluster.confidence}%
                  </span>
                </td>
              </tr>
              ))
            )}
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

export default SymptomClusterDetection;
