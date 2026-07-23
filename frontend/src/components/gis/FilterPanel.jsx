import React from 'react';
import { Filter } from 'lucide-react';

const FilterPanel = ({ filters, setFilters }) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-lg w-64">
      <div className="flex items-center gap-2 mb-4 text-slate-800">
        <Filter size={18} />
        <h3 className="font-bold">Map Filters</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Disease Type</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.disease}
            onChange={(e) => setFilters({...filters, disease: e.target.value})}
          >
            <option value="all">All Diseases</option>
            <option value="typhoid">Typhoid</option>
            <option value="dengue">Dengue</option>
            <option value="influenza">Influenza</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Severity</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.severity}
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
          >
            <option value="all">All Levels</option>
            <option value="high">High Risk (Red)</option>
            <option value="medium">Medium Risk (Orange)</option>
            <option value="low">Low Risk (Green)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Date Range</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
          >
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
