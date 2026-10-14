import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, Database, Plus, FileSpreadsheet, Download, RefreshCw, Key, Copy, Check, 
  ShieldAlert, ShieldCheck, Search, Filter, Layers, Server, UploadCloud, CheckCircle2, X, Trash2, Activity, TrendingUp, Package
} from 'lucide-react';

const PharmacyEhr = () => {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('records');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [surgeFilter, setSurgeFilter] = useState('ALL');

  // Modal State for Patient & Multi-Medicine Prescription
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientDetails, setPatientDetails] = useState({
    patientName: '',
    age: 35,
    gender: 'Male',
    doctor: 'Dr. A. Sharma',
    surgeFlag: 'Normal'
  });

  const [medicineItems, setMedicineItems] = useState([
    { medicine: 'Doxycycline 100mg', category: 'Antibiotic', quantity: 20, dosage: '1-0-1 (10 days)' }
  ]);

  // CSV & API State
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [syncingApi, setSyncingApi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [syncLog, setSyncLog] = useState([]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserRole(u.role);
      }
    } catch (e) {
      console.error(e);
    }
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/pharmacy/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching pharmacy ERD records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicineItem = () => {
    setMedicineItems([
      ...medicineItems,
      { medicine: 'Paracetamol 650mg', category: 'Antipyretic', quantity: 15, dosage: '1-1-1' }
    ]);
  };

  const handleRemoveMedicineItem = (index) => {
    if (medicineItems.length > 1) {
      setMedicineItems(medicineItems.filter((_, idx) => idx !== index));
    }
  };

  const handleMedicineItemChange = (index, field, value) => {
    const updated = [...medicineItems];
    updated[index][field] = field === 'quantity' ? Math.max(1, Number(value) || 1) : value;
    setMedicineItems(updated);
  };

  const handleAddRx = async (e) => {
    e.preventDefault();
    const payload = {
      patientName: patientDetails.patientName,
      age: patientDetails.age,
      doctor: patientDetails.doctor,
      surgeFlag: patientDetails.surgeFlag,
      medicines: medicineItems
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/pharmacy/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setPatientDetails({ patientName: '', age: 35, gender: 'Male', doctor: 'Dr. A. Sharma', surgeFlag: 'Normal' });
        setMedicineItems([{ medicine: 'Doxycycline 100mg', category: 'Antibiotic', quantity: 20, dosage: '1-0-1 (10 days)' }]);
        fetchRecords();
      }
    } catch (err) {
      console.error("Add pharmacy record error:", err);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = "patientId,patientName,age,medicine,category,quantity,doctor,surgeFlag\n";
    const sampleRows = [
      "PAT-1012,Anil Kapoor,45,Paracetamol 650mg,Antipyretic,30,Dr. V. Patel,Surging",
      "PAT-1012,Anil Kapoor,45,ORS Electrolyte,Supplements,10,Dr. V. Patel,Surging",
      "PAT-1015,Radhika Merchant,29,Azithromycin 500mg,Antibiotic,5,Dr. M. Joshi,Normal"
    ].join("\n");
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharmacy_prescriptions_template.csv';
    a.click();
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const parsedMap = {};
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 4) {
          const patId = cols[0] || `PAT-${1000 + i}`;
          if (!parsedMap[patId]) {
            parsedMap[patId] = {
              patientId: patId,
              patientName: cols[1] || `Patient ${i}`,
              age: Number(cols[2]) || 30,
              doctor: cols[6] || 'Dr. Physician',
              surgeFlag: cols[7] || 'Normal',
              medicines: []
            };
          }
          parsedMap[patId].medicines.push({
            medicine: cols[3] || 'Doxycycline 100mg',
            category: cols[4] || 'Antibiotic',
            quantity: Number(cols[5]) || 10,
            dosage: 'As prescribed'
          });
        }
      }
      setCsvPreview(Object.values(parsedMap));
    };
    reader.readAsText(file);
  };

  const handleImportCsvSubmit = async () => {
    if (csvPreview.length === 0) return;
    setImportingCsv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/pharmacy/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ records: csvPreview })
      });
      if (res.ok) {
        setCsvFile(null);
        setCsvPreview([]);
        fetchRecords();
        setActiveTab('records');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImportingCsv(false);
    }
  };

  const handleTriggerApiSync = async () => {
    setSyncingApi(true);
    setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshaking with PMS System...`]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/pharmacy/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncLog(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] PMS REST Webhook authenticated.`,
          `[${new Date().toLocaleTimeString()}] Fetched ${data.syncedRecordsCount} multi-medicine transaction logs.`,
          `[${new Date().toLocaleTimeString()}] Pharmacy ERD database updated.`
        ]);
        fetchRecords();
      }
    } catch (err) {
      setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message}`]);
    } finally {
      setSyncingApi(false);
    }
  };

  if (userRole && userRole !== 'pharmacy') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center font-sans">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-10 shadow-lg">
          <ShieldAlert size={64} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied: Pharmacy ERD</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-6">
            Confidential Pharmacy Management System (PMS) & ERD schema controls are strictly restricted to authenticated <strong>Pharmacy Facility Login</strong> credentials per privacy guidelines.
          </p>
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
            Current User Role: {userRole} (Unauthorized)
          </div>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(r => {
    const query = searchQuery.toLowerCase();
    const matchesPatient = r.patientName.toLowerCase().includes(query) || r.id.toLowerCase().includes(query);
    const matchesDoctor = r.doctor && r.doctor.toLowerCase().includes(query);
    const matchesMeds = (r.medicines || []).some(m => m.medicine.toLowerCase().includes(query) || (m.category && m.category.toLowerCase().includes(query))) ||
                        (r.medicine && r.medicine.toLowerCase().includes(query));
    const matchesSurge = surgeFilter === 'ALL' || r.surgeFlag === surgeFilter;
    return (matchesPatient || matchesDoctor || matchesMeds) && matchesSurge;
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-300" /> Dedicated Pharmacy ERD Module
              </span>
              <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Multi-Medicine Dispensing PMS
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Pharmacy EHR & ERD System</h1>
            <p className="text-purple-100 text-sm mt-1 max-w-2xl">
              Prescription ERD portal supporting multi-medicine prescriptions with exact unit quantities, drug surge metrics, CSV migration, and direct PMS API integration.
            </p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-purple-900 hover:bg-purple-50 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} /> + New Multi-Medicine Prescription
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-8 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'records' ? 'bg-white text-purple-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Pill size={16} className={activeTab === 'records' ? 'text-purple-700' : 'text-white/80'} /> Prescription ERD Records ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'schema' ? 'bg-white text-purple-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Layers size={16} className={activeTab === 'schema' ? 'text-purple-700' : 'text-white/80'} /> PMS Database ERD Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'ingestion' ? 'bg-white text-purple-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Server size={16} className={activeTab === 'ingestion' ? 'text-purple-700' : 'text-white/80'} /> CSV Import & PMS API Sync
          </button>
        </div>
      </div>

      {/* --- TAB 1: PRESCRIPTION ERD RECORDS --- */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Quick Pharmacy Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Prescriptions Logged</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{records.length}</h3>
                <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} /> PMS Verified Rx Logs
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Pill size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Units Dispensed</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">
                  {records.reduce((s, r) => s + (Number(r.totalQuantity) || 0), 0)}
                </h3>
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                  Multi-Medicine Dispensing
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Package size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Surge Drug Signals</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {records.filter(r => r.surgeFlag !== 'Normal').length}
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                  High Demand / Surging
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">PMS Integration Status</p>
                <h3 className="text-lg font-black text-purple-700 mt-1">Active REST Webhook</h3>
                <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
                  Realtime Sales Velocity
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Server size={24} />
              </div>
            </div>
          </div>
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, Rx ID, prescribing doctor, or medicine name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter size={18} className="text-slate-400" />
              <select
                value={surgeFilter}
                onChange={(e) => setSurgeFilter(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">All Sales Demand</option>
                <option value="High Demand">High Demand</option>
                <option value="Surging">Surging</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Rx ID</th>
                    <th className="p-4">Patient & Prescriber</th>
                    <th className="p-4">Prescribed Medicines & Quantities</th>
                    <th className="p-4">Total Dispensed Units</th>
                    <th className="p-4">Surge Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredRecords.map((r) => {
                    const meds = r.medicines && r.medicines.length > 0 
                      ? r.medicines 
                      : [{ medicine: r.medicine || 'Doxycycline 100mg', category: r.category || 'Antibiotic', quantity: r.quantity || 10, dosage: '1-0-1' }];
                    
                    const totalUnits = r.totalQuantity || meds.reduce((s, item) => s + (item.quantity || 0), 0);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-purple-700">{r.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{r.patientName}</div>
                          <div className="text-xs text-slate-500">{r.patientId} • {r.age} yrs</div>
                          <div className="text-[11px] text-purple-600 font-medium">Dr: {r.doctor || 'Physician'}</div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5">
                            {meds.map((m, idx) => (
                              <div key={idx} className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                  💊 {m.medicine}
                                </span>
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  Qty: {m.quantity} units
                                </span>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                  {m.category}
                                </span>
                                {m.dosage && <span className="text-[10px] text-slate-400 font-mono">({m.dosage})</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            {totalUnits} units
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Across {meds.length} medicine{meds.length > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                            r.surgeFlag === 'Surging' || r.surgeFlag === 'High Demand' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.surgeFlag}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 text-xs font-mono">{r.transactionDate}</td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                        No pharmacy ERD prescription records matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: PMS ERD SCHEMA VISUALIZER --- */}
      {activeTab === 'schema' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-purple-600" /> Pharmacy (PMS) Database ERD Schema Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-purple-500 rounded-2xl bg-purple-50/20 overflow-hidden">
              <div className="bg-purple-600 text-white font-bold p-3 text-sm">PRESCRIPTIONS (Entity)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-purple-700">🔑 rx_id (PK)</div>
                <div>🔗 patient_id (FK)</div>
                <div>patient_name, age</div>
                <div>prescribing_doctor</div>
              </div>
            </div>
            <div className="border-2 border-indigo-500 rounded-2xl bg-indigo-50/20 overflow-hidden">
              <div className="bg-indigo-600 text-white font-bold p-3 text-sm">DRUG_ITEMS (Entity 1:N)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-indigo-700">🔑 item_id (PK)</div>
                <div>🔗 rx_id (FK)</div>
                <div>medicine_name</div>
                <div>quantity_units (INT)</div>
                <div>dosage_frequency</div>
              </div>
            </div>
            <div className="border-2 border-violet-500 rounded-2xl bg-violet-50/20 overflow-hidden">
              <div className="bg-violet-600 text-white font-bold p-3 text-sm">INVENTORY_SURGE (Entity)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-violet-700">🔑 surge_log_id (PK)</div>
                <div>medicine_code</div>
                <div>demand_surge_flag</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: INGESTION & PMS API SYNC --- */}
      {activeTab === 'ingestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Option 1: PMS CSV Bulk Upload</h3>
            <button onClick={downloadCsvTemplate} className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl">
              <Download size={14} /> Download PMS CSV Template
            </button>
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center bg-slate-50">
              <UploadCloud size={36} className="text-slate-400 mx-auto mb-2" />
              <input type="file" accept=".csv" onChange={handleCsvFileChange} className="hidden" id="pharmacy-csv-input" />
              <label htmlFor="pharmacy-csv-input" className="cursor-pointer bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
                Browse CSV File
              </label>
              {csvFile && <p className="text-xs text-purple-600 mt-2 font-bold">{csvFile.name}</p>}
            </div>
            {csvPreview.length > 0 && (
              <button onClick={handleImportCsvSubmit} disabled={importingCsv} className="w-full bg-purple-600 text-white font-bold text-xs py-3 rounded-xl">
                {importingCsv ? 'Importing...' : `Import ${csvPreview.length} Prescription Records`}
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Option 2: Direct PMS API Connection</h3>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl">
              http://localhost:5000/api/erd/pharmacy/sync
            </div>
            {syncLog.length > 0 && (
              <div className="bg-slate-950 text-slate-300 rounded-2xl p-3 font-mono text-[10px] space-y-1">
                {syncLog.map((log, idx) => <div key={idx}>{log}</div>)}
              </div>
            )}
            <button onClick={handleTriggerApiSync} disabled={syncingApi} className="w-full bg-purple-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
              <RefreshCw size={16} className={syncingApi ? 'animate-spin' : ''} /> Simulate Live PMS API Sync
            </button>
          </div>
        </div>
      )}

      {/* --- ADD MULTI-MEDICINE PRESCRIPTION MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Pill className="text-purple-600" /> New Multi-Medicine Prescription
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddRx} className="space-y-6 text-xs font-medium">
                {/* Patient Header Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Patient Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={patientDetails.patientName} 
                      onChange={e => setPatientDetails({...patientDetails, patientName: e.target.value})} 
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Age</label>
                    <input 
                      type="number" 
                      required 
                      value={patientDetails.age} 
                      onChange={e => setPatientDetails({...patientDetails, age: Number(e.target.value)})} 
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Prescribing Doctor</label>
                    <input 
                      type="text" 
                      required 
                      value={patientDetails.doctor} 
                      onChange={e => setPatientDetails({...patientDetails, doctor: e.target.value})} 
                      placeholder="e.g. Dr. A. Sharma"
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                </div>

                {/* Prescribed Medicine Items List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Prescribed Medicine Items ({medicineItems.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicineItem}
                      className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus size={14} /> + Add Another Medicine
                    </button>
                  </div>

                  <div className="space-y-3">
                    {medicineItems.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-slate-600 text-[11px] font-semibold mb-1">Medicine Name & Strength</label>
                          <input
                            type="text"
                            required
                            value={item.medicine}
                            onChange={e => handleMedicineItemChange(idx, 'medicine', e.target.value)}
                            placeholder="e.g. Doxycycline 100mg"
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="block text-slate-600 text-[11px] font-semibold mb-1">Quantity (Units)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={e => handleMedicineItemChange(idx, 'quantity', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold font-mono"
                          />
                        </div>
                        <div className="w-full sm:w-36">
                          <label className="block text-slate-600 text-[11px] font-semibold mb-1">Category</label>
                          <select
                            value={item.category}
                            onChange={e => handleMedicineItemChange(idx, 'category', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                          >
                            <option value="Antibiotic">Antibiotic</option>
                            <option value="Antipyretic">Antipyretic</option>
                            <option value="Analgesic">Analgesic</option>
                            <option value="Bronchodilator">Bronchodilator</option>
                            <option value="Electrolytes">Electrolytes</option>
                            <option value="Supplements">Supplements</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="w-full sm:w-36">
                          <label className="block text-slate-600 text-[11px] font-semibold mb-1">Dosage Frequency</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={e => handleMedicineItemChange(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 1-0-1 (5 days)"
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        {medicineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineItem(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove Medicine Item"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demand Surge Status */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Surge Flag Status</label>
                  <select
                    value={patientDetails.surgeFlag}
                    onChange={e => setPatientDetails({...patientDetails, surgeFlag: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="Normal">Normal Sales</option>
                    <option value="High Demand">High Demand</option>
                    <option value="Surging">Surging (Epidemic Surge)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs shadow-md"
                  >
                    Save Multi-Medicine Prescription ({medicineItems.reduce((s, i) => s + (i.quantity || 0), 0)} Total Units)
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

export default PharmacyEhr;
