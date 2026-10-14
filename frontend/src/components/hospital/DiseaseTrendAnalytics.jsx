import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DiseaseTrendAnalytics = () => {
  const [timeframe, setTimeframe] = useState('week');

  // Dummy time-series data
  const dataMap = {
    day: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      cases: [5, 2, 12, 25, 30, 18, 10],
      trend: '+12%',
      isOutbreak: false
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      cases: [45, 52, 38, 65, 89, 110, 145], // Noticeable spike at the end
      trend: '+45%',
      isOutbreak: true
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      cases: [150, 180, 140, 320],
      trend: '+22%',
      isOutbreak: true
    }
  };

  const currentData = dataMap[timeframe];

  const chartData = {
    labels: currentData.labels,
    datasets: [
      {
        label: 'Reported Cases',
        data: currentData.cases,
        borderColor: currentData.isOutbreak ? 'rgb(225, 29, 72)' : 'rgb(59, 130, 246)', // rose-600 or blue-500
        backgroundColor: currentData.isOutbreak ? 'rgba(225, 29, 72, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: currentData.isOutbreak ? 'rgb(225, 29, 72)' : 'rgb(59, 130, 246)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
      x: { grid: { display: false } },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentData.isOutbreak ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Time-Series Trends</h2>
            <p className="text-sm text-slate-500">Historical case volume & outbreak trajectory</p>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {['day', 'week', 'month'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                timeframe === tf ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Last {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Growth Rate</p>
            <p className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {currentData.trend}
              {currentData.trend.startsWith('+') ? (
                <TrendingUp size={18} className="text-rose-500" />
              ) : (
                <TrendingDown size={18} className="text-emerald-500" />
              )}
            </p>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center justify-between ${currentData.isOutbreak ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
           <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <p className={`text-xl font-bold ${currentData.isOutbreak ? 'text-rose-600' : 'text-emerald-600'}`}>
              {currentData.isOutbreak ? 'Outbreak Detected' : 'Stable'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default DiseaseTrendAnalytics;
