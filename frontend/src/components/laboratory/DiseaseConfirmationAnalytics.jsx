import React, { useState, useEffect } from 'react';
import { Microscope, TrendingUp, BarChart2, CheckCircle2 } from 'lucide-react';

const DiseaseConfirmationAnalytics = () => {
  const [positivityStats, setPositivityStats] = useState([
    { label: 'Daily Positivity Rate', value: '28.5%', status: 'up' },
    { label: 'Weekly Positivity Trend', value: '+14.2%', status: 'up' },
    { label: 'Lab Test Volume', value: '257 / day', status: 'normal' },
  ]);

  const [topDiseases, setTopDiseases] = useState([
    { name: 'Dengue Virus', confirmed: 14, percentage: '35%' },
    { name: 'Leptospirosis', confirmed: 12, percentage: '30%' },
    { name: 'Salmonella (Typhoid)', confirmed: 8, percentage: '20%' },
    { name: 'Malaria (Falciparum)', confirmed: 6, percentage: '15%' },
  ]);

  useEffect(() => {
    const fetchLabData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/erd/laboratory/records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          if (records.length > 0) {
            const positiveRecords = records.filter(r => r.testResult === 'Positive');
            const total = records.length;
            const posRate = Math.round((positiveRecords.length / total) * 100);

            // Group by pathogen/disease
            const pathogenCounts = {};
            positiveRecords.forEach(r => {
              const p = r.pathogen || 'Unknown Pathogen';
              pathogenCounts[p] = (pathogenCounts[p] || 0) + 1;
            });

            const sorted = Object.keys(pathogenCounts).map(p => ({
              name: p,
              confirmed: pathogenCounts[p],
              percentage: `${Math.round((pathogenCounts[p] / (positiveRecords.length || 1)) * 100)}%`
            })).sort((a, b) => b.confirmed - a.confirmed);

            setPositivityStats([
              { label: 'Lab Positivity Rate', value: `${posRate}%`, status: posRate > 20 ? 'up' : 'normal' },
              { label: 'Positive Pathogens', value: `${positiveRecords.length} Confirmed`, status: 'up' },
              { label: 'Total LIMS Logs', value: `${total} Tests`, status: 'normal' },
            ]);

            if (sorted.length > 0) {
              setTopDiseases(sorted.slice(0, 4));
            }
          }
        }
      } catch (e) {
        console.error("Error fetching lab analytics:", e);
      }
    };
    fetchLabData();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 h-full flex flex-col font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-200">
          <Microscope size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">Disease Confirmation Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">Automated insights from LIMS positive specimen results</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {positivityStats.map((stat, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xl font-black ${stat.status === 'up' ? 'text-rose-600' : 'text-emerald-700'}`}>
                {stat.value}
              </span>
              {stat.status === 'up' && <TrendingUp size={16} className="text-rose-500" />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 mt-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-teal-600" />
          Top Confirmed Pathogens & Diseases
        </h3>
        <div className="space-y-3.5">
          {topDiseases.map((disease, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 w-36 truncate">{disease.name}</span>
              <div className="flex-1 mx-4 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full rounded-full ${index === 0 ? 'bg-rose-500' : index === 1 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                  style={{ width: disease.percentage }}
                ></div>
              </div>
              <div className="flex flex-col text-right w-16">
                <span className="text-xs font-black text-slate-900">{disease.confirmed}</span>
                <span className="text-[10px] font-semibold text-slate-400">specimens</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiseaseConfirmationAnalytics;
