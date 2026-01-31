import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, ArrowRight, Eye, Printer, RotateCcw, Play, Square, Edit3,
  ChevronRight, Activity, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PRODUCTION CONFIGURATION
 * Read the API endpoint from Vite Environment Variables
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
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] font-sans text-slate-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-50 transition-all">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl border-b border-white/10" />
        <div className="relative px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40"
            >
              <Stethoscope size={26} className="text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-white">Guru Ortho</h1>
              <p className="text-[10px] font-black text-blue-400 mt-1 uppercase tracking-[0.3em] opacity-80">Clinical Intelligence v4.2</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view !== 'home' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('home')}
                className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white border border-white/5"
              >
                <Home size={20} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="bg-white text-slate-900 px-6 py-3.5 rounded-2xl text-[11px] font-black shadow-2xl hover:bg-blue-50 transition-all flex items-center gap-2 uppercase tracking-widest"
            >
              <Plus size={18} strokeWidth={3} /> <span className="hidden xs:inline">New Admission</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full relative">
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
                showNotification(msg || 'Record synchronized successfully');
                loadRecords();
                setView('home');
              }}
              onError={(err) => showNotification(err, 'error')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Record Inspection Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <Modal record={selectedRecord} onClose={() => setSelectedRecord(null)} onEdit={() => handleEdit(selectedRecord)} />
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`fixed bottom-10 right-6 p-6 rounded-[36px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-5 text-white z-[100] border-2 ${notification.type === 'error' ? 'bg-rose-600 border-rose-400' : 'bg-[#0F172A] border-blue-500/20'
              }`}
          >
            <div className={`p-2.5 rounded-2xl bg-white/10`}>
              {notification.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} className="text-blue-400" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 leading-none mb-1">Clinic System</span>
              <span className="font-black text-xs uppercase tracking-widest">{notification.msg}</span>
            </div>
            <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/10 p-1 rounded-full"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ records, loading, onRefresh, onViewRecord, onEditRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.mobile_number).includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {/* Search & Utility Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 relative">
          <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-900/5 blur-2xl rounded-full" />
          <div className="relative bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/40 flex items-center group focus-within:ring-2 focus:ring-blue-500/20 transition-all border border-slate-100">
            <Search className="ml-6 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={28} />
            <input
              type="text"
              placeholder="Search by name, ID or mobile..."
              className="flex-1 px-6 py-6 bg-transparent outline-none font-bold text-lg placeholder:text-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="lg:col-span-4 flex items-center justify-between gap-4">
          <div className="flex flex-col px-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Database Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xl font-black text-slate-900 tracking-tighter">{filtered.length} Case Records</p>
            </div>
          </div>
          <motion.button
            whileHover={{ rotate: 90 }}
            onClick={onRefresh}
            className={`p-5 bg-white rounded-3xl shadow-lg border border-slate-100 text-slate-900 hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={24} />
          </motion.button>
        </div>
      </div>

      {/* Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filtered.map((record, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={record.patient_id}
              className="bg-white p-8 rounded-[48px] shadow-sm hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.08)] transition-all group relative border border-slate-50 overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors -z-0" />

              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-slate-900/20 group-hover:bg-blue-600 group-hover:shadow-blue-500/30 transition-all transform group-hover:rotate-6">
                    {record.patient_name?.[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h5 className="font-black text-slate-900 text-xl leading-none truncate mb-2">{record.patient_name}</h5>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{record.patient_id}</span>
                      <span className="px-2.5 py-1 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest">{record.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-5 mb-8 space-y-4 border border-slate-50">
                  <div className="flex items-center gap-4 text-slate-600 font-bold text-sm tracking-tight">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Phone size={14} className="text-blue-500" /></div>
                    {record.mobile_number}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar size={14} className="text-blue-400" /></div>
                    {new Date(record.entry_date_time).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewRecord(record)}
                    className="flex-1 py-4.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all"
                  >
                    <Eye size={16} /> INSPECT
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEditRecord(record)}
                    className="w-16 py-4.5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Edit3 size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 bg-slate-100 rounded-[50px] flex items-center justify-center text-slate-200 mb-8 border-4 border-dashed border-slate-200">
              <Database size={56} />
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">No assessments found</p>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-3">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ editData, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    diagnosis: '', treatment: '', remarks: ''
  });
  const [media, setMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('camera');
  const [submitting, setSubmitting] = useState(false);
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
    } catch (err) {
      console.warn("Camera missed");
    }
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
    setMedia({
      base64: canvas.toDataURL('image/jpeg'),
      type: 'image/jpeg',
      name: `pic_${Date.now()}.jpg`
    });
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
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        media,
        patient_id: editData?.patient_id || null,
        entry_date_time: editData?.entry_date_time || null,
        existingMediaUrl: editData?.media_file_url || '',
        enteredBy: 'Manager'
      };
      const res = await submitToGas(payload);
      if (res.success) onSuccess(res.message);
      else onError(res.error || 'Gateway rejected payload');
    } catch (err) {
      onError('Synchronization Fatal Failure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-32 px-2">
      <div className="flex flex-col items-center mb-16 text-center">
        <motion.div
          whileHover={{ rotate: -15 }}
          className="w-24 h-24 bg-[#0F172A] rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-slate-900/30 mb-8"
        >
          <UserPlus size={48} strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editData ? 'Modify Assessment' : 'New Admission'}</h2>
        <p className="text-slate-400 font-bold text-xs mt-4 uppercase tracking-[0.4em]">Advanced Orthopedic Intelligence</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Section title="01. Identity & Profile" icon={<User />}>
            <InputField label="Patient Legal Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
              <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
            </div>
            <InputField label="Primary Contact" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
          </Section>

          <Section title="02. Multimedia Evidence" icon={<Camera />}>
            <div className="aspect-video bg-slate-900 rounded-[48px] overflow-hidden relative group shadow-2xl border-8 border-white">
              {media || (editData?.media_file_url && !media) ? (
                <div className="w-full h-full relative">
                  {media ? (
                    media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#0F172A] text-white">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20"><FileText size={40} /></div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Preserving Attachment</p>
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => { setMedia(null); startStream(); }}
                    className="absolute top-6 right-6 p-4 bg-white shadow-2xl text-rose-500 rounded-3xl hover:bg-rose-50 transition-all"
                  >
                    <RotateCcw size={20} strokeWidth={3} />
                  </motion.button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                    <div className="flex bg-white/10 backdrop-blur-2xl p-2 rounded-[24px] border border-white/20 shadow-2xl">
                      <button type="button" onClick={() => setMode('camera')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>X-Ray Mode</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>Clinic VI</button>
                    </div>

                    {mode === 'camera' ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button" onClick={capturePhoto}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.3)] border-8 border-white/20"
                      >
                        <Camera size={34} className="text-blue-600" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button" onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-8 ${isRecording ? 'bg-rose-500 border-rose-500/20 animate-pulse' : 'bg-white border-white/20'}`}
                      >
                        {isRecording ? <Square size={26} className="text-white" /> : <Play size={26} className="text-blue-600 ml-1.5" />}
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase text-center mt-6 tracking-[0.2em]">Clinical media will be archived in Private Cloud Drive</p>
          </Section>
        </div>

        <Section title="03. Clinical Intelligence" icon={<ClipboardList />}>
          <TextArea label="Evidence-based Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
          <TextArea label="Long-term Treatment Protocol" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
          <TextArea label="Internal Practitioner Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
        </Section>

        <motion.button
          whileHover={{ scale: 1.01, boxShadow: '0 30px 60px -12px rgba(37, 99, 235, 0.35)' }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={submitting}
          className="w-full py-9 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[40px] font-black uppercase tracking-[0.5em] text-xs shadow-2xl disabled:opacity-50 flex items-center justify-center gap-5 transition-all border-b-8 border-blue-900/30"
        >
          {submitting ? (
            <>
              <RefreshCw className="animate-spin" size={24} />
              <span>COMMITTING TRANSACTION...</span>
            </>
          ) : (
            <>
              <span>{editData ? 'UPDATE CLINICAL RECORD' : 'ARCHIVE CASE REGISTRY'}</span>
              <ArrowRight size={24} strokeWidth={3} className="opacity-50" />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="p-10 bg-white rounded-[60px] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform -z-0" />
    <div className="flex items-center gap-5 relative z-10">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/5">{React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}</div>
      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 opacity-80">{title}</h4>
    </div>
    <div className="relative z-10 space-y-8">
      {children}
    </div>
  </div>
);

const InputField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <input
      type={type} required={required} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-3xl outline-none font-black text-slate-700 transition-all text-sm placeholder:text-slate-200"
      placeholder={`ENTERING ${label.toUpperCase()}...`}
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <div className="relative">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-3xl outline-none font-black text-slate-700 transition-all text-sm appearance-none uppercase"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300 pointer-events-none" />
    </div>
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <textarea
      rows={4} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-6 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[40px] outline-none font-black text-slate-700 transition-all text-sm placeholder:text-slate-200 leading-relaxed"
      placeholder={`DOCUMENTING ${label.toUpperCase()}...`}
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl" />
    <motion.div
      initial={{ scale: 0.9, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      className="bg-white w-full max-w-2xl rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden flex flex-col max-h-[92vh] border border-white/10"
    >
      <div className="bg-[#0F172A] p-10 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="flex items-center gap-7 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[30px] flex items-center justify-center text-white font-black text-3xl uppercase tracking-tighter shadow-2xl shadow-blue-500/20">
            {record.patient_name[0]}
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{record.patient_name}</h3>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest">{record.patient_id}</span>
              <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Inspecting Record</span>
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 relative z-10"><X size={24} /></motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-12 border-b border-slate-50">
          <DetailItem label="Mobile Contact" value={record.mobile_number} icon={<Phone size={16} />} />
          <DetailItem label="Clinical Demographic" value={`${record.age}y / ${record.gender}`} icon={<User size={16} />} />
          <DetailItem label="Registry Timestamp" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={16} />} />
        </div>

        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] leading-none">Diagnostic Intelligence</h4>
            <div className="h-px flex-1 bg-slate-50 rounded-full" />
          </div>
          <div className="space-y-6">
            <ViewBlock label="Clinical Evaluation" value={record.diagnosis} color="bg-blue-50/50 text-blue-900 border-blue-100/50" accent="bg-blue-500" />
            <ViewBlock label="Treatment Protocol" value={record.treatment} color="bg-slate-50 text-slate-900 border-slate-100" accent="bg-slate-900" />
            <ViewBlock label="Observational Remarks" value={record.remarks} color="bg-slate-50 text-slate-900 border-slate-100" accent="bg-slate-400" />
          </div>
        </div>
      </div>

      <div className="p-10 bg-slate-50/50 border-t border-slate-100 shrink-0 flex gap-5">
        {record.media_file_url ? (
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={record.media_file_url}
            target="_blank"
            className="flex-1 py-6 bg-[#0F172A] text-white rounded-[32px] font-black text-[12px] uppercase tracking-[0.3em] text-center shadow-2xl shadow-slate-900/40 flex items-center justify-center gap-3 transition-all"
          >
            <FileText size={20} /> ANALYZE MEDIA
          </motion.a>
        ) : (
          <div className="flex-1 py-6 bg-slate-200 text-slate-400 rounded-[32px] font-black text-[12px] uppercase tracking-[0.3em] text-center cursor-not-allowed">Attachment Missing</div>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-6 bg-blue-600 text-white rounded-[32px] shadow-2xl shadow-blue-600/20 transition-all"
        >
          <Edit3 size={24} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.print()}
          className="p-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[32px] shadow-lg transition-all"
        >
          <Printer size={24} />
        </motion.button>
      </div>
    </motion.div>
  </div>
);

const ViewBlock = ({ label, value, color, accent }) => (
  <div className={`p-8 rounded-[40px] border relative overflow-hidden group ${color}`}>
    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full ${accent}`} />
    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 leading-none">{label}</p>
    <p className="text-lg font-black leading-relaxed tracking-tight">{value || 'No entry documented'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex flex-col gap-4">
    <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-blue-500 border border-slate-100 shadow-sm">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1.5 leading-none italic">{label}</p>
      <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

export default App;
