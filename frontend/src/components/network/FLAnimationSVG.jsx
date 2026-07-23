import React from 'react';
import { motion } from 'framer-motion';

const FLAnimationSVG = () => {
  const nodes = [
    { id: 1, cx: 150, cy: 400, label: 'Hospital North' },
    { id: 2, cx: 350, cy: 450, label: 'Clinic East' },
    { id: 3, cx: 650, cy: 450, label: 'Lab South' },
    { id: 4, cx: 850, cy: 400, label: 'Pharma West' },
  ];

  const server = { cx: 500, cy: 100 };

  // Common variants
  const packetUplink = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: [0, 1],
      opacity: [0, 1, 0],
      transition: { duration: 2, repeat: Infinity, ease: "linear", delay: 1 }
    }
  };

  const packetDownlink = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: [1, 0],
      opacity: [0, 1, 0],
      transition: { duration: 2, repeat: Infinity, ease: "linear", delay: 3 }
    }
  };

  const pulseCore = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const spinRing = {
    animate: {
      rotate: 360,
      transition: { duration: 8, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <div className="w-full max-w-5xl aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <svg viewBox="0 0 1000 600" className="w-full h-full">
        <defs>
          <linearGradient id="uplinkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="downlinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {nodes.map(node => (
          <g key={`path-${node.id}`}>
            {/* Background dashed line */}
            <line x1={node.cx} y1={node.cy} x2={server.cx} y2={server.cy} stroke="#1e293b" strokeWidth="2" strokeDasharray="10 10" />
            
            {/* Uplink (Encrypted Weights) */}
            <motion.line 
              x1={node.cx} y1={node.cy} x2={server.cx} y2={server.cy} 
              stroke="url(#uplinkGrad)" strokeWidth="4" strokeLinecap="round"
              variants={packetUplink} initial="initial" animate="animate"
              filter="url(#glow)"
            />
            
            {/* Downlink (Global Model) */}
            <motion.line 
              x1={node.cx} y1={node.cy} x2={server.cx} y2={server.cy} 
              stroke="url(#downlinkGrad)" strokeWidth="4" strokeLinecap="round"
              variants={packetDownlink} initial="initial" animate="animate"
              filter="url(#glow)"
            />
          </g>
        ))}

        {/* Central Server */}
        <g transform={`translate(${server.cx}, ${server.cy})`}>
          {/* Rings */}
          <motion.circle cx="0" cy="0" r="60" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 5" variants={spinRing} animate="animate" opacity="0.3" />
          <motion.circle cx="0" cy="0" r="50" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="20 10" variants={spinRing} animate="animate" filter="url(#glow)" style={{ rotate: 180 }} />
          
          {/* Core */}
          <motion.circle cx="0" cy="0" r="40" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <motion.circle cx="0" cy="0" r="30" fill="#3b82f6" filter="url(#glow)" variants={pulseCore} animate="animate" />
          
          <text x="0" y="-75" fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="2">GLOBAL AGGREGATION</text>
        </g>

        {/* Local Nodes */}
        {nodes.map(node => (
          <g key={`node-${node.id}`} transform={`translate(${node.cx}, ${node.cy})`}>
            {/* Node UI Base */}
            <rect x="-60" y="-30" width="120" height="60" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            
            {/* Local AI Pulse */}
            <motion.circle cx="-35" cy="0" r="6" fill="#8b5cf6" filter="url(#glow)" variants={pulseCore} animate="animate" />
            <motion.circle cx="-20" cy="0" r="4" fill="#3b82f6" filter="url(#glow)" variants={pulseCore} animate="animate" style={{ animationDelay: '0.5s' }} />
            
            <text x="10" y="5" fill="#f8fafc" fontSize="12" fontWeight="600" textAnchor="middle">{node.label}</text>
            <text x="0" y="45" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">LOCAL DATA</text>
          </g>
        ))}
        
        {/* Floating Text Explanations */}
        <motion.text x="250" y="250" fill="#8b5cf6" fontSize="12" fontWeight="bold" variants={packetUplink} initial="initial" animate="animate">Encrypted Local Gradients</motion.text>
        <motion.text x="750" y="250" fill="#10b981" fontSize="12" fontWeight="bold" variants={packetDownlink} initial="initial" animate="animate">Updated Global Model</motion.text>
        
      </svg>
    </div>
  );
};

export default FLAnimationSVG;
