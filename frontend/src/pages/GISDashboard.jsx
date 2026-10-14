import React, { useState } from 'react';
import MapComponent from '../components/gis/MapComponent';
import FilterPanel from '../components/gis/FilterPanel';
import { MapPin, ShieldAlert, Navigation, Layers, Activity, Eye, Zap, Flame } from 'lucide-react';

const GISDashboard = () => {
  const [filters, setFilters] = useState({
    disease: 'all',
    severity: 'all',
    date: 'today',
    showHeatmap: true,
    showHospitals: true,
    showBoundaries: true
  });

  const [predictions, setPredictions] = useState([]);

  React.useEffect(() => {
    fetch('http://localhost:5000/api/ai/latest-predictions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPredictions(data.data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const wardSummary = predictions.map(p => ({
    name: p.zone_id,
    risk: p.risk_category,
    score: Math.round(p.outbreak_probability * 100),
    cases: 0,
    pathogen: 'Simulated Outbreak',
    trend: new Date(p.prediction_date).toLocaleDateString(),
    color: p.risk_category === 'CRITICAL' ? 'text-rose-600' : p.risk_category === 'HIGH' ? 'text-rose-500' : p.risk_category === 'MODERATE' ? 'text-amber-500' : 'text-emerald-500',
    bg: p.risk_category === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : p.risk_category === 'HIGH' ? 'bg-rose-50 border-rose-200' : p.risk_category === 'MODERATE' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
  }));

  return (
    <div className="relative w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-2rem)] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 font-sans">
      {/* Map Renderer */}
      <MapComponent filters={filters} onSelectWard={setSelectedWard} predictions={predictions} />

      {/* Floating Top Header Banner */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl shadow-xl text-white pointer-events-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md">
            <Flame size={22} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">Ishwarpur City Spatial Epidemic GIS Radar</h1>
              <span className="bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Predictions
              </span>
            </div>
            <p className="text-xs text-slate-300">Ishwarpur Municipal Wards • Frozen MLP Model Inference</p>
          </div>
        </div>
      </div>

      {/* Floating Hotspot Intelligence & Ward Summary Sidebar (Right Side) */}
      <div className="absolute top-24 right-4 z-[400] max-w-sm w-full hidden md:block space-y-3 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600" /> Ward Hotspot Surveillance
            </h3>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
              5 Zones Monitored
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {wardSummary.map((ward, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${ward.bg} ${selectedWard === ward.name ? 'ring-2 ring-rose-500' : ''}`}
                onClick={() => setSelectedWard(ward.name)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{ward.name}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${ward.risk === 'CRITICAL' ? 'bg-rose-600 text-white' : ward.risk === 'HIGH' ? 'bg-rose-500 text-white' : ward.risk === 'MODERATE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {ward.risk}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>Prob: <strong className="text-slate-900">{ward.score}%</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                  <span>Date: {ward.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Legend Overlay */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-lg text-white space-y-2">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Map Legend & Intensity Scale</div>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
            <div className="bg-rose-500/30 border border-rose-500 text-rose-300 p-1.5 rounded-xl">
              Critical (&gt;75 Score)
            </div>
            <div className="bg-amber-500/30 border border-amber-500 text-amber-300 p-1.5 rounded-xl">
              Elevated (40-75)
            </div>
            <div className="bg-emerald-500/30 border border-emerald-500 text-emerald-300 p-1.5 rounded-xl">
              Controlled (&lt;40)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISDashboard;
