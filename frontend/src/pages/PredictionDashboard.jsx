import React, { useState } from 'react';
import InputPanel from '../components/prediction/InputPanel';
import OutputPanel from '../components/prediction/OutputPanel';
import SHAPExplainability from '../components/prediction/SHAPExplainability';
import { TrendingUp, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const PredictionDashboard = () => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const handlePredict = (data) => {
    setIsPredicting(true);
    // Simulate AI inference delay
    setTimeout(() => {
      setPredictionResult({
        riskScore: 84,
        confidence: 92,
        disease: 'Dengue Fever',
        hotspot: 'North Ward District',
        severity: 'High',
        timestamp: new Date().toLocaleTimeString(),
        recommendedActions: [
          'Schedule targeted vector-control activities immediately',
          'Increase Dengue NS1 testing capacity in North Ward',
          'Deploy emergency medical supplies to Ward clinics',
          'Initiate public awareness campaigns on stagnant water'
        ]
      });
      setIsPredicting(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp className="text-primary-600" />
            AI Outbreak Prediction Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">Multi-modal global model inference</p>
        </div>

        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          Model Status: 
          <div className="flex items-center gap-1 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Online
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <InputPanel onPredict={handlePredict} isPredicting={isPredicting} />
        </div>
        
        <div className="lg:col-span-8 flex flex-col gap-6">
          {predictionResult ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <OutputPanel result={predictionResult} />
            </motion.div>
          ) : (
            <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 h-48 flex flex-col items-center justify-center text-slate-400">
              <Cpu size={48} className="mb-4 opacity-50" />
              <p>Enter parameters and run prediction to view results</p>
            </div>
          )}

          {predictionResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
               <SHAPExplainability />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionDashboard;
