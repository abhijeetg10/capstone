import React from 'react';
import { Filter, SlidersHorizontal, Sparkles } from 'lucide-react';

const FilterPanel = ({ filters, setFilters }) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-xl w-72 pointer-events-auto space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="p-1.5 rounded-xl bg-primary-50 text-primary-600">
            <Filter size={16} />
          </div>
          <h3 className="font-black text-sm">Spatial GIS Filters</h3>
        </div>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          Realtime
        </span>
      </div>
      
      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Target Disease</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.disease}
            onChange={(e) => setFilters({...filters, disease: e.target.value})}
          >
            <option value="all">All Outbreak Diseases</option>
            <option value="leptospirosis">Leptospirosis (Monsoon)</option>
            <option value="dengue">Dengue Virus (NS1)</option>
            <option value="gastroenteritis">Gastroenteritis (Salmonella)</option>
            <option value="malaria">Malaria (Falciparum)</option>
            <option value="typhoid">Typhoid (Widal)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Severity & Risk Score</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.severity}
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">Critical Surge (&gt;75 Score)</option>
            <option value="medium">Elevated Risk (40-75 Score)</option>
            <option value="low">Low Risk (&lt;40 Score)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Time Horizon</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
          >
            <option value="today">Today (Simulated Real-time Ingestion)</option>
            <option value="week">Past 7 Days (Monsoon Surge)</option>
            <option value="month">Past 30 Days (Historical Baseline)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
