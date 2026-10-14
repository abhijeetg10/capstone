import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Activity, AlertTriangle, CheckCircle2, RefreshCw, Settings, ShieldAlert, HeartPulse, Wind } from 'lucide-react';

const HospitalBedStats = () => {
  const [bedData, setBedData] = useState({
    hospitalName: 'Ishwarpur City Civil Hospital',
    district: 'Ishwarpur City',
    totalBeds: 250,
    occupiedBeds: 185,
    availableBeds: 65,
    totalIcuBeds: 40,
    occupiedIcuBeds: 34,
    availableIcuBeds: 6,
    totalOxygenBeds: 60,
    occupiedOxygenBeds: 48,
    availableOxygenBeds: 12,
    ventilatorBeds: 20,
    availableVentilators: 4,
    lastUpdated: new Date().toISOString()
  });

  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    totalBeds: 250,
    occupiedBeds: 185,
    totalIcuBeds: 40,
    occupiedIcuBeds: 34,
    totalOxygenBeds: 60,
    occupiedOxygenBeds: 48,
    ventilatorBeds: 20,
    availableVentilators: 4
  });

  useEffect(() => {
    fetchBedStats();
  }, []);

  const fetchBedStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/hospital/beds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setBedData(result.data);
          setFormData({
            totalBeds: result.data.totalBeds,
            occupiedBeds: result.data.occupiedBeds,
            totalIcuBeds: result.data.totalIcuBeds,
            occupiedIcuBeds: result.data.occupiedIcuBeds,
            totalOxygenBeds: result.data.totalOxygenBeds,
            occupiedOxygenBeds: result.data.occupiedOxygenBeds,
            ventilatorBeds: result.data.ventilatorBeds,
            availableVentilators: result.data.availableVentilators
          });
        }
      }
    } catch (err) {
      console.error("Error fetching bed stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/hospital/beds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const result = await res.json();
        setBedData(result.data);
        setShowEditModal(false);
      }
    } catch (err) {
      console.error("Update bed stats error:", err);
    }
  };

  const genOccupancy = Math.round((bedData.occupiedBeds / (bedData.totalBeds || 1)) * 100);
  const icuOccupancy = Math.round((bedData.occupiedIcuBeds / (bedData.totalIcuBeds || 1)) * 100);
  const oxygenOccupancy = Math.round((bedData.occupiedOxygenBeds / (bedData.totalOxygenBeds || 1)) * 100);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bed className="text-primary-600" size={24} />
            <h2 className="text-xl font-black text-slate-900">Hospital Bed Capacity & Live Availability</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulated real-time tracking of General Ward, ICU Critical, Oxygen, and Ventilator bed occupancy for surge management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBedStats}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh bed stats"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Settings size={15} /> Update Bed Counts
          </button>
        </div>
      </div>

      {/* ICU High Occupancy Warning Alert Banner if ICU > 80% */}
      {icuOccupancy >= 80 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-900"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                CRITICAL ICU CAPACITY ALERT ({icuOccupancy}% Occupied)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Only <strong>{bedData.availableIcuBeds} ICU beds remaining</strong> out of {bedData.totalIcuBeds}. Municipal health network notified.
              </p>
            </div>
          </div>
          <span className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            Surge Warning Active
          </span>
        </motion.div>
      )}

      {/* Grid of Bed Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: General Ward Beds */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">General Ward Beds</span>
              <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                <Bed size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{bedData.availableBeds}</span>
              <span className="text-xs font-semibold text-slate-500">Available / {bedData.totalBeds} Total</span>
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              Occupied: <strong>{bedData.occupiedBeds}</strong> beds ({genOccupancy}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${genOccupancy > 85 ? 'bg-rose-500' : genOccupancy > 70 ? 'bg-amber-500' : 'bg-primary-600'}`}
                style={{ width: `${genOccupancy}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>Occupancy: {genOccupancy}%</span>
              <span>{bedData.availableBeds} Free</span>
            </div>
          </div>
        </div>

        {/* Card 2: ICU Critical Beds */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          icuOccupancy >= 80 ? 'bg-rose-50/60 border-rose-300' : 'bg-slate-50/70 border-slate-200/80'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">ICU Critical Beds</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                icuOccupancy >= 80 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                <HeartPulse size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black ${icuOccupancy >= 80 ? 'text-rose-700' : 'text-slate-900'}`}>
                {bedData.availableIcuBeds}
              </span>
              <span className="text-xs font-semibold text-slate-500">Available / {bedData.totalIcuBeds} ICU</span>
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              Occupied: <strong>{bedData.occupiedIcuBeds}</strong> ICU beds ({icuOccupancy}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${icuOccupancy >= 85 ? 'bg-rose-600' : icuOccupancy >= 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${icuOccupancy}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span className={icuOccupancy >= 80 ? 'text-rose-600 font-bold' : ''}>Occupancy: {icuOccupancy}%</span>
              <span>{bedData.availableIcuBeds} Free</span>
            </div>
          </div>
        </div>

        {/* Card 3: Oxygen Supported Beds */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Oxygen Beds</span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Wind size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{bedData.availableOxygenBeds}</span>
              <span className="text-xs font-semibold text-slate-500">Available / {bedData.totalOxygenBeds} O2 Beds</span>
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              Occupied: <strong>{bedData.occupiedOxygenBeds}</strong> O2 beds ({oxygenOccupancy}%)
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${oxygenOccupancy > 85 ? 'bg-rose-500' : oxygenOccupancy > 70 ? 'bg-amber-500' : 'bg-teal-600'}`}
                style={{ width: `${oxygenOccupancy}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>Occupancy: {oxygenOccupancy}%</span>
              <span>{bedData.availableOxygenBeds} Free</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ventilators & Critical Equipment */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Ventilator Units</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Activity size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-700">{bedData.availableVentilators}</span>
              <span className="text-xs font-semibold text-slate-500">Available / {bedData.ventilatorBeds} Units</span>
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              In Use: <strong>{bedData.ventilatorBeds - bedData.availableVentilators}</strong> Ventilators
            </div>
          </div>

          <div className="mt-4 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center text-xs font-bold text-emerald-800">
            {bedData.availableVentilators > 0 ? `${bedData.availableVentilators} Units Ready for Emergency` : 'Zero Ventilators Available (Critical)'}
          </div>
        </div>
      </div>

      {/* UPDATE BED CAPACITY MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Bed className="text-primary-600" /> Update Live Bed Capacity
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateBeds} className="space-y-4 text-xs font-medium">
                {/* General Beds */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Total General Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({ ...formData, totalBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Occupied General Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.occupiedBeds}
                      onChange={(e) => setFormData({ ...formData, occupiedBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* ICU Beds */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Total ICU Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.totalIcuBeds}
                      onChange={(e) => setFormData({ ...formData, totalIcuBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Occupied ICU Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.occupiedIcuBeds}
                      onChange={(e) => setFormData({ ...formData, occupiedIcuBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Oxygen Beds */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Total Oxygen Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.totalOxygenBeds}
                      onChange={(e) => setFormData({ ...formData, totalOxygenBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Occupied Oxygen Beds</label>
                    <input
                      type="number"
                      required
                      value={formData.occupiedOxygenBeds}
                      onChange={(e) => setFormData({ ...formData, occupiedOxygenBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Ventilators */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Total Ventilators</label>
                    <input
                      type="number"
                      required
                      value={formData.ventilatorBeds}
                      onChange={(e) => setFormData({ ...formData, ventilatorBeds: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Available Ventilators</label>
                    <input
                      type="number"
                      required
                      value={formData.availableVentilators}
                      onChange={(e) => setFormData({ ...formData, availableVentilators: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
                  >
                    Save Capacity
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalBedStats;
