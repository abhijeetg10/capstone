import React from 'react';
import { Users, MapPin, Activity } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const DemographicAnalytics = () => {
  // Dummy Data for Gender
  const genderData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [
      {
        data: [58, 40, 2],
        backgroundColor: ['#3b82f6', '#ec4899', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const genderOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
    },
  };

  // Dummy Data for Age
  const ageData = {
    labels: ['0-12', '13-30', '31-50', '50+'],
    datasets: [
      {
        label: 'Patients',
        data: [150, 320, 410, 280],
        backgroundColor: '#8b5cf6', // purple-500
        borderRadius: 4,
      },
    ],
  };

  const ageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, display: false },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    },
  };

  // Dummy Data for Area/Geographic Distribution
  const areaData = [
    { name: 'North Ward', cases: 342, trend: '+12%' },
    { name: 'South District', cases: 280, trend: '+5%' },
    { name: 'East Side', cases: 195, trend: '-2%' },
    { name: 'West End', cases: 140, trend: '-8%' },
    { name: 'Central City', cases: 98, trend: '0%' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Demographic Analysis</h2>
          <p className="text-sm text-slate-500">Gender, Age, and Area-wise distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Gender Distribution */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity size={14} /> Gender Distribution
          </h3>
          <div className="h-32">
            <Doughnut data={genderData} options={genderOptions} />
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity size={14} /> Age Groups
          </h3>
          <div className="h-32">
            <Bar data={ageData} options={ageOptions} />
          </div>
        </div>
      </div>

      {/* Area-wise Geographic Distribution */}
      <div className="flex-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          <MapPin size={14} /> Geographic Hotspots
        </h3>
        <div className="space-y-3">
          {areaData.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-sm font-medium text-slate-700">{area.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-800">{area.cases} cases</span>
                <span className={`text-xs font-bold w-12 text-right ${
                  area.trend.startsWith('+') ? 'text-rose-500' : 
                  area.trend.startsWith('-') ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  {area.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemographicAnalytics;
