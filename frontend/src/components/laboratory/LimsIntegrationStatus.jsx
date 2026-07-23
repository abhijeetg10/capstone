import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const LimsIntegrationStatus = () => {
  const [status, setStatus] = useState('IDLE');
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      // Mocking fetch status
      setStatus('CONNECTED');
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error("Failed to fetch LIMS sync status", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto sync simulation every 5 mins
    const interval = setInterval(fetchStatus, 300000); 
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setStatus('SYNCING');
    
    try {
      // Mocking sync API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('CONNECTED');
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error("Manual sync failed", error);
      setStatus('FAILED');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (status === 'SYNCING') return <RefreshCw className="animate-spin text-primary-500" size={16} />;
    if (status === 'CONNECTED') return <CheckCircle className="text-emerald-500" size={16} />;
    return <AlertCircle className="text-red-500" size={16} />;
  };

  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        <Database size={18} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">LIMS Integration:</span>
      </div>
      
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
        {getStatusIcon()}
        <span className="text-xs font-medium text-slate-600">
          {status === 'SYNCING' ? 'Syncing...' : status}
        </span>
      </div>
      
      {lastSync && (
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          Last Sync: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
      
      <button 
        onClick={handleManualSync}
        disabled={isSyncing}
        className="ml-2 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
      >
        Sync Now
      </button>
    </div>
  );
};

export default LimsIntegrationStatus;
