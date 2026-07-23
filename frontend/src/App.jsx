import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import DashboardOverview from './pages/DashboardOverview';
import GISDashboard from './pages/GISDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import LabDashboard from './pages/LabDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import PredictionDashboard from './pages/PredictionDashboard';
import AlertDashboard from './pages/AlertDashboard';
import NetworkDashboard from './pages/NetworkDashboard';
import Presentation from './pages/Presentation';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardOverview />} />
          <Route path="gis" element={<GISDashboard />} />
          <Route path="hospitals" element={<HospitalDashboard />} />
          <Route path="labs" element={<LabDashboard />} />
          <Route path="pharmacies" element={<PharmacyDashboard />} />
          <Route path="predictions" element={<PredictionDashboard />} />
          <Route path="alerts" element={<AlertDashboard />} />
          <Route path="network" element={<NetworkDashboard />} />
        </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
