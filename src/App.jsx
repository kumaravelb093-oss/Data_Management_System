import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3,
  ChevronRight, Activity, Database, Users, TrendingUp, Printer,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PRODUCTION CONFIGURATION
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * REUSABLE API CLIENT
 */
const submitToGas = async (payload) => {
  try {
    if (!API_URL) throw new Error('VITE_API_URL is missing');
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};

const App = () => {
  const [view, setView] = useState('home');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (!API_URL) return;
      const response = await fetch(API_URL, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow'
      });
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      showNotification('Sync Error: Check Authorization', 'error');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setView('register');
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setView('register');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Stethoscope className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Guru Ortho</h1>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-80">Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view !== 'home' && (
              <button
                onClick={() => setView('home')}
                className="clinical-btn-secondary"
              >
                <Home size={18} /> <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <button
              onClick={handleAdd}
              className="clinical-btn-primary"
            >
              <Plus size={18} /> <span>New Admission</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Dashboard
              key="home"
              records={records}
              loading={loading}
              onRefresh={loadRecords}
              onViewRecord={(rec) => setSelectedRecord(rec)}
              onEditRecord={handleEdit}
            />
          )}
          {view === 'register' && (
            <RegistrationForm
              key="reg"
              editData={editingRecord}
              onSuccess={(msg) => {
                showNotification(msg || 'Synced successfully');
                loadRecords();
                setView('home');
              }}
              onError={(err) => showNotification(err, 'error')}
              onCancel={() => setView('home')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <Modal record={selectedRecord} onClose={() => setSelectedRecord(null)} onEdit={() => handleEdit(selectedRecord)} />
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold text-sm z-[100] flex items-center gap-3 ${notification.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ records, loading, onRefresh, onViewRecord, onEditRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'OP', 'IP'

  // Date-based Timeline Calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    today: records.filter(r => new Date(r.entry_date_time) >= today).length,
    op: records.filter(r => r.service_type?.trim().toUpperCase() === 'OP').length,
    ip: records.filter(r => r.service_type?.trim().toUpperCase() === 'IP').length,
    total: records.length
  };

  const filtered = records.filter(r => {
    // Search normalization
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = search === '' || (
      r.patient_name?.toLowerCase().includes(search) ||
      String(r.mobile_number).includes(search) ||
      r.patient_id?.toLowerCase().includes(search)
    );

    // Tab filtering with normalization to fix "empty OP area" issue
    const recordSector = r.service_type?.trim().toUpperCase();
    const targetSector = activeTab.trim().toUpperCase();

    const matchesTab = activeTab === 'All' || recordSector === targetSector;

    return matchesSearch && matchesTab;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

      {/* Enhanced Analytics (Timeline + Sectors) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatItem label="Admission Today" value={stats.today} icon={<Clock size={20} />} color="text-amber-600" />
        <StatItem label="Out-Patient (OP)" value={stats.op} icon={<TrendingUp size={20} />} color="text-blue-600" />
        <StatItem label="In-Patient (IP)" value={stats.ip} icon={<Activity size={20} />} color="text-indigo-600" />
        <StatItem label="Total Registry" value={stats.total} icon={<Users size={20} />} color="text-slate-600" />
      </div>

      {/* Sector Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-8">
          {['All', 'OP', 'IP'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab} Patients
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-3">
          <button onClick={onRefresh} className="text-slate-400 hover:text-blue-600 transition-all p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'All' ? 'all' : activeTab} records by name, mobile, or ID...`}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-lg"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full patient-table border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th>Entry Date & Time</th>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Age/Gender</th>
                <th>Sector</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <tr key={i} onClick={() => onViewRecord(record)} className="table-row">
                  <td className="whitespace-nowrap">
                    {new Date(record.entry_date_time).toLocaleDateString()}
                    <span className="text-[10px] text-slate-400 ml-2">{new Date(record.entry_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{record.patient_id}</span></td>
                  <td className="font-bold text-slate-900">{record.patient_name}</td>
                  <td>{record.age}y / {record.gender}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {record.service_type || 'OP'}
                    </span>
                  </td>
                  <td>{record.mobile_number}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-medium">
                    No {activeTab !== 'All' ? activeTab : ''} records identified in the registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-10">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Cloud Data Management Active • {records.length} Records Synced
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
    </div>
    <div className={`p-4 rounded-xl bg-slate-50 ${color} shadow-inner`}>
      {icon}
    </div>
  </div>
);

const RegistrationForm = ({ editData, onSuccess, onError, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    service_type: 'OP',
    diagnosis: '', treatment: '', remarks: ''
  });
  const [media, setMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('camera');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.patient_name || '',
        age: editData.age || '',
        gender: editData.gender || 'Male',
        mobile: editData.mobile_number || '',
        service_type: editData.service_type || 'OP',
        diagnosis: recordValue(editData.diagnosis),
        treatment: recordValue(editData.treatment),
        remarks: recordValue(editData.remarks)
      });
    }
  }, [editData]);

  const recordValue = (val) => val === 'No entry documented' ? '' : val;

  useEffect(() => {
    if (!media) startStream();
    return () => stopStream();
  }, [mode, media]);

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: mode === 'video'
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) { console.warn("Cam fail"); }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setMedia({ base64: canvas.toDataURL('image/jpeg'), type: 'image/jpeg', name: `pic_${Date.now()}.jpg` });
  };

  const startRecording = () => {
    setIsRecording(true);
    const chunks = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => (e.data.size > 0) && chunks.push(e.data);
    mr.onstop = () => {
      const reader = new FileReader();
      reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
      reader.onloadend = () => setMedia({ base64: reader.result, type: 'video/webm', name: `vid_${Date.now()}.webm` });
    };
    mr.start();
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        media,
        patient_id: editData?.patient_id || null,
        entry_date_time: editData?.entry_date_time || null,
        existingMediaUrl: editData?.media_file_url || '',
        enteredBy: 'Practioner'
      };
      const res = await submitToGas(payload);
      if (res.success) onSuccess(res.message);
      else onError(res.error || 'Server rejected');
    } catch (err) { onError('Sync Fail'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editData ? 'Modify Record' : 'Admission Protocol'}</h2>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Registry Initialization Flow</p>
        </div>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-all bg-white rounded-full shadow-sm border border-slate-100">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity Section */}
          <section className="glass-card p-8 space-y-6">
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
              <User size={14} /> Identity & Sector
            </h4>
            <div className="space-y-5">
              <TextField label="Patient Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
                <SelectBox label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
              </div>
              <TextField label="Mobile Number" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
              <SelectBox label="Hosp. Sector (OP/IP)" value={formData.service_type} options={['OP', 'IP']} onChange={v => setFormData({ ...formData, service_type: v })} />
            </div>
          </section>

          {/* Multimedia Diagnostic Section */}
          <section className="glass-card p-8 space-y-6 flex flex-col">
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
              <Camera size={14} /> Diagnostic Clinical Media
            </h4>
            <div className="flex-1 aspect-video bg-slate-900 rounded-[24px] overflow-hidden relative shadow-inner border-2 border-slate-200">
              {media || (editData?.media_file_url && !media) ? (
                <div className="w-full h-full relative">
                  {media ? (
                    media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center px-6">Multimedia Attachment Verified & Preserved</div>
                  )}
                  <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-4 right-4 p-3 bg-white shadow-xl text-rose-500 rounded-2xl hover:bg-rose-50 transition-all"> <RotateCcw size={18} /> </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="flex bg-white/10 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/20">
                      <button type="button" onClick={() => setMode('camera')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>X-Ray</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>Video</button>
                    </div>
                    {mode === 'camera' ? (
                      <button type="button" onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all border-4 border-slate-100"> <Camera size={28} className="text-blue-600" /> </button>
                    ) : (
                      <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all border-4 ${isRecording ? 'bg-rose-500 border-rose-100 animate-pulse' : 'bg-white border-slate-100'}`}> {isRecording ? <Square size={24} className="text-white" /> : <Play size={24} className="text-blue-600 ml-1" />} </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Cloud Storage Sync Enabled</p>
          </section>
        </div>

        {/* Observation Section */}
        <section className="glass-card p-10 space-y-8">
          <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
            <ClipboardList size={14} /> Practitioner Observation Protocol
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AreaField label="Diagnosis Details" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
            <AreaField label="Treatment Protocol" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
            <AreaField label="Case Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
          </div>
        </section>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-200 transition-all">Cancel Admission</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4">
            {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : (editData ? 'Commit Record Update' : 'Initialize Admission Sync')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const TextField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">{label}</label>
    <input
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 text-sm"
    />
  </div>
);

const SelectBox = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-black text-slate-700 text-sm appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const AreaField = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 leading-none">{label}</label>
    <textarea
      rows={4} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-600 text-sm resize-none leading-relaxed"
      placeholder={`Document ${label.toLowerCase()}...`}
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">

      {/* Modal Profile Header */}
      <div className="px-10 py-10 bg-slate-900 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[32px] flex items-center justify-center text-white font-black text-4xl shadow-2xl ring-4 ring-white/10">
            {record.patient_name?.[0]}
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tighter leading-none">{record.patient_name}</h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'
                }`}>{record.service_type || 'OP'} SECTION</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Registry ID: {record.patient_id}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 relative z-10">
          <X size={28} className="text-slate-400" />
        </button>
      </div>

      {/* Modal Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-12 space-y-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <InfoItem label="Mobile Access" value={record.mobile_number} icon={<Phone size={16} />} />
          <InfoItem label="Demographics" value={`${record.age}y / ${record.gender}`} icon={<User size={16} />} />
          <InfoItem label="Session Timestamp" value={new Date(record.entry_date_time).toLocaleString()} icon={<Calendar size={16} />} />
          <InfoItem label="Registry Sync" value="Verified" icon={<CheckCircle2 size={16} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DataBlock label="Clinical Diagnosis" value={record.diagnosis} />
              <DataBlock label="Prescribed Treatment" value={record.treatment} />
              <DataBlock label="Practitioner Remarks" value={record.remarks} />
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Camera size={14} /> Clinical Multimedia Capture
              </label>
              {record.media_file_url ? (
                <div className="rounded-[32px] overflow-hidden border border-slate-100 aspect-video shadow-2xl relative bg-slate-50 group">
                  {record.media_file_url.includes('google') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-slate-900">
                      <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                        <FileText className="text-blue-500" size={40} />
                      </div>
                      <p className="text-xl font-black text-white mb-2 uppercase tracking-tight">Cloud Attachment Ready</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Access secured diagnostic file via Drive</p>
                      <a href={record.media_file_url} target="_blank" className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-4">
                        Open Multimedia <Plus size={16} />
                      </a>
                    </div>
                  ) : (
                    <img src={record.media_file_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute top-8 left-8 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10">Attached Diagnosis Media</div>
                </div>
              ) : (
                <div className="bg-slate-50 py-20 rounded-[32px] border-4 border-dashed border-slate-100 text-slate-300 flex flex-col items-center justify-center gap-4">
                  <Camera size={48} strokeWidth={1} />
                  <span className="font-black text-xs uppercase tracking-widest">No multimedia attached to this session</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Action Bar */}
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-5 shrink-0">
        <button onClick={onEdit} className="flex-[3] py-6 bg-slate-900 text-white rounded-[32px] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-4">
          <Edit3 size={18} /> Modify Registry Record
        </button>
        <button onClick={() => window.print()} className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[32px] font-black flex items-center justify-center hover:bg-slate-50 transition-all">
          <Printer size={20} />
        </button>
      </div>
    </motion.div>
  </div>
);

const DataBlock = ({ label, value }) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none italic ml-4">{label}</p>
    <div className="bg-white p-8 rounded-[32px] text-slate-700 text-sm font-bold leading-relaxed border border-slate-100 shadow-sm min-h-[140px]">
      {value || 'Status: No entry documented via clinical protocol.'}
    </div>
  </div>
);

const InfoItem = ({ label, value, icon }) => (
  <div className="space-y-4 p-6 bg-slate-50 rounded-[28px] border border-slate-100 shadow-inner">
    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-50">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1 leading-none">{label}</p>
      <p className="text-sm font-black text-slate-900 tracking-tight leading-none truncate">{value}</p>
    </div>
  </div>
);

export default App;
