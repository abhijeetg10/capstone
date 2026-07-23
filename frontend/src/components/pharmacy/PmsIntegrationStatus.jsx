import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PmsIntegrationStatus = () => {
  const [status, setStatus] = useState('PENDING');
  const [lastSync, setLastSync] = useState(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/pms-integration/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if(res.ok) {
          setStatus(data.data.status);
          if (data.data.lastSyncTime) {
            setLastSync(new Date(data.data.lastSyncTime).toLocaleTimeString());
          }
        } else {
          setStatus('FAILED');
        }
      } catch (error) {
        setStatus('FAILED');
      }
    };
    
    fetchStatus();
    // In a real app, this would poll or use WebSockets. We mock an initial sync after 2 seconds.
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/pms-integration/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchStatus();
      } catch (e) {}
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          <Database size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">PMS Integration</h3>
          <p className="text-xs text-slate-500">
            {status === 'CONNECTED' ? 'Automated Sync Active' : 'Waiting for connection...'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {lastSync && (
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
            <Clock size={12} />
            Last Sync: {lastSync}
          </div>
        )}
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {status === 'CONNECTED' && <CheckCircle2 size={12} />}
          {status}
        </div>
      </div>
    </motion.div>
  );
};

export default PmsIntegrationStatus;
