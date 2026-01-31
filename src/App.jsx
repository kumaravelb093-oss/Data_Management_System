import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin, 
  CheckCircle2, AlertCircle, X, FileText, Calendar, 
  ClipboardList, User, Home, Search, RefreshCw, 
  Plus, ArrowRight, Eye, Printer, RotateCcw, Play, Square, Edit3,
  ChevronRight, Activity, Database, Users, TrendingUp 
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
               <p className="text-[10px] font-black text-blue-400 mt-1 uppercase tracking-[0.3em] opacity-80">Sector Optimized v4.5</p>
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
               <Plus size={18} strokeWidth={3} /> <span className="hidden xs:inline">Admission</span>
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

      <AnimatePresence>
        {selectedRecord && (
          <Modal record={selectedRecord} onClose={() => setSelectedRecord(null)} onEdit={() => handleEdit(selectedRecord)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`fixed bottom-10 right-6 p-6 rounded-[36px] shadow-2xl flex items-center gap-5 text-white z-[100] border-2 ${
              notification.type === 'error' ? 'bg-rose-600 border-rose-400' : 'bg-[#0F172A] border-blue-500/20'
            }`}
          >
            <div className={`p-2.5 rounded-2xl bg-white/10`}>
              {notification.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} className="text-blue-400" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 leading-none mb-1">Clinic Intelligence</span>
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
    String(r.mobile_number).includes(searchTerm) ||
    r.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const opCount = records.filter(r => r.service_type === 'OP').length;
  const ipCount = records.filter(r => r.service_type === 'IP').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      
      {/* Sector Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={records.length} icon={<Users />} color="bg-slate-900" />
        <StatCard label="OP (Out-Patient)" value={opCount} icon={<TrendingUp />} color="bg-blue-600" />
        <StatCard label="IP (In-Patient)" value={ipCount} icon={<Activity />} color="bg-indigo-600" />
        <StatCard label="Registry Sync" value="99.9%" icon={<Database />} color="bg-emerald-600" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-900/5 blur-2xl rounded-full" />
        <div className="relative bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/40 flex items-center group focus-within:ring-2 focus:ring-blue-500/20 transition-all border border-slate-100">
          <Search className="ml-6 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={28} />
          <input 
            type="text" 
            placeholder="Search Name, ID, Mobile or Sector (OP/IP)..."
            className="flex-1 px-6 py-6 bg-transparent outline-none font-bold text-lg placeholder:text-slate-200"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button onClick={onRefresh} className={`mr-4 p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={24} />
          </button>
        </div>
      </div>

      {/* Database Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filtered.map((record) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={record.patient_id} 
              className="bg-white p-8 rounded-[48px] shadow-sm hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.08)] transition-all group relative border border-slate-50 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${
                record.service_type === 'IP' ? 'bg-indigo-600' : 'bg-blue-600'
              }`}>
                {record.service_type || 'OP'}
              </div>

              <div className="relative z-10 pt-4">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-slate-900/20 group-hover:bg-blue-600 transition-all">
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
                    className="flex-1 py-4.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
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
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ editData, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    service_type: 'OP', // New Sector Field
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
        service_type: editData.service_type || 'OP', // Sync from edit
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
      else onError(res.error || 'Server rejected');
    } catch (err) { onError('Sync Fail'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-32 px-2">
      <div className="flex flex-col items-center mb-16 text-center">
         <div className="w-24 h-24 bg-[#0F172A] rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-slate-900/30 mb-8">
            <UserPlus size={48} />
         </div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{editData ? 'Modify Admission' : 'New Admission'}</h2>
         <p className="text-slate-400 font-bold text-xs mt-4 uppercase tracking-[0.4em]">Guru Ortho Clinical Logic</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Section title="01. Identity & Sector" icon={<User />}>
             <InputField label="Patient Full Name" required value={formData.name} onChange={v => setFormData({...formData, name: v})} />
             <div className="grid grid-cols-2 gap-6">
               <InputField label="Age" type="number" required value={formData.age} onChange={v => setFormData({...formData, age: v})} />
               <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({...formData, gender: v})} />
             </div>
             <div className="grid grid-cols-2 gap-6">
               <SelectField label="Sector (OP/IP)" value={formData.service_type} options={['OP', 'IP']} onChange={v => setFormData({...formData, service_type: v})} />
               <InputField label="Mobile Number" required value={formData.mobile} onChange={v => setFormData({...formData, mobile: v})} />
             </div>
          </Section>

          <Section title="02. Multimedia Evidence" icon={<Camera />}>
             <div className="aspect-video bg-slate-900 rounded-[48px] overflow-hidden relative group shadow-2xl border-8 border-white">
                {media || (editData?.media_file_url && !media) ? (
                  <div className="w-full h-full relative">
                    {media ? (
                      media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                    ) : ( 
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white/30 text-[10px] font-black uppercase tracking-widest">Preserving Original Media</div> 
                    )}
                    <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-6 right-6 p-4 bg-white shadow-2xl text-rose-500 rounded-3xl hover:bg-rose-50 transition-all"> <RotateCcw size={20} /> </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                       <div className="flex bg-white/10 backdrop-blur-2xl p-2 rounded-[24px] border border-white/20 shadow-2xl">
                          <button type="button" onClick={() => setMode('camera')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>X-Ray</button>
                          <button type="button" onClick={() => setMode('video')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-slate-900 shadow-xl' : 'text-white'}`}>Clinic VI</button>
                       </div>
                       {mode === 'camera' ? (
                         <button type="button" onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-white/20"> <Camera size={34} className="text-blue-600" /> </button>
                       ) : (
                         <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-8 ${isRecording ? 'bg-rose-500 border-rose-500/20 animate-pulse' : 'bg-white border-white/20'}`}> {isRecording ? <Square size={26} className="text-white" /> : <Play size={26} className="text-blue-600" />} </button>
                       )}
                    </div>
                  </>
                )}
             </div>
          </Section>
        </div>

        <Section title="03. Clinical Assessment" icon={<ClipboardList />}>
           <TextArea label="Evidence-based Diagnosis" value={formData.diagnosis} onChange={v => setFormData({...formData, diagnosis: v})} />
           <TextArea label="Long-term Treatment Protocol" value={formData.treatment} onChange={v => setFormData({...formData, treatment: v})} />
           <TextArea label="Internal Practitioner Remarks" value={formData.remarks} onChange={v => setFormData({...formData, remarks: v})} />
        </Section>

        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit" 
          disabled={submitting}
          className="w-full py-9 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[40px] font-black uppercase tracking-[0.5em] text-xs shadow-2xl disabled:opacity-50 flex items-center justify-center gap-5 transition-all border-b-8 border-blue-900/30"
        >
          {submitting ? <RefreshCw className="animate-spin" size={24} /> : <span>{editData ? 'Update Database Record' : 'Commit Clinical Data'}</span>}
        </motion.button>
      </form>
    </motion.div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="p-10 bg-white rounded-[60px] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
     <div className="flex items-center gap-5 relative z-10">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg">{React.cloneElement(icon, { size: 24 })}</div>
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 opacity-80">{title}</h4>
     </div>
     <div className="relative z-10 space-y-8">{children}</div>
  </div>
);

const InputField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <input 
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-3xl outline-none font-black text-slate-700 transition-all text-sm"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <select 
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-5 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-3xl outline-none font-black text-slate-700 transition-all text-sm appearance-none uppercase"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em] opacity-60 leading-none">{label}</label>
    <textarea 
      rows={4} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-8 py-6 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[40px] outline-none font-black text-slate-700 transition-all text-sm leading-relaxed"
    />
  </div>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className={`p-6 rounded-[32px] ${color} text-white shadow-xl flex items-center gap-5`}>
    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{label}</p>
      <p className="text-xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-2xl" />
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[92vh]">
      <div className="bg-[#0F172A] p-10 text-white flex items-center justify-between shrink-0">
         <div className="flex items-center gap-7">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[30px] flex items-center justify-center text-white font-black text-3xl">
               {record.patient_name?.[0]}
            </div>
            <div>
               <h3 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{record.patient_name}</h3>
               <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    record.service_type === 'IP' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}>{record.service_type || 'OP'} SECTION</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">• {record.patient_id}</span>
               </div>
            </div>
         </div>
         <button onClick={onClose} className="p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-12 space-y-12">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-12 border-b border-slate-50">
           <DetailItem label="Mobile Contact" value={record.mobile_number} icon={<Phone size={16} />} />
           <DetailItem label="Demographic" value={`${record.age}y / ${record.gender}`} icon={<User size={16} />} />
           <DetailItem label="Registry Date" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={16} />} />
         </div>

         <div className="space-y-8">
            <ViewBlock label="Clinical Evaluation" value={record.diagnosis} color="bg-blue-50/50 border-blue-100" accent="bg-blue-500" />
            <ViewBlock label="Treatment Protocol" value={record.treatment} color="bg-slate-50 border-slate-100" accent="bg-slate-900" />
            <ViewBlock label="Observer Remarks" value={record.remarks} color="bg-slate-50 border-slate-100" accent="bg-slate-400" />
         </div>
      </div>

      <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-5">
         {record.media_file_url ? (
           <a href={record.media_file_url} target="_blank" className="flex-1 py-6 bg-[#0F172A] text-white rounded-[32px] font-black text-[12px] uppercase tracking-[0.3em] text-center shadow-xl flex items-center justify-center gap-3">
             <FileText size={20} /> VIEW MEDIA
           </a>
         ) : (
           <div className="flex-1 py-6 bg-slate-200 text-slate-400 rounded-[32px] font-black text-[12px] uppercase tracking-[0.3em] text-center">No Media</div>
         )}
         <button onClick={onEdit} className="p-6 bg-blue-600 text-white rounded-[32px] shadow-xl transition-all active:scale-95"> <Edit3 size={24} /> </button>
         <button onClick={() => window.print()} className="p-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[32px] shadow-sm"> <Printer size={24} /> </button>
      </div>
    </motion.div>
  </div>
);

const ViewBlock = ({ label, value, color, accent }) => (
  <div className={`p-8 rounded-[40px] border relative overflow-hidden ${color}`}>
     <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full ${accent}`} />
     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{label}</p>
     <p className="text-lg font-black tracking-tight">{value || 'No entry documented'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex flex-col gap-4">
     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-500 border border-slate-100 shadow-sm">{icon}</div>
     <div>
       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1.5 leading-none italic">{label}</p>
       <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">{value}</p>
     </div>
  </div>
);

export default App;
