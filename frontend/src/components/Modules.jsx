import React from 'react';
import { motion } from 'framer-motion';
import { Hospital, TestTube, Syringe, HeartPulse, CloudSun, MapPin, TrendingUp } from 'lucide-react';

const modules = [
  { name: 'Hospitals', icon: <Hospital size={28} />, desc: 'Primary source of patient diagnostics and treatment data.' },
  { name: 'Laboratories', icon: <TestTube size={28} />, desc: 'Supplies test results and pathogen identification.' },
  { name: 'Pharmacies', icon: <Syringe size={28} />, desc: 'Tracks medication sales as early outbreak indicators.' },
  { name: 'Health Centers', icon: <HeartPulse size={28} />, desc: 'Community-level health statistics and vaccination rates.' },
  { name: 'Weather API', icon: <CloudSun size={28} />, desc: 'Environmental factors influencing disease spread.' },
  { name: 'GIS Mapping', icon: <MapPin size={28} />, desc: 'Spatial correlation and visual mapping of health zones.' },
  { name: 'Prediction Engine', icon: <TrendingUp size={28} />, desc: 'AI models forecasting future outbreaks and trends.' },
];

const Modules = () => {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: Text Info */}
          <div className="flex-1 lg:pr-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Integrated Administration Modules</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-8"></div>
              <p className="text-lg text-slate-600 mb-6">
                The municipal architecture integrates diverse, multi-source data streams. By combining clinical records with environmental data, the administration builds a comprehensive surveillance framework.
              </p>
              <p className="text-lg text-slate-600 mb-8">
                Each module operates securely, contributing to the global federated model while ensuring strict data privacy and local compliance.
              </p>
              <ul className="space-y-4">
                {['Multi-source data ingestion', 'Secure API gateways', 'Edge computing at local nodes'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    </div>
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right: Modules Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((mod, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
                >
                  <div className="p-3 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    {mod.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{mod.name}</h4>
                    <p className="text-sm text-slate-500 leading-tight">{mod.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Modules;
