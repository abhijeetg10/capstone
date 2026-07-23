import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = () => {
  // Dummy Data
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Cases',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Predicted Cases',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(139, 92, 246)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const doughnutData = {
    labels: ['Influenza', 'Typhoid', 'Dengue', 'Malaria', 'Others'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#64748b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    },
  };

  const barData = {
    labels: ['North', 'South', 'East', 'West', 'Central'],
    datasets: [
      {
        label: 'Participating Hospitals',
        data: [0, 0, 0, 0, 0],
        backgroundColor: '#22c55e', // emerald-500
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-2 glass-card p-6"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4">Case Trends & Predictions</h3>
        <div className="h-[300px]">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </motion.div>

      {/* Doughnut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4">Disease Distribution</h3>
        <div className="h-[300px]">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="lg:col-span-3 glass-card p-6"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4">Hospital Participation by Region</h3>
        <div className="h-[250px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </motion.div>
    </div>
  );
};

export default Charts;
