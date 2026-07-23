import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const warnings = [
  { 
    id: 1, 
    level: 'high', 
    title: 'High Probability Dengue Cluster Detected', 
    message: 'AI has detected an unusual increase in patients showing symptoms consistent with Dengue (Fever, Rash, Low Platelets).',
    time: 'Just now'
  },
  { 
    id: 2, 
    level: 'medium', 
    title: 'Possible Influenza Outbreak Emerging', 
    message: 'A growing cluster of 24 patients presenting with severe cough and fever over the last 48 hours.',
    time: '2 hours ago'
  },
  { 
    id: 3, 
    level: 'low', 
    title: 'Increase in Gastrointestinal Symptoms', 
    message: 'Slight uptick in patients reporting vomiting and diarrhea. Monitoring closely for potential localized food/water contamination.',
    time: '5 hours ago'
  }
];

const getAlertStyles = (level) => {
  switch(level) {
    case 'high': return { icon: <AlertTriangle size={20} className="text-rose-600" />, bg: 'bg-rose-50 border-rose-200' };
    case 'medium': return { icon: <AlertCircle size={20} className="text-amber-600" />, bg: 'bg-amber-50 border-amber-200' };
    case 'low': return { icon: <Info size={20} className="text-blue-600" />, bg: 'bg-blue-50 border-blue-200' };
    default: return { icon: <Info size={20} className="text-slate-600" />, bg: 'bg-slate-50 border-slate-200' };
  }
};

const EarlyWarningPanel = () => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">AI Early Warning Feed</h2>
        <p className="text-sm text-slate-500 mt-1">Automated alerts based on local symptom clustering</p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {warnings.map((warning, index) => {
          const styles = getAlertStyles(warning.level);
          return (
            <motion.div 
              key={warning.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${styles.bg} flex gap-4 items-start`}
            >
              <div className="mt-0.5">{styles.icon}</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{warning.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{warning.message}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-2 uppercase tracking-wide">{warning.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EarlyWarningPanel;
