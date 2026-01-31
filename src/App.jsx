import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, ArrowRight, Eye, Printer, RotateCcw, Play, Square, Edit3
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
      const response = await fetch(API_URL);
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      showNotification('Sync Error', 'error');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      {/* Professional Clinical Header */}
      <header className="sticky top-0 z-50 bg-[#111827] text-white px-6 py-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Stethoscope size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Guru Ortho</h1>
            <p className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-[0.2em] opacity-80">Management Portal v4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
              <Home size={20} />
            </button>
          )}
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95"
          >
            <Plus size={16} /> New Patient
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
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
                showNotification(msg || 'Record Processed Successfully');
                loadRecords();
                setView('home');
              }}
              onError={(err) => showNotification(err, 'error')}
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

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-10 right-6 p-6 rounded-[32px] shadow-2xl flex items-center gap-4 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'
              }`}
          >
            <div className="p-2 bg-white/20 rounded-xl">
              {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-blue-400" />}
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest">{notification.msg}</span>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white p-5 rounded-[40px] shadow-sm border border-slate-100 flex items-center">
        <Search className="ml-5 text-slate-300" size={24} />
        <input
          type="text"
          placeholder="Search Patient Name or Mobile..."
          className="flex-1 px-5 py-5 bg-transparent outline-none font-bold text-lg placeholder:text-slate-200"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Active Registry</h4>
          <p className="text-xl font-black text-slate-900 tracking-tighter">{filtered.length} Patients Stored</p>
        </div>
        <button onClick={onRefresh} className={`p-4 bg-white rounded-2xl border border-slate-100 text-slate-900 hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((record, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center font-black text-slate-300 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-3">
                {record.patient_name?.[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <h5 className="font-black text-slate-800 text-lg leading-tight truncate">{record.patient_name}</h5>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">ID: {record.patient_id}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 space-y-3">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                <Phone size={14} className="text-blue-400" /> {record.mobile_number}
              </div>
              <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest opacity-80">
                <Calendar size={14} className="text-blue-400" /> {new Date(record.entry_date_time).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewRecord(record)}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => onEditRecord(record)}
                className="w-14 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-500/10"
                title="Edit Record"
              >
                <Edit3 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
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
        diagnosis: editData.diagnosis || '',
        treatment: editData.treatment || '',
        remarks: editData.remarks || ''
      });
    }
  }, [editData]);

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
      else onError(res.error || 'Server rejected request');
    } catch (err) {
      onError('Sync Failed: Check API Connection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 mb-6">
          <UserPlus size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editData ? 'Modify Record' : 'Registry Entry'}</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">{editData ? 'Updating Existing Assessment' : 'New Patient Evaluation'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Section title="01. Identity" color="blue">
            <InputField label="Patient Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
            <div className="grid grid-cols-2 gap-5">
              <InputField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
              <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
            </div>
            <InputField label="Contact Mobile" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
          </Section>

          <Section title="02. Multimedia" color="emerald">
            <div className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden relative group shadow-inner">
              {media || (editData?.media_file_url && !media) ? (
                <div className="w-full h-full relative">
                  {media ? (
                    media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-800 text-white">
                      <FileText size={48} className="opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Already contains attachment</p>
                    </div>
                  )}
                  <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-rose-500 transition-all text-white">
                    <RotateCcw size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl">
                      <button type="button" onClick={() => setMode('camera')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'camera' ? 'bg-white text-slate-900' : 'text-white'}`}>X-RAY</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'video' ? 'bg-white text-slate-900' : 'text-white'}`}>CLINICAL</button>
                    </div>

                    {mode === 'camera' ? (
                      <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center transform active:scale-90 transition-transform shadow-2xl"><Camera size={24} className="text-blue-600" /></button>
                    ) : (
                      <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-14 h-14 rounded-full flex items-center justify-center transform active:scale-90 transition-all ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white'}`}>
                        {isRecording ? <Square size={20} className="text-white" /> : <Play size={20} className="text-blue-600 ml-1" />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Section>
        </div>

        <Section title="03. Clinical Assessment" color="violet">
          <TextArea label="Clinical Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
          <TextArea label="Recommended Treatment" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
          <TextArea label="Internal Doctor Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
        </Section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-7 bg-blue-600 text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-xl active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
        >
          {submitting ? <RefreshCw className="animate-spin" size={20} /> : <span>{editData ? 'Update Database Record' : 'Save Patient Registry'}</span>}
        </button>
      </form>
    </motion.div>
  );
};

const Section = ({ title, children }) => (
  <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-blue-600" />
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-80">{title}</h4>
    </div>
    {children}
  </div>
);

const InputField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest opacity-60">{label}</label>
    <input
      type={type} required={required} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest opacity-60">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all uppercase"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest opacity-60">{label}</label>
    <textarea
      rows={3} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-[#111827] p-8 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase tracking-tighter shadow-lg shadow-blue-500/10">
            {record.patient_name[0]}
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{record.patient_name}</h3>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest opacity-60">{record.patient_id} • CASE RECORD</p>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white">
        <div className="grid grid-cols-2 gap-8 pb-10 border-b border-slate-50">
          <DetailItem label="Mobile" value={record.mobile_number} icon={<Phone size={14} />} />
          <DetailItem label="Age/Gender" value={`${record.age}y / ${record.gender}`} icon={<User size={14} />} />
          <DetailItem label="Entry Date" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={14} />} />
        </div>

        <div className="space-y-8">
          <ViewBlock label="Clinical Diagnosis" value={record.diagnosis} color="bg-blue-50 text-blue-900 border-blue-100" />
          <ViewBlock label="Recommended Treatment" value={record.treatment} color="bg-slate-50 text-slate-900 border-slate-100" />
          <ViewBlock label="Doctor Remarks" value={record.remarks} color="bg-slate-50 text-slate-900 border-slate-100" />
        </div>
      </div>

      <div className="p-8 bg-slate-50 shrink-0 flex gap-4">
        {record.media_file_url ? (
          <a href={record.media_file_url} target="_blank" className="flex-1 py-5 bg-[#111827] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-slate-900/10 active:scale-95">View Registry Media</a>
        ) : (
          <div className="flex-1 py-5 bg-slate-200 text-slate-400 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-center cursor-not-allowed">No Attachment</div>
        )}
        <button onClick={onEdit} className="p-5 bg-blue-600 text-white rounded-[24px] shadow-lg shadow-blue-500/20 active:scale-95"><Edit3 size={20} /></button>
        <button onClick={() => window.print()} className="p-5 bg-white border border-slate-200 text-slate-900 rounded-[24px] active:scale-95"><Printer size={20} /></button>
      </div>
    </motion.div>
  </div>
);

const ViewBlock = ({ label, value, color }) => (
  <div className={`p-6 rounded-[32px] border ${color}`}>
    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 leading-none">{label}</p>
    <p className="text-base font-bold leading-relaxed">{value || 'No entry documented'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500 border border-slate-100">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none italic">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default App;
