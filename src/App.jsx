import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, ArrowRight, Eye, Printer, RotateCcw, Play, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PRODUCTION CONFIGURATION
 * Replace this with your deployed Google Apps Script Web App URL
 */
const API_URL = 'https://script.google.com/macros/s/AKfycbwtDpALsF4sOZKN_sk2i9hlW72LRlUOOOKkqmFmOIlMehg2dQP-1ncCBGlTapNiOfMF/exec';

const App = () => {
  const [view, setView] = useState('home');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  /**
   * REST GET: Fetch all records from Google Sheets
   */
  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      console.error('Fetch Error:', e);
      setLoading(false);
      showNotification('Could not connect to API', 'error');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F4F8] font-sans text-slate-900 overflow-x-hidden">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A] text-white px-6 py-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Stethoscope size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">Guru Ortho</h1>
            <p className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-[0.2em] opacity-80">REST Edition v3.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
              <Home size={20} />
            </button>
          )}
          <button
            onClick={() => setView('register')}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <Plus size={16} /> New Assessment
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Dashboard
              key="home"
              records={records}
              loading={loading}
              onRefresh={loadRecords}
              onViewRecord={(rec) => setSelectedRecord(rec)}
            />
          )}
          {view === 'register' && (
            <RegistrationForm
              key="reg"
              onSuccess={() => {
                showNotification('Patient Record Synced Successfully');
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
          <Modal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-10 right-6 p-6 rounded-[32px] shadow-2xl flex items-center gap-4 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-[#0F172A]'
              }`}
          >
            <div className="p-2.5 bg-white/20 rounded-xl">
              {notification.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} className="text-emerald-400" />}
            </div>
            <span className="font-black text-xs uppercase tracking-widest">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ records, loading, onRefresh, onViewRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.mobile_number).includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-white p-6 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={24} />
          <input
            type="text"
            placeholder="Search by Name or Mobile Number..."
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[30px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-lg placeholder:text-slate-300"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Live Cloud Data</h4>
          <p className="text-2xl font-black text-slate-900">{filtered.length} Case Records</p>
        </div>
        <button onClick={onRefresh} className={`p-4 bg-white rounded-2xl shadow-lg text-slate-900 hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((record, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className="bg-white p-8 rounded-[48px] shadow-lg hover:shadow-2xl transition-all group border border-slate-50"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-[28px] flex items-center justify-center font-black text-slate-400 text-2xl transform group-hover:rotate-6 transition-transform group-hover:bg-blue-600 group-hover:text-white">
                {record.patient_name?.[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <h5 className="font-black text-slate-900 text-xl truncate">{record.patient_name}</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {record.patient_id}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-500">
                <Phone size={16} className="text-blue-500" />
                <span className="text-sm font-bold">{record.mobile_number}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Calendar size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {new Date(record.entry_date_time).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => onViewRecord(record)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 transition-all flex items-center justify-center gap-3 group-hover:bg-blue-600"
            >
              <Eye size={16} /> Open Case
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    diagnosis: '', treatment: '', remarks: ''
  });
  const [media, setMedia] = useState(null); // { base64, type, name }
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera' or 'video'
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [mode]);

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: mode === 'video'
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      onError('Camera access denied');
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg');
    setMedia({ base64, type: 'image/jpeg', name: `img_${Date.now()}.jpg` });
  };

  const startRecording = () => {
    setIsRecording(true);
    const chunks = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setMedia({ base64: reader.result, type: 'video/webm', name: `vid_${Date.now()}.webm` });
      };
      setIsRecording(false);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS POST prefers this
        body: JSON.stringify({ ...formData, media })
      });
      const res = await response.json();
      if (res.success) onSuccess();
      else onError(res.error || 'Server error');
    } catch (err) {
      onError('Network or CORS error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col items-center mb-12">
        <div className="w-24 h-24 bg-blue-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-6">
          <UserPlus size={44} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Registration</h2>
        <p className="text-slate-400 font-bold text-xs mt-3 uppercase tracking-[0.4em]">Integrated Clinical Registry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormBlock title="Patient Identification" color="blue">
            <InputField label="Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
              <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
            </div>
            <InputField label="Mobile Number" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
          </FormBlock>

          <FormBlock title="Media Evidence" color="emerald">
            <div className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden relative group">
              {media ? (
                <div className="w-full h-full relative">
                  {media.type.startsWith('image') ? (
                    <img src={media.base64} className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.base64} className="w-full h-full object-cover" controls />
                  )}
                  <button onClick={() => setMedia(null)} className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-rose-500 transition-all">
                    <X size={20} className="text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl">
                      <button type="button" onClick={() => setMode('camera')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'camera' ? 'bg-white text-slate-900' : 'text-white'}`}>Photo</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'video' ? 'bg-white text-slate-900' : 'text-white'}`}>Video</button>
                    </div>

                    {mode === 'camera' ? (
                      <button type="button" onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform active:scale-90 transition-transform shadow-2xl">
                        <Camera size={28} className="text-blue-600" />
                      </button>
                    ) : (
                      <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center transform active:scale-90 transition-transform shadow-2xl ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white'}`}>
                        {isRecording ? <Square size={24} className="text-white" /> : <Play size={24} className="text-blue-600 ml-1" />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase text-center mt-4 tracking-widest leading-none">
              Captured media is uploaded to clinical drive
            </p>
          </FormBlock>
        </div>

        <FormBlock title="Clinical Assessment" color="violet">
          <TextArea label="Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
          <TextArea label="Treatment Advice" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
          <TextArea label="Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
        </FormBlock>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-8 bg-blue-600 text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-sm shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
        >
          {submitting ? <RefreshCw className="animate-spin" size={24} /> : <span>Authorize Sync & Save</span>}
        </button>
      </form>
    </motion.div>
  );
};

const FormBlock = ({ title, color, children }) => (
  <div className={`p-8 md:p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm space-y-6`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-1.5 h-6 rounded-full bg-blue-600`} />
      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
    </div>
    {children}
  </div>
);

const InputField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-2.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input
      type={type} required={required} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-7 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-2.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all uppercase appearance-none"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div className="space-y-2.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <textarea
      rows={3} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-7 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all"
    />
  </div>
);

const Modal = ({ record, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
    <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-[#0F172A] p-10 text-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl uppercase tracking-tighter">
            {record.patient_name[0]}
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{record.patient_name}</h3>
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.3em] opacity-70">Medical Evaluation</p>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        <div className="grid grid-cols-2 gap-8 pb-10 border-b border-slate-100">
          <DetailItem label="Mobile" value={record.mobile_number} icon={<Phone size={14} />} />
          <DetailItem label="Clinical ID" value={record.patient_id} icon={<Activity size={14} />} />
          <DetailItem label="Visit Date" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={14} />} />
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Assessment Detail</h4>
          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Diagnosis</p>
            <p className="text-lg font-bold text-slate-800">{record.diagnosis || 'No diagnosis data'}</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Treatment</p>
            <p className="text-lg font-bold text-slate-800">{record.treatment || 'No treatment advice'}</p>
          </div>
        </div>
      </div>

      <div className="p-10 bg-slate-50 shrink-0 flex gap-4">
        {record.media_file_url ? (
          <a href={record.media_file_url} target="_blank" className="flex-1 py-5 bg-[#0F172A] text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest text-center">View Media Attachment</a>
        ) : (
          <div className="flex-1 py-5 bg-slate-200 text-slate-400 rounded-[24px] font-black text-[11px] uppercase tracking-widest text-center cursor-not-allowed">No Attachment</div>
        )}
        <button onClick={() => window.print()} className="p-5 bg-white border border-slate-200 text-slate-900 rounded-[24px]"><Printer size={22} /></button>
      </div>
    </motion.div>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-center gap-4">
    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">{label}</p>
      <p className="text-base font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default App;
