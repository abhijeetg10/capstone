import React from 'react';
import { Hospital, TestTube, Pill, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AggregatedStatsOverview = () => {
  const aggregatedData = [
    {
      id: 'hospitals',
      title: 'Total Admissions Today',
      icon: <Hospital size={24} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      total: 0,
      breakdown: [
        { label: 'Dengue', value: 0, percentage: '0%' },
        { label: 'Malaria', value: 0, percentage: '0%' },
        { label: 'Influenza', value: 0, percentage: '0%' },
        { label: 'Other', value: 0, percentage: '0%' }
      ]
    },
    {
      id: 'labs',
      title: 'Lab Positivity Today',
      icon: <TestTube size={24} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      total: 0,
      breakdown: [
        { label: 'Dengue Positives', value: 0, percentage: '0%' },
        { label: 'Malaria Positives', value: 0, percentage: '0%' },
        { label: 'Influenza Positives', value: 0, percentage: '0%' }
      ]
    },
    {
      id: 'pharmacy',
      title: 'Key Medicines Sold Today',
      icon: <Pill size={24} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      total: 0,
      breakdown: [
        { label: 'Antipyretics (Fever)', value: 0, percentage: '0%' },
        { label: 'Antimalarials', value: 0, percentage: '0%' },
        { label: 'Antibiotics', value: 0, percentage: '0%' }
      ]
    }
  ];

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <TrendingUp className="text-slate-700" size={24} />
         <h2 className="text-xl font-bold text-slate-800">Aggregated Administration Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {aggregatedData.map((section, idx) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 flex flex-col h-full border-t-4"
            style={{ borderTopColor: section.id === 'hospitals' ? '#10b981' : section.id === 'labs' ? '#8b5cf6' : '#f59e0b' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${section.bg} ${section.color}`}>
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">{section.title}</h3>
                <p className="text-2xl font-black text-slate-900">{section.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {section.breakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${section.id === 'hospitals' ? 'bg-emerald-500' : section.id === 'labs' ? 'bg-purple-500' : 'bg-amber-500'}`}
                      style={{ width: item.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AggregatedStatsOverview;
