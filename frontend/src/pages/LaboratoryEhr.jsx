import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TestTube, Database, Plus, FileSpreadsheet, Download, RefreshCw, Key, Copy, Check, 
  ShieldAlert, ShieldCheck, Search, Filter, Layers, Server, UploadCloud, CheckCircle2, X, Activity, TrendingUp, Shield
} from 'lucide-react';

const LaboratoryEhr = () => {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('records');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTest, setNewTest] = useState({
    patientId: 'PAT-1010', patientName: '', age: 30, gender: 'Male',
    specimenType: 'Blood (Serology)', testResult: 'Positive',
    pathogen: 'Leptospira interrogans', pathologist: 'Dr. K. Mehta'
  });

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
      const res = await fetch('http://localhost:5000/api/erd/laboratory/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching lab ERD records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/laboratory/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTest)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchRecords();
      }
    } catch (err) {
      console.error("Add lab test error:", err);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = "patientId,patientName,age,gender,specimenType,sampleDate,testResult,pathogen,pathologist\n";
    const sampleRows = [
      "PAT-1008,Sunil Rao,41,Male,Blood (PCR),2026-07-25,Positive,Dengue Virus Type 1,Dr. K. Mehta",
      "PAT-1009,Neha Sharma,28,Female,Stool Specimen,2026-07-24,Positive,Salmonella enterica,Dr. R. Desai"
    ].join("\n");
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lab_tests_template.csv';
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

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 4) {
          parsed.push({
            patientId: cols[0] || `PAT-${1000 + i}`,
            patientName: cols[1] || `Patient ${i}`,
            age: Number(cols[2]) || 30,
            gender: cols[3] || 'Male',
            specimenType: cols[4] || 'Blood Sample',
            sampleDate: cols[5] || new Date().toISOString().split('T')[0],
            testResult: cols[6] || 'Positive',
            pathogen: cols[7] || 'Pathogen Positive',
            pathologist: cols[8] || 'Dr. K. Mehta'
          });
        }
      }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportCsvSubmit = async () => {
    if (csvPreview.length === 0) return;
    setImportingCsv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/laboratory/import-csv', {
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
    setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshaking with LIMS Server...`]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/laboratory/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncLog(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] LIMS gRPC channel connected.`,
          `[${new Date().toLocaleTimeString()}] Fetched ${data.syncedRecordsCount} lab test specimen results.`,
          `[${new Date().toLocaleTimeString()}] Laboratory ERD database updated.`
        ]);
        fetchRecords();
      }
    } catch (err) {
      setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message}`]);
    } finally {
      setSyncingApi(false);
    }
  };

  if (userRole && userRole !== 'laboratory') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center font-sans">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-10 shadow-lg">
          <ShieldAlert size={64} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied: Laboratory ERD</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-6">
            Confidential Laboratory Information System (LIMS) & ERD schema controls are strictly restricted to authenticated <strong>Laboratory Facility Login</strong> credentials per privacy guidelines.
          </p>
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
            Current User Role: {userRole} (Unauthorized)
          </div>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.pathogen.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResult = resultFilter === 'ALL' || r.testResult === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-300" /> Dedicated Laboratory ERD Module
              </span>
              <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                LIMS Private System
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Laboratory EHR & ERD System</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Internal Diagnostic Test ERD portal for specimen logs, pathogen detection, CSV dataset imports, and direct LIMS API integration.
            </p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-teal-800 hover:bg-teal-50 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} /> + Add Lab Test Record
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-8 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'records' ? 'bg-white text-teal-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <TestTube size={16} className={activeTab === 'records' ? 'text-teal-700' : 'text-white/80'} /> Diagnostic Test ERD Records ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'schema' ? 'bg-white text-teal-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Layers size={16} className={activeTab === 'schema' ? 'text-teal-700' : 'text-white/80'} /> LIMS Database ERD Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'ingestion' ? 'bg-white text-teal-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Server size={16} className={activeTab === 'ingestion' ? 'text-teal-700' : 'text-white/80'} /> CSV Import & LIMS API Sync
          </button>
        </div>
      </div>

      {/* --- TAB 1: LAB TEST ERD RECORDS --- */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Quick Laboratory Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Diagnostic Tests</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{records.length}</h3>
                <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} /> LIMS Verified Logs
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <TestTube size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Positive Pathogens Detected</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {records.filter(r => r.testResult === 'Positive').length}
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                  Actionable Surveillance Signal
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Activity size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Lab Positivity Rate</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {records.length > 0 ? Math.round((records.filter(r => r.testResult === 'Positive').length / records.length) * 100) : 0}%
                </h3>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                  High Sensitivity PCR/Serology
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">LIMS Integration Status</p>
                <h3 className="text-lg font-black text-emerald-600 mt-1">Active gRPC Stream</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <Shield size={12} /> Anonymized Data Stream
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
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
                placeholder="Search patient name, lab sample ID, or pathogen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter size={18} className="text-slate-400" />
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">All Test Results</option>
                <option value="Positive">Positive Pathogens</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Sample ID</th>
                    <th className="p-4">Patient Name & ID</th>
                    <th className="p-4">Specimen Type</th>
                    <th className="p-4">Collection Date</th>
                    <th className="p-4">Result Status</th>
                    <th className="p-4">Detected Pathogen</th>
                    <th className="p-4">Pathologist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-teal-700">{r.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{r.patientName}</div>
                        <div className="text-xs text-slate-400">{r.patientId} • {r.age} yrs • {r.gender}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-700">{r.specimenType}</td>
                      <td className="p-4 text-slate-600 text-xs font-mono">{r.sampleDate}</td>
                      <td className="p-4">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          r.testResult === 'Positive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {r.testResult}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{r.pathogen}</td>
                      <td className="p-4 text-slate-600 text-xs">{r.pathologist}</td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                        No laboratory ERD records matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: LIMS ERD SCHEMA VISUALIZER --- */}
      {activeTab === 'schema' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-teal-600" /> Laboratory (LIMS) Database ERD Schema Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-teal-500 rounded-2xl bg-teal-50/20 overflow-hidden">
              <div className="bg-teal-600 text-white font-bold p-3 text-sm">SPECIMENS (Entity)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-teal-700">🔑 sample_id (PK)</div>
                <div>🔗 patient_id (FK)</div>
                <div>specimen_type</div>
                <div>collection_timestamp</div>
              </div>
            </div>
            <div className="border-2 border-cyan-500 rounded-2xl bg-cyan-50/20 overflow-hidden">
              <div className="bg-cyan-600 text-white font-bold p-3 text-sm">TEST_RESULTS (Entity)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-cyan-700">🔑 result_id (PK)</div>
                <div>🔗 sample_id (FK)</div>
                <div>result_status</div>
                <div>pathogen_detected</div>
              </div>
            </div>
            <div className="border-2 border-emerald-500 rounded-2xl bg-emerald-50/20 overflow-hidden">
              <div className="bg-emerald-600 text-white font-bold p-3 text-sm">PATHOGEN_REPORTS (Entity)</div>
              <div className="p-3 text-xs font-mono space-y-1 bg-white">
                <div className="font-bold text-emerald-700">🔑 report_id (PK)</div>
                <div>pathogen_code</div>
                <div>severity_flag</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: INGESTION & LIMS API SYNC --- */}
      {activeTab === 'ingestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Option 1: LIMS CSV Bulk Upload</h3>
            <button onClick={downloadCsvTemplate} className="flex items-center gap-1.5 bg-teal-600 text-white text-xs font-bold px-3 py-2 rounded-xl">
              <Download size={14} /> Download LIMS CSV Template
            </button>
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center bg-slate-50">
              <UploadCloud size={36} className="text-slate-400 mx-auto mb-2" />
              <input type="file" accept=".csv" onChange={handleCsvFileChange} className="hidden" id="lab-csv-input" />
              <label htmlFor="lab-csv-input" className="cursor-pointer bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
                Browse CSV File
              </label>
              {csvFile && <p className="text-xs text-teal-600 mt-2 font-bold">{csvFile.name}</p>}
            </div>
            {csvPreview.length > 0 && (
              <button onClick={handleImportCsvSubmit} disabled={importingCsv} className="w-full bg-teal-600 text-white font-bold text-xs py-3 rounded-xl">
                {importingCsv ? 'Importing...' : `Import ${csvPreview.length} Lab Test Records`}
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Option 2: Direct LIMS API Connection</h3>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl">
              http://localhost:5000/api/erd/laboratory/sync
            </div>
            {syncLog.length > 0 && (
              <div className="bg-slate-950 text-slate-300 rounded-2xl p-3 font-mono text-[10px] space-y-1">
                {syncLog.map((log, idx) => <div key={idx}>{log}</div>)}
              </div>
            )}
            <button onClick={handleTriggerApiSync} disabled={syncingApi} className="w-full bg-teal-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
              <RefreshCw size={16} className={syncingApi ? 'animate-spin' : ''} /> Simulate Live LIMS API Sync
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Add Lab Test ERD Record</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTest} className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Patient Name</label>
                  <input type="text" required value={newTest.patientName} onChange={e => setNewTest({...newTest, patientName: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Detected Pathogen</label>
                  <input type="text" required value={newTest.pathogen} onChange={e => setNewTest({...newTest, pathogen: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-xl">Save Lab Test</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LaboratoryEhr;
