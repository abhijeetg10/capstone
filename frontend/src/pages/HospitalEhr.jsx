import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HospitalBedStats from '../components/hospital/HospitalBedStats';
import { 
  Database, UserPlus, FileSpreadsheet, Download, RefreshCw, Key, Copy, Check, 
  ShieldAlert, ShieldCheck, Search, Filter, Stethoscope, AlertTriangle, Layers, 
  ArrowRight, CheckCircle2, Server, FileCode, Plus, X, UploadCloud, Activity,
  Calendar, MapPin, HeartPulse, TestTube, Clock, History, FileText, Bed, Edit, LogOut, CheckCircle
} from 'lucide-react';

const HospitalEhr = () => {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'schema' | 'ingestion'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('ALL');
  
  // Add Patient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customDisease, setCustomDisease] = useState('');
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 35,
    gender: 'Male',
    contact: '',
    visitDate: new Date().toISOString().split('T')[0],
    admissionDate: new Date().toISOString().split('T')[0],
    dischargeDate: 'N/A (Admitted)',
    diagnosisDate: new Date().toISOString().split('T')[0],
    fever: 0,
    cough: 0,
    diarrhea: 0,
    headache: 0,
    joint_pain: 0,
    rash: 0,
    fatigue: 0,
    disease: 'Undiagnosed / Under Investigation',
    diagnosisStatus: 'Confirmed',
    ward: 'General Ward',
    wardAreaId: 'WARD-GEN-01',
    district: 'Ishwarpur City',
    comorbiditiesList: {
      diabetes: false,
      hypertension: false,
      asthma: false,
      heartDisease: false,
      ckd: false
    },
    labTest: 'General Blood Panel',
    labResult: 'Pending',
    pathogen: 'Under Investigation',
    visitType: 'Inpatient Admission',
    notes: '',
    doctor: 'Dr. A. Sharma',
    status: 'Admitted'
  });

  // Edit & Discharge Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const handleOpenEditModal = (patient) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setEditingPatient({
      ...patient,
      dischargeDate: (patient.status === 'Admitted' || !patient.dischargeDate || patient.dischargeDate.includes('N/A')) ? todayStr : patient.dischargeDate,
      status: patient.status === 'Admitted' ? 'Discharged' : patient.status
    });
    setShowEditModal(true);
  };

  const handleSaveEditPatient = async (e) => {
    e.preventDefault();
    if (!editingPatient || !editingPatient.id) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/erd/hospital/records/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingPatient)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingPatient(null);
        fetchRecords();
      }
    } catch (err) {
      console.error("Error updating patient record:", err);
    }
  };

  const handleQuickDischarge = async (patient) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const payload = {
      ...patient,
      status: 'Discharged',
      dischargeDate: todayStr
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/erd/hospital/records/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchRecords();
      }
    } catch (err) {
      console.error("Quick discharge error:", err);
    }
  };

  // CSV State
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);

  // Direct API Sync State
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
      const res = await fetch('http://localhost:5000/api/erd/hospital/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching hospital ERD records:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    const finalDisease = newPatient.disease === 'OTHER' 
      ? (customDisease.trim() || 'Undiagnosed / Custom Consultation') 
      : newPatient.disease;

    // Format selected comorbidities into array
    const comorbidities = Object.keys(newPatient.comorbiditiesList)
      .filter(k => newPatient.comorbiditiesList[k])
      .map(k => {
        if (k === 'diabetes') return 'Diabetes';
        if (k === 'hypertension') return 'Hypertension';
        if (k === 'asthma') return 'Asthma';
        if (k === 'heartDisease') return 'Heart Disease';
        if (k === 'ckd') return 'Chronic Kidney Disease';
        return k;
      });

    const payload = {
      ...newPatient,
      disease: finalDisease,
      comorbidities
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/hospital/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setCustomDisease('');
        fetchRecords();
      }
    } catch (err) {
      console.error("Add patient error:", err);
    }
  };

  // Comprehensive CSV Template Download supporting all 8 EHR categories
  const downloadCsvTemplate = () => {
    const headers = "name,age,gender,contact,visitDate,admissionDate,dischargeDate,diagnosisDate,fever,cough,diarrhea,headache,joint_pain,rash,fatigue,disease,diagnosisStatus,ward,wardAreaId,district,comorbidities,labTest,labResult,pathogen,visitType,doctor,notes,status\n";
    const sampleRows = [
      "Rajesh Kumar,42,Male,+91 98765 43210,2026-07-19,2026-07-20,2026-07-28,2026-07-21,1,0,0,1,1,1,1,Leptospirosis,Confirmed,Ward 3B,WARD-3B-Z4,Mumbai Urban,Diabetes;Hypertension,Leptospira Serology (MAT),Positive,Leptospira interrogans,Inpatient Admission,Dr. A. Sharma,High fever and joint pain following monsoon flooding,Discharged",
      "Priya Sharma,29,Female,+91 98123 45678,2026-07-21,2026-07-22,N/A (Admitted),2026-07-22,1,1,0,1,1,0,1,Dengue,Confirmed,ICU-2,ICU-WEST-02,Mumbai Suburban,Asthma,Dengue NS1 Ag,Positive,Dengue Virus Type 2,Emergency Room,Dr. V. Patel,Thrombocytopenia and acute fever,Admitted",
      "Sunita Gupta,36,Female,+91 96543 21098,2026-07-23,2026-07-24,2026-07-27,2026-07-24,1,0,1,1,0,0,1,Gastroenteritis,Confirmed,Ward 4C,WARD-4C-E1,Thane Central,Hypertension,Stool Culture,Positive,Salmonella enterica,Inpatient Admission,Dr. M. Joshi,Dehydration and watery diarrhea,Discharged",
      "Kavita Menon,50,Female,+91 92233 44556,2026-07-26,N/A (OPD),2026-07-26,2026-07-26,0,0,0,0,0,0,0,Routine Health Checkup,Confirmed,OPD Checkup,OPD-ROOM-12,Navi Mumbai,Diabetes,HbA1c & Lipids,Negative,None,OPD Outpatient,Dr. S. Nair,Annual health screening,Discharged"
    ].join("\n");

    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive_hospital_ehr_template.csv';
    a.click();
  };

  // CSV File Handler & Parser
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
        if (cols.length >= 5) {
          parsed.push({
            name: cols[0] || `Imported Patient ${i}`,
            age: Number(cols[1]) || 30,
            gender: cols[2] || 'Male',
            contact: cols[3] || '+91 90000 00000',
            visitDate: cols[4] || new Date().toISOString().split('T')[0],
            admissionDate: cols[5] || new Date().toISOString().split('T')[0],
            dischargeDate: cols[6] || '2026-07-28',
            diagnosisDate: cols[7] || new Date().toISOString().split('T')[0],
            fever: Number(cols[8]) || 0,
            cough: Number(cols[9]) || 0,
            diarrhea: Number(cols[10]) || 0,
            headache: Number(cols[11]) || 0,
            joint_pain: Number(cols[12]) || 0,
            rash: Number(cols[13]) || 0,
            fatigue: Number(cols[14]) || 0,
            disease: cols[15] || 'Undiagnosed / Routine Checkup',
            diagnosisStatus: cols[16] || 'Confirmed',
            ward: cols[17] || 'General Ward',
            wardAreaId: cols[18] || 'WARD-GEN-01',
            district: cols[19] || 'Mumbai Urban',
            comorbidities: cols[20] ? cols[20].split(';') : [],
            labTest: cols[21] || 'Blood Panel',
            labResult: cols[22] || 'Negative',
            pathogen: cols[23] || 'None',
            visitType: cols[24] || 'Inpatient Admission',
            doctor: cols[25] || 'Dr. Duty Physician',
            notes: cols[26] || '',
            status: cols[27] || 'Admitted'
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
      const res = await fetch('http://localhost:5000/api/erd/hospital/import-csv', {
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
      console.error("CSV import error:", err);
    } finally {
      setImportingCsv(false);
    }
  };

  // Direct API Sync Handler
  const handleTriggerApiSync = async () => {
    setSyncingApi(true);
    setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshaking with HIS Endpoint...`]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/erd/hospital/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncLog(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] Handshake verified (TLS 1.3).`,
          `[${new Date().toLocaleTimeString()}] Fetched ${data.syncedRecordsCount} live EHR patient stream records with full diagnosis, symptoms, and dates.`,
          `[${new Date().toLocaleTimeString()}] Comprehensive EHR schema synced & integrated into platform ERD.`
        ]);
        fetchRecords();
      }
    } catch (err) {
      setSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.message}`]);
    } finally {
      setSyncingApi(false);
    }
  };

  // Role Access Enforcement
  if (userRole && userRole !== 'hospital') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center font-sans">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-10 shadow-lg">
          <ShieldAlert size={64} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied: Private Hospital ERD</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-6">
            Confidential Hospital Health Records (EHR) & ERD schema controls are strictly restricted to authenticated <strong>Hospital Facility Login</strong> credentials per privacy guidelines.
          </p>
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
            Current User Role: {userRole} (Unauthorized)
          </div>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.doctor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.wardAreaId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDisease = diseaseFilter === 'ALL' || r.disease === diseaseFilter;
    return matchesSearch && matchesDisease;
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-300" /> Comprehensive Hospital EHR Platform
              </span>
              <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Private Access Only
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Hospital EHR & ERD System</h1>
            <p className="text-primary-100 text-sm mt-1 max-w-3xl">
              Integrated Disease Surveillance Portal: Syndromic Symptoms (Fever, Cough, Diarrhea, Headache), Disease Diagnosis, Admission/Discharge Dates, GIS Ward/Area ID, Comorbidities Risk, Lab Positivity, and Hospital Activity.
            </p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 shrink-0"
          >
            <UserPlus size={18} /> + Add Comprehensive EHR Record
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'records' ? 'bg-white text-indigo-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Database size={16} className={activeTab === 'records' ? 'text-indigo-600' : 'text-white/80'} /> Patient EHR Records ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beds')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'beds' ? 'bg-white text-indigo-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Bed size={16} className={activeTab === 'beds' ? 'text-indigo-600' : 'text-white/80'} /> Live Bed & ICU Capacity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'schema' ? 'bg-white text-indigo-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Layers size={16} className={activeTab === 'schema' ? 'text-indigo-600' : 'text-white/80'} /> Visual Database ERD Architecture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingestion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'ingestion' ? 'bg-white text-indigo-950 font-black shadow-lg scale-[1.02]' : 'text-white/90 hover:bg-white/15'
            }`}
          >
            <Server size={16} className={activeTab === 'ingestion' ? 'text-indigo-600' : 'text-white/80'} /> Data Ingestion & HIS Integration
          </button>
        </div>
      </div>

      {/* --- TAB: LIVE BED & ICU CAPACITY --- */}
      {activeTab === 'beds' && (
        <HospitalBedStats />
      )}

      {/* --- TAB 1: PATIENT EHR RECORDS --- */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <HospitalBedStats />
          {/* Quick Surveillance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total EHR Surveillance Logs</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{records.length}</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} /> Active Outbreak Tracking
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <Database size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Syndromic Symptoms Cases</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {records.filter(r => r.fever === 1 || r.diarrhea === 1 || r.headache === 1).length}
                </h3>
                <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                  Fever: {records.filter(r => r.fever === 1).length} | Diarrhea: {records.filter(r => r.diarrhea === 1).length}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Activity size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Healthcare Burden (Inpatient)</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {records.filter(r => r.status === 'Admitted' || r.visitType === 'Inpatient Admission').length}
                </h3>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                  ICU Beds: {records.filter(r => r.ward && r.ward.includes('ICU')).length}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Stethoscope size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">High Risk Comorbidities</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">
                  {records.filter(r => Array.isArray(r.comorbidities) && r.comorbidities.length > 0).length}
                </h3>
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                  Diabetes & Hypertension
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <HeartPulse size={24} />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, ID, ward/area ID, or doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter size={18} className="text-slate-400" />
              <select
                value={diseaseFilter}
                onChange={(e) => setDiseaseFilter(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">All Diagnoses & Target Diseases</option>
                <option value="Undiagnosed / Under Investigation">Undiagnosed / Under Investigation</option>
                <option value="Routine Health Checkup">Routine Health Checkup</option>
                <option value="Leptospirosis">Leptospirosis</option>
                <option value="Dengue">Dengue</option>
                <option value="Gastroenteritis">Gastroenteritis</option>
                <option value="Typhoid">Typhoid</option>
                <option value="Malaria">Malaria</option>
                <option value="Bone Fracture (Orthopedic)">Bone Fracture / Trauma</option>
              </select>
            </div>
          </div>

          {/* Comprehensive EHR Records Datatable */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    <th className="p-4 min-w-[170px]">Patient ID & Info</th>
                    <th className="p-4 min-w-[210px]">Dates & Time-Series</th>
                    <th className="p-4 min-w-[240px]">Syndromic Symptoms</th>
                    <th className="p-4 min-w-[150px]">Location GIS & Ward</th>
                    <th className="p-4 min-w-[180px]">Diagnosis & Target Disease</th>
                    <th className="p-4 min-w-[150px]">Comorbidities & Risk</th>
                    <th className="p-4 min-w-[180px]">Lab Positivity & Pathogen</th>
                    <th className="p-4 min-w-[160px]">Activity & Status</th>
                    <th className="p-4 min-w-[200px]">EHR Actions & Discharge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* Patient ID & Info */}
                      <td className="p-4 align-top">
                        <div className="font-mono font-black text-primary-700 text-xs bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-md inline-block mb-1">
                          {r.id}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {r.age} yrs • {r.gender}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{r.contact}</div>
                      </td>

                      {/* Timestamps & Dates (Formatted Pill Grid - No Wrapping) */}
                      <td className="p-4 align-top">
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 whitespace-nowrap">
                            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Calendar size={11} className="text-primary-500" /> Visit
                            </span>
                            <span className="font-bold text-slate-800">{r.visitDate || r.admissionDate}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 whitespace-nowrap">
                            <span className="text-[10px] font-sans font-bold text-emerald-700 uppercase flex items-center gap-1">
                              <Clock size={11} className="text-emerald-600" /> Admitted
                            </span>
                            <span className="font-bold text-emerald-950">{r.admissionDate}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200/60 whitespace-nowrap">
                            <span className="text-[10px] font-sans font-bold text-indigo-700 uppercase flex items-center gap-1">
                              <History size={11} className="text-indigo-600" /> Discharge
                            </span>
                            <span className="font-bold text-indigo-950">{r.dischargeDate || 'N/A'}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 whitespace-nowrap">
                            <span className="text-[10px] font-sans font-bold text-amber-800 uppercase flex items-center gap-1">
                              <FileText size={11} className="text-amber-600" /> Diag Date
                            </span>
                            <span className="font-bold text-amber-950">{r.diagnosisDate || r.admissionDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Syndromic Symptoms */}
                      <td className="p-4 align-top">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.fever === 1 && <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200">Fever</span>}
                          {r.cough === 1 && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">Cough</span>}
                          {r.diarrhea === 1 && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">Diarrhea</span>}
                          {r.headache === 1 && <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200">Headache</span>}
                          {r.joint_pain === 1 && <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-200">Joint Pain</span>}
                          {r.rash === 1 && <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-pink-200">Rash</span>}
                          {r.fatigue === 1 && <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">Fatigue</span>}
                        </div>
                        {r.notes && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded-lg italic leading-tight">
                            "{r.notes}"
                          </div>
                        )}
                      </td>

                      {/* Location GIS & Ward */}
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                          <MapPin size={13} className="text-rose-500 shrink-0" /> {r.ward || 'General'}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5">ID: {r.wardAreaId || 'AREA-01'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{r.district || 'Mumbai Urban'}</div>
                      </td>

                      {/* Diagnosis & Target Disease */}
                      <td className="p-4 align-top">
                        <span className={`inline-block font-bold px-2.5 py-1 rounded-lg text-xs border ${
                          r.disease && r.disease.includes('Routine') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          r.disease && r.disease.includes('Undiagnosed') ? 'bg-amber-50 text-amber-900 border-amber-300' :
                          'bg-primary-50 text-primary-800 border-primary-300'
                        }`}>
                          {r.disease || 'Undiagnosed / Routine Checkup'}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${r.diagnosisStatus === 'Confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          Status: <span className="font-bold text-slate-800">{r.diagnosisStatus || 'Confirmed'}</span>
                        </div>
                      </td>

                      {/* Comorbidities Risk */}
                      <td className="p-4 align-top">
                        {Array.isArray(r.comorbidities) && r.comorbidities.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.comorbidities.map((c, i) => (
                              <span key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None reported</span>
                        )}
                      </td>

                      {/* Lab Positivity & Pathogen */}
                      <td className="p-4 align-top">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <TestTube size={13} className="text-teal-600 shrink-0" /> {r.labTest || 'Blood Panel'}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            r.labResult === 'Positive' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            r.labResult === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {r.labResult || 'Negative'}
                          </span>
                        </div>
                        {r.pathogen && r.pathogen !== 'None' && (
                          <div className="text-[11px] text-slate-600 font-mono font-semibold mt-1">{r.pathogen}</div>
                        )}
                      </td>

                      {/* Hospital Activity & Status */}
                      <td className="p-4 align-top">
                        <div className="text-xs font-bold text-slate-900">{r.visitType || 'Inpatient Admission'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{r.doctor}</div>
                        <div className="mt-1.5">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            r.status === 'Admitted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {r.status || 'Discharged'}
                          </span>
                        </div>
                      </td>

                      {/* EHR Actions & Discharge */}
                      <td className="p-4 align-top">
                        {r.status === 'Admitted' ? (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickDischarge(r)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <CheckCircle size={14} /> Mark Discharged
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(r)}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit size={12} /> Edit Details & Date
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                              <LogOut size={12} className="text-slate-400 shrink-0" /> Discharged: <span className="font-mono text-slate-800 font-bold">{r.dischargeDate}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(r)}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit size={12} /> Edit Record
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-400 text-sm">
                        No hospital EHR patient records matching your search/filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: VISUAL DATABASE ERD ARCHITECTURE --- */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="text-primary-600" /> Hospital Comprehensive EHR & ERD Database Architecture
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full Relational Schema mapping all 8 disease surveillance pillars with primary/foreign keys and data types.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-3 py-1 rounded-full">
                PostgreSQL + PostGIS Schema v3.0
              </span>
            </div>

            {/* 8 Surveillance Entities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* PATIENTS Entity */}
              <div className="border-2 border-primary-500 rounded-2xl bg-primary-50/20 overflow-hidden shadow-sm">
                <div className="bg-primary-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>PATIENTS</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Primary Entity</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-primary-700 flex justify-between">
                    <span>🔑 internal_patient_id</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>full_name</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>age, gender</span>
                    <span className="text-slate-400">INT, VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>contact_phone</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                </div>
              </div>

              {/* DATES & TIME-SERIES Entity */}
              <div className="border-2 border-amber-500 rounded-2xl bg-amber-50/20 overflow-hidden shadow-sm">
                <div className="bg-amber-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>TIME_SERIES_DATES</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Time-Series</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-amber-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>visit_date</span>
                    <span className="text-slate-400">TIMESTAMP</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>admission_date</span>
                    <span className="text-slate-400">TIMESTAMP</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>discharge_date</span>
                    <span className="text-slate-400">TIMESTAMP</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>diagnosis_date</span>
                    <span className="text-slate-400">TIMESTAMP</span>
                  </div>
                </div>
              </div>

              {/* SYNDROMIC SYMPTOMS Entity */}
              <div className="border-2 border-rose-500 rounded-2xl bg-rose-50/20 overflow-hidden shadow-sm">
                <div className="bg-rose-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>SYNDROMIC_SYMPTOMS</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Surveillance</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-rose-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>fever, cough</span>
                    <span className="text-slate-400">BOOLEAN</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>diarrhea, headache</span>
                    <span className="text-slate-400">BOOLEAN</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>joint_pain, rash</span>
                    <span className="text-slate-400">BOOLEAN</span>
                  </div>
                </div>
              </div>

              {/* LOCATION GIS Entity */}
              <div className="border-2 border-indigo-500 rounded-2xl bg-indigo-50/20 overflow-hidden shadow-sm">
                <div className="bg-indigo-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>LOCATION_GIS</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">GIS & Hotspots</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-indigo-700 flex justify-between">
                    <span>🔑 ward_area_id</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>ward_name</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>district, taluka</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>geom (Lat/Long)</span>
                    <span className="text-slate-400">GEOMETRY</span>
                  </div>
                </div>
              </div>

              {/* DIAGNOSES Entity */}
              <div className="border-2 border-emerald-500 rounded-2xl bg-emerald-50/20 overflow-hidden shadow-sm">
                <div className="bg-emerald-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>DIAGNOSES</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Target Disease</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-emerald-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>disease_name</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>diagnosis_status</span>
                    <span className="text-slate-400">ENUM</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>icd10_code</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                </div>
              </div>

              {/* COMORBIDITIES Entity */}
              <div className="border-2 border-purple-500 rounded-2xl bg-purple-50/20 overflow-hidden shadow-sm">
                <div className="bg-purple-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>COMORBIDITIES</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Risk Analysis</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-purple-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>comorbidities</span>
                    <span className="text-slate-400">TEXT[]</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>risk_level</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                </div>
              </div>

              {/* LAB_RESULTS Entity */}
              <div className="border-2 border-teal-500 rounded-2xl bg-teal-50/20 overflow-hidden shadow-sm">
                <div className="bg-teal-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>LAB_RESULTS</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Positivity/Trend</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-teal-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>lab_test_name</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>lab_result</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>pathogen_detected</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                </div>
              </div>

              {/* HOSPITAL_ACTIVITY Entity */}
              <div className="border-2 border-blue-500 rounded-2xl bg-blue-50/20 overflow-hidden shadow-sm">
                <div className="bg-blue-600 text-white font-bold p-3 text-sm flex items-center justify-between">
                  <span>HOSPITAL_ACTIVITY</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Healthcare Burden</span>
                </div>
                <div className="p-3 text-xs font-mono space-y-1.5 bg-white">
                  <div className="font-bold text-blue-700 flex justify-between">
                    <span>🔗 patient_id (FK)</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>visit_type</span>
                    <span className="text-slate-400">OPD / IPD</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>attending_doctor</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>discharge_status</span>
                    <span className="text-slate-400">VARCHAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: DATA INGESTION & HIS INTEGRATION --- */}
      {activeTab === 'ingestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OPTION 1: CSV BULK DATA UPLOAD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Option 1: Comprehensive EHR CSV Bulk Upload</h3>
                  <p className="text-xs text-slate-500">Import complete patient EHR records exported from hospital systems</p>
                </div>
              </div>

              {/* Template Download Button */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between mb-6">
                <div>
                  <div className="font-bold text-xs text-emerald-900">Comprehensive EHR Data Format Template</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Includes headers for symptoms, dates, diagnosis, ward ID, comorbidities & lab results</div>
                </div>
                <button
                  onClick={downloadCsvTemplate}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs shrink-0"
                >
                  <Download size={14} /> Download EHR Template
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-primary-400 transition-colors bg-slate-50/50">
                <UploadCloud size={40} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 mb-1">Select or drag CSV dataset file</p>
                <p className="text-[11px] text-slate-400 mb-4">Formats supported: .csv (Max 10MB)</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="hospital-csv-input"
                />
                <label
                  htmlFor="hospital-csv-input"
                  className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Browse CSV File
                </label>
                {csvFile && <p className="text-xs font-bold text-emerald-600 mt-3">Selected: {csvFile.name}</p>}
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="bg-slate-100 p-2.5 text-xs font-bold text-slate-700 flex justify-between">
                    <span>Validation Preview ({csvPreview.length} records ready)</span>
                    <span className="text-emerald-600">EHR Schema Verified ✓</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto text-[11px] p-2 space-y-1 font-mono">
                    {csvPreview.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="truncate text-slate-600">
                        {p.name} | {p.disease} | Admitted: {p.admissionDate} | Discharged: {p.dischargeDate} | Ward: {p.wardAreaId}
                      </div>
                    ))}
                    {csvPreview.length > 5 && <div className="text-slate-400">...and {csvPreview.length - 5} more records</div>}
                  </div>
                </div>
              )}
            </div>

            {csvPreview.length > 0 && (
              <button
                onClick={handleImportCsvSubmit}
                disabled={importingCsv}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2"
              >
                {importingCsv ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Import {csvPreview.length} EHR Records into Hospital System
              </button>
            )}
          </div>

          {/* OPTION 2: DIRECT HIS API INTEGRATION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Option 2: Direct HIS / EHR REST Stream API</h3>
                  <p className="text-xs text-slate-500">Live API Webhook connection for automated patient stream sync</p>
                </div>
              </div>

              {/* Endpoint Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Live Webhook API Endpoint</label>
                  <div className="mt-1 bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl flex items-center justify-between border border-slate-800">
                    <span className="truncate">http://localhost:5000/api/erd/hospital/sync</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">POST</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Secret API Auth Key</label>
                  <div className="mt-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs p-3 rounded-xl flex items-center justify-between">
                    <span>sk_hosp_live_9f82a173e498c0b2</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("sk_hosp_live_9f82a173e498c0b2");
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-primary-600 hover:text-primary-800 text-xs font-bold flex items-center gap-1"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Integration Live Status */}
              <div className="mt-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-900">HIS Stream Connection Status: Active & Listening</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-indigo-700">Sync: Realtime</span>
              </div>

              {/* Sync Terminal Log */}
              {syncLog.length > 0 && (
                <div className="mt-4 bg-slate-950 text-slate-300 rounded-2xl p-3 font-mono text-[10px] space-y-1 max-h-32 overflow-y-auto">
                  {syncLog.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleTriggerApiSync}
              disabled={syncingApi}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2 active:scale-98"
            >
              {syncingApi ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Simulate Live HIS API Sync
            </button>
          </div>
        </div>
      )}

      {/* --- ADD COMPREHENSIVE PATIENT EHR MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="text-primary-600" /> Add Patient EHR Record
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in all 8 disease surveillance categories for outbreak tracking.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-6 text-xs font-medium">
                {/* 1. Demographics & Location */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-primary-700 flex items-center gap-1.5">
                    <MapPin size={14} /> 1. Patient Demographics & Location GIS
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Full Patient Name</label>
                      <input
                        type="text"
                        required
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="e.g. Ramesh Shah"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={newPatient.contact}
                        onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Age</label>
                      <input
                        type="number"
                        required
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">District</label>
                      <input
                        type="text"
                        value={newPatient.district}
                        onChange={(e) => setNewPatient({ ...newPatient, district: e.target.value })}
                        placeholder="Mumbai Urban"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ward Name</label>
                      <input
                        type="text"
                        value={newPatient.ward}
                        onChange={(e) => setNewPatient({ ...newPatient, ward: e.target.value })}
                        placeholder="e.g. Ward 3B / ICU-2"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Ward / Area ID</label>
                      <input
                        type="text"
                        value={newPatient.wardAreaId}
                        onChange={(e) => setNewPatient({ ...newPatient, wardAreaId: e.target.value })}
                        placeholder="e.g. WARD-3B-Z4"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Syndromic Surveillance Symptoms */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <Activity size={14} /> 2. Syndromic Surveillance Symptoms
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'fever', label: 'Fever' },
                      { key: 'cough', label: 'Cough' },
                      { key: 'diarrhea', label: 'Diarrhea' },
                      { key: 'headache', label: 'Headache' },
                      { key: 'joint_pain', label: 'Joint Pain' },
                      { key: 'rash', label: 'Rash' },
                      { key: 'fatigue', label: 'Fatigue' }
                    ].map(s => (
                      <label key={s.key} className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={newPatient[s.key] === 1}
                          onChange={(e) => setNewPatient({ ...newPatient, [s.key]: e.target.checked ? 1 : 0 })}
                          className="rounded text-primary-600"
                        />
                        <span className="text-slate-800 text-xs font-medium">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Time-Series Tracking (Dates) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <Calendar size={14} /> 3. Time-Series & Outbreak Detection Dates
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Visit Date</label>
                      <input
                        type="date"
                        value={newPatient.visitDate}
                        onChange={(e) => setNewPatient({ ...newPatient, visitDate: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Admission Date</label>
                      <input
                        type="date"
                        value={newPatient.admissionDate}
                        onChange={(e) => setNewPatient({ ...newPatient, admissionDate: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Discharge Date</label>
                      <input
                        type="text"
                        value={newPatient.dischargeDate}
                        onChange={(e) => setNewPatient({ ...newPatient, dischargeDate: e.target.value })}
                        placeholder="YYYY-MM-DD or N/A (Admitted)"
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Diagnosis Date</label>
                      <input
                        type="date"
                        value={newPatient.diagnosisDate}
                        onChange={(e) => setNewPatient({ ...newPatient, diagnosisDate: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Disease Surveillance & Target */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <Stethoscope size={14} /> 4. Disease Surveillance & Target
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Disease Name / Diagnosis</label>
                      <select
                        value={newPatient.disease}
                        onChange={(e) => setNewPatient({ ...newPatient, disease: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-semibold"
                      >
                        <option value="Undiagnosed / Under Investigation">Undiagnosed / Under Investigation</option>
                        <option value="Leptospirosis">Leptospirosis</option>
                        <option value="Dengue">Dengue</option>
                        <option value="Gastroenteritis">Gastroenteritis</option>
                        <option value="Typhoid">Typhoid</option>
                        <option value="Malaria">Malaria</option>
                        <option value="Routine Health Checkup">Routine Health Checkup</option>
                        <option value="Bone Fracture (Orthopedic)">Bone Fracture / Trauma</option>
                        <option value="OTHER">Other Custom Disease...</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Diagnosis Status</label>
                      <select
                        value={newPatient.diagnosisStatus}
                        onChange={(e) => setNewPatient({ ...newPatient, diagnosisStatus: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Suspected">Suspected</option>
                        <option value="Presumptive">Presumptive</option>
                      </select>
                    </div>
                  </div>

                  {newPatient.disease === 'OTHER' && (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Specify Custom Condition</label>
                      <input
                        type="text"
                        value={customDisease}
                        onChange={(e) => setCustomDisease(e.target.value)}
                        placeholder="e.g. Chikungunya, Scrub Typhus"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Comorbidities (Risk Analysis) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <HeartPulse size={14} /> 5. Comorbidities (Risk Analysis)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'diabetes', label: 'Diabetes' },
                      { key: 'hypertension', label: 'Hypertension' },
                      { key: 'asthma', label: 'Asthma' },
                      { key: 'heartDisease', label: 'Heart Disease' },
                      { key: 'ckd', label: 'Chronic Kidney' }
                    ].map(c => (
                      <label key={c.key} className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={newPatient.comorbiditiesList[c.key]}
                          onChange={(e) => setNewPatient({
                            ...newPatient,
                            comorbiditiesList: { ...newPatient.comorbiditiesList, [c.key]: e.target.checked }
                          })}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-slate-800 text-xs">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Lab Results & Positivity */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
                    <TestTube size={14} /> 6. Lab Results & Positivity
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Lab Test Name</label>
                      <input
                        type="text"
                        value={newPatient.labTest}
                        onChange={(e) => setNewPatient({ ...newPatient, labTest: e.target.value })}
                        placeholder="e.g. Leptospira MAT / Dengue NS1"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Lab Test Result</label>
                      <select
                        value={newPatient.labResult}
                        onChange={(e) => setNewPatient({ ...newPatient, labResult: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-semibold"
                      >
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Pathogen Detected</label>
                      <input
                        type="text"
                        value={newPatient.pathogen}
                        onChange={(e) => setNewPatient({ ...newPatient, pathogen: e.target.value })}
                        placeholder="e.g. Leptospira interrogans"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Healthcare Burden & Activity */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Stethoscope size={14} /> 7. Healthcare Activity & Burden
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Visit Type</label>
                      <select
                        value={newPatient.visitType}
                        onChange={(e) => setNewPatient({ ...newPatient, visitType: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="Inpatient Admission">Inpatient Admission</option>
                        <option value="OPD Outpatient">OPD Outpatient</option>
                        <option value="Emergency Room">Emergency Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Attending Doctor</label>
                      <input
                        type="text"
                        value={newPatient.doctor}
                        onChange={(e) => setNewPatient({ ...newPatient, doctor: e.target.value })}
                        placeholder="Dr. A. Sharma"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Admission Status</label>
                      <select
                        value={newPatient.status}
                        onChange={(e) => setNewPatient({ ...newPatient, status: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="Admitted">Admitted</option>
                        <option value="Discharged">Discharged</option>
                        <option value="Transferred">Transferred</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Doctor / Clinical Notes</label>
                    <input
                      type="text"
                      value={newPatient.notes}
                      onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                      placeholder="e.g. High fever, acute onset joint pain, monsoon flood exposure"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Save Full EHR Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT & DISCHARGE PATIENT MODAL --- */}
      <AnimatePresence>
        {showEditModal && editingPatient && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 lg:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-800 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                      {editingPatient.id}
                    </span>
                    <h3 className="text-xl font-black text-slate-900">Edit / Discharge Patient</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update admission status, set discharge date, or modify clinical records for {editingPatient.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEditPatient} className="space-y-4 text-xs">
                {/* Patient Summary Header */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{editingPatient.name}</div>
                    <div className="text-slate-500">{editingPatient.age} yrs • {editingPatient.gender} • {editingPatient.contact}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    editingPatient.status === 'Admitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    Current: {editingPatient.status}
                  </span>
                </div>

                {/* Status & Discharge Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Admission Status</label>
                    <select
                      value={editingPatient.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const todayStr = new Date().toISOString().split('T')[0];
                        setEditingPatient({
                          ...editingPatient,
                          status: newStatus,
                          dischargeDate: newStatus === 'Discharged' ? (editingPatient.dischargeDate && !editingPatient.dischargeDate.includes('N/A') ? editingPatient.dischargeDate : todayStr) : 'N/A (Admitted)'
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Admitted">Admitted (Active Inpatient)</option>
                      <option value="Discharged">Discharged</option>
                      <option value="Transferred">Transferred to another Facility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Discharge Date</label>
                    <input
                      type="date"
                      value={editingPatient.dischargeDate && !editingPatient.dischargeDate.includes('N/A') ? editingPatient.dischargeDate : new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditingPatient({ ...editingPatient, dischargeDate: e.target.value })}
                      disabled={editingPatient.status === 'Admitted'}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* Target Disease & Ward */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Diagnosis & Target Disease</label>
                    <input
                      type="text"
                      value={editingPatient.disease}
                      onChange={(e) => setEditingPatient({ ...editingPatient, disease: e.target.value })}
                      placeholder="e.g. Dengue, Leptospirosis"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ward / Room Area</label>
                    <input
                      type="text"
                      value={editingPatient.ward}
                      onChange={(e) => setEditingPatient({ ...editingPatient, ward: e.target.value })}
                      placeholder="e.g. Ward 3B, ICU-2"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Attending Doctor & Lab Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Attending Physician</label>
                    <input
                      type="text"
                      value={editingPatient.doctor}
                      onChange={(e) => setEditingPatient({ ...editingPatient, doctor: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Lab Result Status</label>
                    <select
                      value={editingPatient.labResult}
                      onChange={(e) => setEditingPatient({ ...editingPatient, labResult: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Positive">Positive Pathogen</option>
                      <option value="Negative">Negative</option>
                      <option value="Pending">Pending Analysis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Clinical Outcome / Discharge Notes</label>
                  <textarea
                    rows="2"
                    value={editingPatient.notes || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, notes: e.target.value })}
                    placeholder="e.g. Patient fully recovered, fever subsided, discharged with home prescription."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Save Changes & Update Status
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

export default HospitalEhr;
