import React, { useState } from 'react';
import MapComponent from '../components/gis/MapComponent';
import FilterPanel from '../components/gis/FilterPanel';

const GISDashboard = () => {
  const [filters, setFilters] = useState({
    disease: 'all',
    severity: 'all',
    date: 'today'
  });

  return (
    <div className="relative w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-2rem)] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <MapComponent filters={filters} />
      
      {/* Floating Filter Panel */}
      <div className="absolute top-4 left-4 z-[400]">
        <FilterPanel filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};

export default GISDashboard;
