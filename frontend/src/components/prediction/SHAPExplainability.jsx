import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { HelpCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SHAPExplainability = () => {
  const data = {
    labels: [
      'Positive Lab Reports',
      'Recent Rainfall',
      'Targeted Med Sales',
      'Avg Temperature',
      'Humidity',
      'Daily Admissions',
      'District Population'
    ],
    datasets: [
      {
        label: 'SHAP Value (Impact on Output)',
        data: [0.35, 0.28, 0.15, -0.12, 0.08, 0.05, 0.02],
        backgroundColor: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return value > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';
        },
        borderRadius: 4,
      }
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Impact: ${context.raw}`
        }
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(0,0,0,0.05)' },
        title: { display: true, text: 'Feature Impact (SHAP Value)' }
      },
      y: { 
        grid: { display: false } 
      }
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Explainable AI (XAI)</h3>
          <p className="text-xs text-slate-500">Feature importance using SHAP values</p>
        </div>
        <div className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer" title="Shows which inputs pushed the risk score higher (red) or lower (blue).">
          <HelpCircle size={20} />
        </div>
      </div>
      <div className="h-64 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default SHAPExplainability;
