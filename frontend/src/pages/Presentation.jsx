import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import all major views
import DashboardOverview from './DashboardOverview';
import GISDashboard from './GISDashboard';
import HospitalDashboard from './HospitalDashboard';
import LabDashboard from './LabDashboard';
import PharmacyDashboard from './PharmacyDashboard';
import PredictionDashboard from './PredictionDashboard';
import NetworkDashboard from './NetworkDashboard';
import AlertDashboard from './AlertDashboard';

const slides = [
  { id: 'overview', component: <DashboardOverview />, title: 'Global Operations Center' },
  { id: 'gis', component: <GISDashboard />, title: 'Simulated Real-time Geospatial Tracking' },
  { id: 'hospital', component: <HospitalDashboard />, title: 'Hospital Edge Node' },
  { id: 'lab', component: <LabDashboard />, title: 'Laboratory Edge Node' },
  { id: 'pharmacy', component: <PharmacyDashboard />, title: 'Pharmacy Edge Node' },
  { id: 'prediction', component: <PredictionDashboard />, title: 'AI Prediction Engine' },
  { id: 'network', component: <NetworkDashboard />, title: 'Federated Learning Network' },
  { id: 'alerts', component: <AlertDashboard />, title: 'Emergency Alert Broadcast' }
];

const SLIDE_DURATION = 8000; // 8 seconds per slide

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-900 overflow-hidden flex flex-col relative text-white font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Auto-Demo Mode</h2>
          <h1 className="text-2xl font-black">{slides[currentSlide].title}</h1>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
              {i === currentSlide && (
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                  className="h-full bg-primary-500"
                />
              )}
              {i < currentSlide && <div className="h-full bg-slate-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div className="flex-1 w-full h-full pt-24 pb-6 px-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              filter: 'blur(0px)',
              transition: { duration: 1.2, ease: "easeOut" }
            }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.8 } }}
            className="w-full h-full bg-slate-50 text-slate-900 rounded-3xl overflow-hidden shadow-2xl p-6 relative border border-slate-700"
          >
            {/* Inner Auto-Zoom Effect (WWDC style slowly zooming while viewing) */}
            <motion.div
               animate={{ scale: [1, 1.02] }}
               transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
               className="w-full h-full overflow-hidden"
            >
              {slides[currentSlide].component}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exit Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="absolute bottom-6 right-6 z-50 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md text-slate-300 px-6 py-2 rounded-full font-bold transition-colors shadow-lg border border-slate-600"
      >
        Exit Presentation
      </button>
    </div>
  );
};

export default Presentation;
