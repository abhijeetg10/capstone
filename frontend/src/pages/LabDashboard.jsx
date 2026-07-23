import React from 'react';
import { TestTube } from 'lucide-react';
import LabStats from '../components/laboratory/LabStats';
import DiseaseConfirmationAnalytics from '../components/laboratory/DiseaseConfirmationAnalytics';
import LabAIControls from '../components/laboratory/LabAIControls';
import LimsIntegrationStatus from '../components/laboratory/LimsIntegrationStatus';
import EarlyLaboratoryAlerts from '../components/laboratory/EarlyLaboratoryAlerts';
import LabNotifications from '../components/laboratory/LabNotifications';
import FederatedLearningMonitor from '../components/hospital/FederatedLearningMonitor'; // Reusing from hospital per plan

const LabDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <TestTube className="text-primary-600" />
            Laboratory Surveillance Node
          </h1>
          <p className="text-slate-500 text-sm mt-1">Central Diagnostics Lab - Automated Disease Confirmation Surveillance</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <LimsIntegrationStatus />
        </div>
      </div>
      
      {/* 1. Top Statistics Cards */}
      <LabStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 2. Disease Confirmation Analytics */}
        <div className="lg:col-span-2">
          <DiseaseConfirmationAnalytics />
        </div>
        
        {/* 3. Early Laboratory Alerts */}
        <div className="lg:col-span-1">
          <EarlyLaboratoryAlerts />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 4. Federated Learning Monitor */}
        <div className="lg:col-span-2">
          <FederatedLearningMonitor />
        </div>
        
        {/* 5. Local AI Monitoring */}
        <div className="lg:col-span-1">
          <LabAIControls />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 6. Notifications */}
        <div className="lg:col-span-1 lg:col-start-3">
          <LabNotifications />
        </div>
      </div>

    </div>
  );
};

export default LabDashboard;
