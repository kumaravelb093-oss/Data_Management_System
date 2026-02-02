import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3,
  ChevronRight, Activity, Database, Users, TrendingUp, Printer,
  Clock, ArrowRight, UserCircle
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
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Responsive Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 md:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Stethoscope className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 leading-none">Guru Ortho</h1>
              <span className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-80 hidden xs:block">Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {view !== 'home' && (
              <button
                onClick={() => setView('home')}
                className="clinical-btn-secondary p-2 md:px-4 md:py-2"
              >
                <Home size={18} className="md:mr-none" /> <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <button
              onClick={handleAdd}
              className="clinical-btn-primary p-2 md:px-4 md:py-2 text-[10px] md:text-sm whitespace-nowrap"
            >
              <Plus size={18} className="md:mr-none" /> <span className="hidden xs:inline">Add Patient</span><span className="xs:hidden">New</span>
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
            className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 px-5 py-3 md:px-6 md:py-4 rounded-xl shadow-2xl text-white font-bold text-xs md:text-sm z-[100] flex items-center gap-3 max-w-[90vw] ${notification.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
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

    // Tab filtering with normalization
    const recordSector = r.service_type?.trim().toUpperCase();
    const targetSector = activeTab.trim().toUpperCase();

    const matchesTab = activeTab === 'All' || recordSector === targetSector;

    return matchesSearch && matchesTab;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">

      {/* Stats - More Adaptive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatItem label="Admission Today" value={stats.today} icon={<Clock size={20} />} color="text-amber-600" />
        <StatItem label="Out-Patient (OP)" value={stats.op} icon={<TrendingUp size={20} />} color="text-blue-600" />
        <StatItem label="In-Patient (IP)" value={stats.ip} icon={<Activity size={20} />} color="text-indigo-600" />
        <StatItem label="Total Registry" value={stats.total} icon={<Users size={20} />} color="text-slate-600" />
      </div>

      {/* Sector Navigation - Better Spacing on Mobile */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 md:gap-8 min-w-max px-1">
          {['All', 'OP', 'IP'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[10px] md:text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab} Patients
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 md:gap-3 pb-3 flex-shrink-0">
          <button onClick={onRefresh} className="text-slate-400 hover:text-blue-600 transition-all p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar - Larger for Mobile */}
      <div className="relative group w-full lg:max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'All' ? 'all' : activeTab} records...`}
          className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-base md:text-lg shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Responsive Table / Card View Toggle */}
      <div className="glass-card overflow-hidden">
        {/* Mobile-First Card View (shown only on mobile) */}
        <div className="md:hidden space-y-[1px] bg-slate-100">
          {filtered.map((record, i) => (
            <div
              key={i}
              onClick={() => onViewRecord(record)}
              className="bg-white p-5 active:bg-slate-50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {record.service_type || 'OP'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{record.patient_id}</span>
                </div>
                <h3 className="font-bold text-slate-900 truncate">{record.patient_name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{record.age}y / {record.gender} • {record.mobile_number}</p>
              </div>
              <ArrowRight className="text-slate-300 flex-shrink-0" size={16} />
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="bg-white py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No matching records found.</div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-medium whitespace-nowrap">
                    No registry records found for your search criteria.
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
  <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left gap-3 shadow-sm hover:shadow-md transition-all">
    <div className="order-2 md:order-1">
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 md:mb-2">{label}</p>
      <p className="text-xl md:text-3xl font-black text-slate-900 leading-none">{value}</p>
    </div>
    <div className={`order-1 md:order-2 p-2 md:p-4 rounded-xl bg-slate-50 ${color} shadow-inner`}>
      {React.cloneElement(icon, { size: 16 })}
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
      <div className="flex items-center justify-between mb-6 md:mb-8 px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{editData ? 'Modify Admission' : 'Admission Protocol'}</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Management Flow</p>
        </div>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-all bg-white rounded-xl shadow-sm border border-slate-100">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Identity Section */}
          <section className="glass-card p-6 md:p-8 space-y-6">
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
              <UserCircle size={14} /> Identity & Sector
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
          <section className="glass-card p-6 md:p-8 space-y-6 flex flex-col">
            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
              <Camera size={14} /> Diagnostic Clinical Media
            </h4>
            <div className="flex-1 aspect-video bg-slate-900 rounded-[20px] md:rounded-[24px] overflow-hidden relative shadow-inner border-2 border-slate-100">
              {media || (editData?.media_file_url && !media) ? (
                <div className="w-full h-full relative">
                  {media ? (
                    media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center px-6">Media Securely Attached</div>
                  )}
                  <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-3 right-3 p-3 bg-white shadow-xl text-rose-500 rounded-xl hover:bg-rose-50 transition-all"> <RotateCcw size={18} /> </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 md:gap-6">
                    <div className="flex bg-white/10 backdrop-blur-3xl p-1 rounded-xl border border-white/20">
                      <button type="button" onClick={() => setMode('camera')} className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>X-Ray</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>Video</button>
                    </div>
                    {mode === 'camera' ? (
                      <button type="button" onClick={capturePhoto} className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all border-4 border-slate-50/20"> <Camera size={24} className="text-blue-600" /> </button>
                    ) : (
                      <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all border-4 ${isRecording ? 'bg-rose-500 border-rose-100 animate-pulse' : 'bg-white border-slate-50/20'}`}> {isRecording ? <Square size={20} className="text-white" /> : <Play size={20} className="text-blue-600 ml-1" />} </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Cloud Storage Protocol Active</p>
          </section>
        </div>

        {/* Observation Section */}
        <section className="glass-card p-6 md:p-10 space-y-6 md:space-y-8">
          <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
            <ClipboardList size={14} /> Clinical Observation Protocol
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <AreaField label="Diagnosis Details" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
            <AreaField label="Treatment Protocol" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
            <AreaField label="Special Case Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <button type="button" onClick={onCancel} className="md:flex-1 py-4 md:py-5 bg-slate-100 text-slate-500 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="md:flex-[2] py-4 md:py-5 bg-blue-600 text-white rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4">
            {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : (editData ? 'Commit Record Update' : 'Initialize Admission Sync')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const TextField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">{label}</label>
    <input
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-3 md:px-6 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 text-sm"
    />
  </div>
);

const SelectBox = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">{label}</label>
    <div className="relative">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-5 py-3 md:px-6 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-black text-slate-700 text-sm appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  </div>
);

const AreaField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">{label}</label>
    <textarea
      rows={3} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-600 text-sm resize-none leading-relaxed"
      placeholder={`Patient's ${label.toLowerCase()}...`}
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-slate-100 transition-all rounded-t-[32px]">

      {/* Modal Profile Header - Responsive */}
      <div className="px-6 py-8 md:px-10 md:py-10 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between shrink-0 relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl md:rounded-3xl flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-2xl ring-4 ring-white/10 flex-shrink-0">
            {record.patient_name?.[0]}
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{record.patient_name}</h3>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className={`px-3 py-0.5 md:px-4 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'
                }`}>{record.service_type || 'OP'} SECTION</span>
              <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 flex items-center gap-1"><Database size={10} /> {record.patient_id}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="absolute md:relative top-6 right-6 md:top-auto md:right-auto p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 relative z-10">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      {/* Modal Content - Adaptive Spacing */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12 no-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <InfoItem label="Contact Access" value={record.mobile_number} icon={<Phone size={14} />} />
          <InfoItem label="Demographics" value={`${record.age}y / ${record.gender}`} icon={<User size={14} />} />
          <InfoItem label="First Visit" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={14} />} />
          <InfoItem label="Registry Sync" value="Verified" icon={<CheckCircle2 size={14} />} />
        </div>

        <div className="space-y-8 md:space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <DataBlock label="Clinical Diagnosis" value={record.diagnosis} />
            <DataBlock label="Prescribed Treatment" value={record.treatment} />
            <DataBlock label="Clinical Remarks" value={record.remarks} />
          </div>

          <div className="space-y-4 md:space-y-6">
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-1">
              <Camera size={14} /> Diagnostic Clinical Multimedia
            </label>
            {record.media_file_url ? (
              <div className="rounded-3xl overflow-hidden border border-slate-100 aspect-video shadow-2xl relative bg-slate-50 group">
                {record.media_file_url.includes('google') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-12 text-center bg-slate-900 transition-all">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 md:mb-6">
                      <FileText className="text-blue-500" size={32} md:size={40} />
                    </div>
                    <p className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight">Multimedia Document Attached</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6 md:mb-8">Cloud Storage Access Protocol Enabled</p>
                    <a href={record.media_file_url} target="_blank" className="bg-blue-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-4 active:scale-95">
                      View Capture <ArrowRight size={16} />
                    </a>
                  </div>
                ) : (
                  <img src={record.media_file_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">Diagnostic Feed</div>
              </div>
            ) : (
              <div className="bg-slate-50 py-12 md:py-20 rounded-[32px] border-4 border-dashed border-slate-100 text-slate-300 flex flex-col items-center justify-center gap-4">
                <Camera size={40} strokeWidth={1} />
                <span className="font-black text-[10px] uppercase tracking-widest">No multimedia attached</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Action Bar - Mobile Fixed Bottom */}
      <div className="p-4 md:p-10 bg-slate-50 border-t border-slate-100 flex gap-3 md:gap-5 shrink-0 mt-auto md:mt-0">
        <button onClick={onEdit} className="flex-[3] py-4 md:py-6 bg-slate-900 text-white rounded-2xl md:rounded-[32px] font-black text-[10px] md:text-[12px] uppercase tracking-widest md:tracking-[0.4em] shadow-2xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 md:gap-4 active:scale-95">
          <Edit3 size={16} /> Modify Record
        </button>
        <button onClick={() => window.print()} className="flex-1 py-4 md:py-6 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl md:rounded-[32px] font-black flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95">
          <Printer size={18} />
        </button>
      </div>
    </motion.div>
  </div>
);

const DataBlock = ({ label, value }) => (
  <div className="space-y-2 md:space-y-3">
    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none italic ml-3 md:ml-4">{label}</p>
    <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[32px] text-slate-700 text-xs md:text-sm font-bold leading-relaxed border border-slate-100 shadow-sm min-h-[100px] md:min-h-[140px] flex items-center">
      {value || 'No entry documented.'}
    </div>
  </div>
);

const InfoItem = ({ label, value, icon }) => (
  <div className="space-y-3 p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[28px] border border-slate-100 shadow-inner flex flex-col items-center md:items-start text-center md:text-left">
    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-50 flex-shrink-0">
      {React.cloneElement(icon, { size: 14 })}
    </div>
    <div className="min-w-0 w-full">
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5 md:mb-1 leading-none">{label}</p>
      <p className="text-xs md:text-sm font-black text-slate-900 tracking-tight leading-none truncate">{value}</p>
    </div>
  </div>
);

export default App;
