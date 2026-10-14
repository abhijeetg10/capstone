import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hospital, Syringe, TestTube, MapPin, BrainCircuit, ArrowRight, ShieldCheck, Activity, Map, Landmark } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      {/* Abstract GIS Map Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-primary-600" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated heatmaps */}
          <circle cx="20%" cy="30%" r="150" fill="var(--color-primary-500)" opacity="0.3" filter="blur(60px)" />
          <circle cx="80%" cy="70%" r="200" fill="var(--color-secondary-500)" opacity="0.2" filter="blur(80px)" />
          <circle cx="50%" cy="50%" r="100" fill="var(--color-accent-500)" opacity="0.2" filter="blur(50px)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 pt-20">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-6 border border-primary-200">
              Islampur Municipal Corporation
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
              <span className="text-gradient">Local Health Administration</span> <br />
              Disease Surveillance Portal
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              An official privacy-preserving, AI-driven administration platform for simulated real-time monitoring and proactive healthcare decision-making in Islampur.
            </p>
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-primary-500/30 flex items-center gap-2 mx-auto lg:mx-0 transition-colors"
              >
                Explore Dashboard
                <ArrowRight size={20} />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Right Illustration */}
        <div className="flex-1 relative w-full h-[500px]">
          {/* Central AI Cloud */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-secondary-100 relative">
              <BrainCircuit size={64} className="text-secondary-600" />
              <div className="absolute inset-0 rounded-full border border-secondary-400 animate-ping opacity-20"></div>
            </div>
          </motion.div>

          {/* Floating Nodes */}
          <FloatingNode icon={<Hospital />} label="Hospital" delay={0.2} position="top-10 left-10 lg:left-20" color="text-blue-600" bg="bg-blue-50" />
          <FloatingNode icon={<TestTube />} label="Laboratory" delay={0.4} position="bottom-20 left-4 lg:left-10" color="text-purple-600" bg="bg-purple-50" />
          <FloatingNode icon={<Syringe />} label="Pharmacy" delay={0.6} position="top-20 right-4 lg:right-10" color="text-green-600" bg="bg-green-50" />
          <FloatingNode icon={<MapPin />} label="GIS" delay={0.8} position="bottom-32 right-10 lg:right-20" color="text-rose-600" bg="bg-rose-50" />

          {/* Connecting Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.5, delay: 1 }}
              d="M 120 80 Q 250 150 50% 50%" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" strokeDasharray="5,5" 
            />
             <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.5, delay: 1 }}
              d="M 80 400 Q 250 350 50% 50%" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" strokeDasharray="5,5" 
            />
             <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.5, delay: 1 }}
              d="M 400 120 Q 350 200 50% 50%" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" strokeDasharray="5,5" 
            />
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 1.5, delay: 1 }}
              d="M 450 350 Q 350 350 50% 50%" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" strokeDasharray="5,5" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

const FloatingNode = ({ icon, label, delay, position, color, bg }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`absolute ${position} z-30`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-2"
      >
        <div className={`w-16 h-16 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-lg border border-white/50 backdrop-blur-sm`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-white/80 px-2 py-1 rounded-full shadow-sm">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default Hero;
