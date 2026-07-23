import React from 'react';
import { Hospital, Shield } from 'lucide-react';
import HospitalStats from '../components/hospital/HospitalStats';
import SymptomClusterDetection from '../components/hospital/SymptomClusterDetection';
import EarlyWarningPanel from '../components/hospital/EarlyWarningPanel';
import FederatedLearningMonitor from '../components/hospital/FederatedLearningMonitor';
import LocalAIPerformance from '../components/hospital/LocalAIPerformance';
import HospitalNotifications from '../components/hospital/HospitalNotifications';
import DiseaseTrendAnalytics from '../components/hospital/DiseaseTrendAnalytics';
import HisIntegrationStatus from '../components/hospital/HisIntegrationStatus';

const HospitalDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <Hospital className="text-primary-600" />
            Hospital AI Node
          </h1>
          <p className="text-slate-500 text-sm mt-1">City General Hospital - Automated Early Detection Engine</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm font-medium text-slate-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
            <Shield size={16} className="text-emerald-500" />
            Zero Patient Data Transmitted
          </div>
          <HisIntegrationStatus />
        </div>
      </div>
      
      {/* 1. Top Statistics Cards */}
      <HospitalStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 2. Symptom Cluster Detection (Main Module) */}
        <div className="lg:col-span-2">
          <SymptomClusterDetection />
        </div>
        
        {/* 3. Early Warning Panel */}
        <div className="lg:col-span-1">
          <EarlyWarningPanel />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 4. Disease Trend Analytics */}
        <div className="lg:col-span-2">
          <DiseaseTrendAnalytics />
        </div>
        
        {/* 5. Local AI Performance */}
        <div className="lg:col-span-1">
          <LocalAIPerformance />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 6. Federated Learning Monitor */}
        <div className="lg:col-span-2">
          <FederatedLearningMonitor />
        </div>

        {/* 7. Notifications */}
        <div className="lg:col-span-1">
          <HospitalNotifications />
        </div>
      </div>

    </div>
  );
};

export default HospitalDashboard;
