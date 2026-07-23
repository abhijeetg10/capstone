import React, { useState, useEffect } from 'react';
import { Cpu, CloudRain, Thermometer, Droplets } from 'lucide-react';

const InputPanel = ({ onPredict, isPredicting }) => {
  const [isFetchingWeather, setIsFetchingWeather] = useState(true);
  const [params, setParams] = useState({
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    labReports: 120,
    medicineSales: 450,
    population: 50000,
    admissions: 15
  });

  useEffect(() => {
    // Fetch live weather data for Islampur, Maharashtra (Lat: 17.0410, Lng: 74.2433)
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.0410&longitude=74.2433&current=temperature_2m,relative_humidity_2m,precipitation');
        const data = await res.json();
        setParams(prev => ({
          ...prev,
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          rainfall: data.current.precipitation
        }));
      } catch (err) {
        console.error("Failed to fetch weather data", err);
      } finally {
        setIsFetchingWeather(false);
      }
    };
    fetchWeather();
  }, []);

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Model Parameters</h3>
      
      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Live Weather Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Environmental Data (Islampur)</span>
            {isFetchingWeather ? (
              <span className="text-xs font-semibold text-amber-500 animate-pulse flex items-center gap-1">Fetching...</span>
            ) : (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live 📡
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
              <Thermometer size={18} className="text-rose-500 mb-1" />
              <span className="text-xs text-slate-500">Temp</span>
              <span className="font-bold text-slate-700">{params.temperature}°C</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
              <Droplets size={18} className="text-blue-500 mb-1" />
              <span className="text-xs text-slate-500">Humidity</span>
              <span className="font-bold text-slate-700">{params.humidity}%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
              <CloudRain size={18} className="text-indigo-500 mb-1" />
              <span className="text-xs text-slate-500">Rainfall</span>
              <span className="font-bold text-slate-700">{params.rainfall}mm</span>
            </div>
          </div>
        </div>

        {/* Manual Inputs */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual Operational Data</span>
          {Object.entries({
            labReports: { label: 'Positive Lab Reports', max: 500 },
            medicineSales: { label: 'Targeted Med Sales', max: 2000 },
            population: { label: 'District Population', max: 200000 },
            admissions: { label: 'Daily Admissions', max: 100 }
          }).map(([key, config]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1 text-slate-600 font-semibold">
                <span>{config.label}</span>
                <span className="text-primary-600">{params[key]}</span>
              </div>
              <input 
                type="range" 
                name={key}
                min="0" 
                max={config.max} 
                value={params[key]}
                onChange={handleChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onPredict(params)}
        disabled={isPredicting || isFetchingWeather}
        className={`w-full mt-6 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all shadow-lg ${
          (isPredicting || isFetchingWeather)
            ? 'bg-primary-100 text-primary-400 cursor-not-allowed shadow-none' 
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30'
        }`}
      >
        <Cpu size={20} className={isPredicting ? 'animate-pulse' : ''} />
        {isPredicting ? 'Running Global Inference...' : 'Predict Outbreak Risk'}
      </button>
    </div>
  );
};

export default InputPanel;

