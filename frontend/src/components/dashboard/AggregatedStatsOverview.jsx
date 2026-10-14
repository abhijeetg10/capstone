import React, { useEffect, useState } from 'react';
import { Hospital, TestTube, Pill, TrendingUp, AlertTriangle, Activity, Award, Bed, HeartPulse, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AggregatedStatsOverview = () => {
  const [data, setData] = useState({
    disease_leaderboard: [
      { rank: 1, disease: "Leptospirosis", predicted_patients: 450, percentage: 38.5, risk_level: "HIGH", growth_rate: "+28%" },
      { rank: 2, disease: "Asthma", predicted_patients: 310, percentage: 26.5, risk_level: "HIGH", growth_rate: "+18%" },
      { rank: 3, disease: "Gastroenteritis", predicted_patients: 240, percentage: 20.5, risk_level: "MEDIUM", growth_rate: "+12%" },
      { rank: 4, disease: "Hypertension", predicted_patients: 170, percentage: 14.5, risk_level: "LOW", growth_rate: "+5%" }
    ],
    symptom_spreading_leaderboard: [
      { symptom: "High Fever", patient_count: 820, trend: "Surging" },
      { symptom: "Joint Pain", patient_count: 540, trend: "Surging" },
      { symptom: "Cough & Wheezing", patient_count: 480, trend: "Stable" },
      { symptom: "Diarrhea", patient_count: 390, trend: "Surging" },
      { symptom: "Skin Rash", patient_count: 260, trend: "Stable" }
    ],
    top_selling_medicines: [
      { medicine: "Doxycycline 100mg", sales_volume: 1420, demand_surge: "+45%" },
      { medicine: "Paracetamol 650mg", sales_volume: 2850, demand_surge: "+38%" },
      { medicine: "ORS & Electrolytes", sales_volume: 1980, demand_surge: "+32%" },
      { medicine: "Salbutamol Inhaler", sales_volume: 1120, demand_surge: "+15%" }
    ],
    city_bed_summary: {
      total_city_beds: 2450,
      occupied_city_beds: 1820,
      available_city_beds: 630,
      city_occupancy_rate: 74.3,
      total_icu_beds: 380,
      occupied_icu_beds: 315,
      available_icu_beds: 65,
      icu_occupancy_rate: 82.9,
      total_oxygen_beds: 520,
      available_oxygen_beds: 110,
      strain_status: "ICU SURGE WARNING"
    },
    hospital_bed_breakdown: [
      { hospital: "Ishwarpur City Civil Hospital", ward: "Ishwarpur North Ward", totalBeds: 250, genAvailable: 65, totalIcu: 40, icuAvailable: 6, oxygenAvailable: 12, status: "Near Capacity (ICU Alert)", alertColor: "amber" },
      { hospital: "Ishwarpur Municipal General Hospital", ward: "Ishwarpur Central Ward", totalBeds: 600, genAvailable: 120, totalIcu: 80, icuAvailable: 14, oxygenAvailable: 35, status: "Active Strain", alertColor: "indigo" },
      { hospital: "Ishwarpur Sub-District Hospital", ward: "Ishwarpur East Ward", totalBeds: 350, genAvailable: 95, totalIcu: 50, icuAvailable: 18, oxygenAvailable: 20, status: "Normal Operating", alertColor: "emerald" },
      { hospital: "Ishwarpur Community Health Center", ward: "Ishwarpur South Ward", totalBeds: 280, genAvailable: 45, totalIcu: 45, icuAvailable: 4, oxygenAvailable: 8, status: "Critical ICU Surge", alertColor: "rose" }
    ]
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/analytics/integrated')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setData(prev => ({ ...prev, ...result.data }));
        }
      })
      .catch(err => console.log("Analytics fetch fallback active"));
  }, []);

  const bedSummary = data.city_bed_summary || {};
  const hospitalList = data.hospital_bed_breakdown || [];

  return (
    <div className="mb-8 space-y-8 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: CITY-WIDE AGGREGATED HOSPITAL BED SURVEILLANCE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Bed className="text-primary-600" size={24} />
              <h2 className="text-xl font-black text-slate-900">City-Wide Hospital Bed Capacity & Surge Surveillance</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated live bed metrics across all municipal & private healthcare institutions for outbreak preparedness.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
              <ShieldAlert size={14} className="animate-pulse text-rose-600" />
              {bedSummary.strain_status || "ICU SURGE WARNING"}
            </span>
          </div>
        </div>

        {/* Top 4 City-Wide Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total City Beds */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
              <span>Total City Beds</span>
              <Bed size={18} className="text-primary-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {bedSummary.available_city_beds} <span className="text-xs font-normal text-slate-500">Available</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Total: <strong>{bedSummary.total_city_beds}</strong> | Occupied: {bedSummary.occupied_city_beds}
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary-600 h-full rounded-full" style={{ width: `${bedSummary.city_occupancy_rate || 74}%` }} />
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-1 text-right">
              {bedSummary.city_occupancy_rate}% City Occupied
            </div>
          </div>

          {/* Card 2: City ICU Critical Beds */}
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
            <div className="flex justify-between items-center text-xs font-bold text-rose-800 uppercase">
              <span>City ICU Beds</span>
              <HeartPulse size={18} className="text-rose-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1">
              {bedSummary.available_icu_beds} <span className="text-xs font-normal text-rose-700">ICU Free</span>
            </div>
            <div className="text-xs text-rose-800 mt-1">
              Total: <strong>{bedSummary.total_icu_beds}</strong> | Occupied: {bedSummary.occupied_icu_beds}
            </div>
            <div className="w-full bg-rose-200 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-600 h-full rounded-full" style={{ width: `${bedSummary.icu_occupancy_rate || 83}%` }} />
            </div>
            <div className="text-[10px] font-bold text-rose-700 mt-1 text-right">
              {bedSummary.icu_occupancy_rate}% ICU Occupied (Surge Danger)
            </div>
          </div>

          {/* Card 3: Oxygen-Supported Beds */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
              <span>Oxygen Beds</span>
              <Activity size={18} className="text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {bedSummary.available_oxygen_beds} <span className="text-xs font-normal text-slate-500">Available</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Total City Oxygen Supply: <strong>{bedSummary.total_oxygen_beds} Beds</strong>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full" style={{ width: '79%' }} />
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-1 text-right">
              79% O2 Occupancy
            </div>
          </div>

          {/* Card 4: Healthcare Network Strain */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200">
            <div className="flex justify-between items-center text-xs font-bold text-indigo-900 uppercase">
              <span>Network Strain Index</span>
              <AlertTriangle size={18} className="text-indigo-600" />
            </div>
            <div className="text-xl font-black text-indigo-950 mt-1">
              ELEVATED (LEVEL 3)
            </div>
            <p className="text-[11px] text-indigo-700 mt-1">
              Surge predicted in <strong>Mumbai Suburban & Bandra</strong> districts due to Dengue/Leptospirosis clusters.
            </p>
            <div className="mt-2 text-[10px] font-bold text-indigo-800 bg-white/80 px-2 py-1 rounded-md">
              Preparedness Directives Issued ✓
            </div>
          </div>
        </div>

        {/* Hospital-by-Hospital Bed Availability Breakdown Matrix */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-100 p-3.5 text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Hospital size={16} className="text-primary-600" /> City Hospital Bed Breakdown & Live Capacity Matrix
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Updated: Realtime HIS Stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  <th className="p-3">Hospital Name</th>
                  <th className="p-3">District / Zone</th>
                  <th className="p-3">General Beds Avail</th>
                  <th className="p-3">ICU Beds Avail / Total</th>
                  <th className="p-3">Oxygen Beds Avail</th>
                  <th className="p-3">Capacity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {hospitalList.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{h.hospital}</td>
                    <td className="p-3 text-slate-500">{h.ward}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900">{h.genAvailable}</span> / {h.totalBeds} free
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${h.icuAvailable <= 6 ? 'text-rose-600 font-black' : 'text-slate-900'}`}>
                        {h.icuAvailable}
                      </span> / {h.totalIcu} ICU beds
                    </td>
                    <td className="p-3 font-mono text-teal-700 font-bold">{h.oxygenAvailable} free</td>
                    <td className="p-3">
                      <span className={`inline-block font-bold text-[10px] px-2.5 py-1 rounded-full ${
                        h.alertColor === 'rose' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        h.alertColor === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        h.alertColor === 'indigo' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Precautions & Outbreak Preparedness Action Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <span>Municipal Health Authority - Actionable Emergency Precaution Directives</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-start gap-2">
              <span className="bg-rose-600 text-white font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <div className="font-bold text-slate-900">Activate Auxiliary Wards</div>
                <div className="text-slate-500 mt-0.5">Prepare 50 auxiliary ICU beds at Lilavati & City General Hospital to prevent overflow.</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-start gap-2">
              <span className="bg-amber-600 text-white font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <div className="font-bold text-slate-900">Reroute Ambulance Triage</div>
                <div className="text-slate-500 mt-0.5">Reroute non-critical emergency patient triage from Bandra West to Cooper Hospital.</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-start gap-2">
              <span className="bg-indigo-600 text-white font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <div className="font-bold text-slate-900">Ventilator Supply Buffer</div>
                <div className="text-slate-500 mt-0.5">Deploy 15 municipal reserve ventilator concentrators to high-strain ICU facilities.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: INTEGRATED SURVEILLANCE LEADERBOARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Integrated Disease Surveillance Leaderboard</h2>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
          Live Triangulation Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Disease Ranking Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex flex-col h-full border-t-4 border-emerald-500 bg-white shadow-sm rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Award size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Disease Ranking</h3>
                <p className="text-xs text-slate-500">By predicted patient volume</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Top Spreading</span>
          </div>

          <div className="space-y-3 flex-1">
            {data.disease_leaderboard.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{item.rank}
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">{item.disease}</h4>
                    <span className="text-xs text-slate-500">{item.predicted_patients} Est. Patients</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.growth_rate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card 2: Top Spreading Symptoms */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex flex-col h-full border-t-4 border-purple-500 bg-white shadow-sm rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Spreading Symptoms</h3>
                <p className="text-xs text-slate-500">Triage symptom frequency</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Symptom Track</span>
          </div>

          <div className="space-y-3 flex-1">
            {data.symptom_spreading_leaderboard.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 font-semibold">{item.symptom}</span>
                  <span className="text-purple-600 font-bold">{item.patient_count} Cases</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-purple-500"
                    style={{ width: `${Math.min(100, (item.patient_count / 900) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card 3: Top Selling Medicines (Pharmacy Surges) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col h-full border-t-4 border-amber-500 bg-white shadow-sm rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Pill size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Pharmacy Drug Surges</h3>
                <p className="text-xs text-slate-500">Most selling medicines</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Demand Velocity</span>
          </div>

          <div className="space-y-3 flex-1">
            {data.top_selling_medicines.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">{item.medicine}</h4>
                  <span className="text-xs text-slate-500">{item.sales_volume} units sold today</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {item.demand_surge}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AggregatedStatsOverview;
