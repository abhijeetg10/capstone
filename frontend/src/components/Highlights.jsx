import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BrainCircuit, Activity, Map, Landmark } from 'lucide-react';

const highlights = [
  {
    title: 'Privacy Preserving',
    description: 'Data remains localized at the source hospital. Only model parameters are shared, ensuring patient confidentiality.',
    icon: <ShieldCheck size={32} className="text-primary-600" />,
    color: 'bg-primary-50',
    border: 'border-primary-100'
  },
  {
    title: 'Federated Learning',
    description: 'Decentralized machine learning architecture that aggregates insights without centralizing sensitive medical records.',
    icon: <BrainCircuit size={32} className="text-secondary-600" />,
    color: 'bg-secondary-50',
    border: 'border-secondary-100'
  },
  {
    title: 'Simulated Real-time Ingestion',
    description: 'Continuous ingestion of health data enabling immediate detection and alert generation for disease outbreaks.',
    icon: <Activity size={32} className="text-rose-600" />,
    color: 'bg-rose-50',
    border: 'border-rose-100'
  },
  {
    title: 'GIS Heatmaps',
    description: 'Spatial visualization of disease spread and risk zones overlaid on interactive geographic maps.',
    icon: <Map size={32} className="text-amber-600" />,
    color: 'bg-amber-50',
    border: 'border-amber-100'
  },
  {
    title: 'Decision Support',
    description: 'Empowers municipalities with actionable insights for resource allocation and public health interventions.',
    icon: <Landmark size={32} className="text-emerald-600" />,
    color: 'bg-emerald-50',
    border: 'border-emerald-100'
  }
];

const Highlights = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Platform Capabilities</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-slate-600 max-w-2xl mx-auto">
            The Islampur Health Administration platform leverages state-of-the-art technologies to provide a robust, secure, and intelligent network for public health surveillance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-2xl border ${item.border} ${item.color} shadow-sm hover:shadow-md transition-all flex flex-col items-start`}
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Highlights;
