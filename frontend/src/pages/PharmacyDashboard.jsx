import React from 'react';
import MedicineSalesAnalytics from '../components/pharmacy/MedicineSalesAnalytics';
import AbnormalDemandAlerts from '../components/pharmacy/AbnormalDemandAlerts';
import PmsIntegrationStatus from '../components/pharmacy/PmsIntegrationStatus';
import LocalPharmacyAIPerformance from '../components/pharmacy/LocalPharmacyAIPerformance';
import FederatedLearningMonitor from '../components/hospital/FederatedLearningMonitor';
import { Pill } from 'lucide-react';

const PharmacyDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <Pill className="text-primary-600" />
            Pharmacy Node View
          </h1>
          <p className="text-slate-500 text-sm mt-1">City Central Pharmacy - Local FL Client</p>
        </div>

        <PmsIntegrationStatus />
      </div>
      
      <MedicineSalesAnalytics />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <AbnormalDemandAlerts />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <LocalPharmacyAIPerformance />
          <FederatedLearningMonitor />
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
