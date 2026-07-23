import React from 'react';
import { BrainCircuit, Check, Clock } from 'lucide-react';

const recentPredictions = [
  { id: '1', time: '10:45 AM', disease: 'Dengue', confidence: 94, cluster: 'Cluster A', status: 'Pending Lab' },
  { id: '2', time: '10:12 AM', disease: 'Influenza', confidence: 91, cluster: 'Cluster C', status: 'Pending Lab' },
  { id: '3', time: '09:30 AM', disease: 'Malaria', confidence: 89, cluster: 'Cluster B', status: 'Confirmed' },
  { id: '4', time: '08:15 AM', disease: 'Typhoid', confidence: 76, cluster: 'Unclustered', status: 'Pending Lab' },
];

const RecentAIPredictions = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Recent AI Predictions</h2>
          <p className="text-sm text-slate-500 mt-1">Anonymized logs of the local inference engine</p>
        </div>
        <BrainCircuit className="text-primary-500" size={24} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-tl-lg">Prediction Time</th>
              <th className="px-4 py-3 font-semibold">Predicted Disease</th>
              <th className="px-4 py-3 font-semibold">Confidence</th>
              <th className="px-4 py-3 font-semibold">Symptom Cluster</th>
              <th className="px-4 py-3 font-semibold rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPredictions.map((pred, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{pred.time}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{pred.disease}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${pred.confidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {pred.confidence}%
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{pred.cluster}</td>
                <td className="px-4 py-3">
                  {pred.status === 'Confirmed' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full w-fit">
                      <Check size={14} /> Confirmed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded-full w-fit">
                      <Clock size={14} /> Pending Lab
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-4 italic text-center">
        * Patient names, addresses, and individual medical records are strictly obfuscated.
      </p>
    </div>
  );
};

export default RecentAIPredictions;
