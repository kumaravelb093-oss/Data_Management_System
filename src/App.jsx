import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3,
  ChevronRight, Database, ChevronDown
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
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* PhysioTrack Style Header */}
      <header className="border-b border-slate-100 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          {/* Logo Area */}
          <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center p-1 overflow-hidden">
            <div className="w-full h-full bg-[#3D2C1E] rounded-full flex items-center justify-center border border-slate-700">
              <Stethoscope size={24} className="text-white" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold tracking-tight">PhysioTrack</h1>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <button onClick={() => setView('home')} className={view === 'home' ? 'text-black' : 'hover:text-black'}>Dashboard</button>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all">New</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed bottom-10 right-10 px-6 py-3 rounded-full shadow-lg text-white font-bold text-sm ${notification.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'} z-[100]`}>
            {notification.msg}
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-4xl font-black tracking-tight text-slate-800">Patient Assessments</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium pb-4">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          {records.length} assessments • Synced with Google Sheets
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          <button onClick={onRefresh} className="btn-refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => window.location.href = '/#new'} className="btn-new" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('nav-new')); }}>
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      <div className="relative pt-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search by name, age, occupation, or condition"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-slate-400 transition-all text-lg placeholder:text-slate-300"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table List View */}
      <div className="pt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="table-header w-1/4">Date</th>
              <th className="table-header w-1/2">Patient Name</th>
              <th className="table-header w-1/4">Age</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, i) => (
              <tr key={i} className="table-row cursor-pointer" onClick={() => onViewRecord(record)}>
                <td className="py-5 font-medium text-slate-600">{new Date(record.entry_date_time).toLocaleDateString()}</td>
                <td className="py-5 font-bold text-slate-900">{record.patient_name}</td>
                <td className="py-5 font-medium text-slate-600">{record.age}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && !loading && (
          <div className="py-20 text-center text-slate-400 font-medium">No assessments found.</div>
        )}
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ editData, onSuccess, onError, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    service_type: 'OP',
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{editData ? 'Edit Assessment' : 'New Assessment'}</h2>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-black transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 pb-20">
        {/* Step 1: Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-900 font-bold">
            <User size={18} /> Identity
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
              <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
            </div>
            <InputField label="Mobile Number" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
            <SelectField label="Sector (OP/IP)" value={formData.service_type} options={['OP', 'IP']} onChange={v => setFormData({ ...formData, service_type: v })} />
          </div>
        </div>

        {/* Step 2: Media */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-900 font-bold">
            <Camera size={18} /> Media Capture
          </div>
          <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-inner">
            {media || (editData?.media_file_url && !media) ? (
              <div className="w-full h-full relative">
                {media ? (
                  media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-sm">Attachment Preserved</div>
                )}
                <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all"> <RotateCcw size={20} /> </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                  <div className="flex bg-white/10 backdrop-blur-2xl p-1 rounded-xl border border-white/20">
                    <button type="button" onClick={() => setMode('camera')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'camera' ? 'bg-white text-black' : 'text-white'}`}>X-Ray</button>
                    <button type="button" onClick={() => setMode('video')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'video' ? 'bg-white text-black' : 'text-white'}`}>Video</button>
                  </div>
                  {mode === 'camera' ? (
                    <button type="button" onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/30 transition-all active:scale-90"> <Camera size={28} className="text-black" /> </button>
                  ) : (
                    <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white/30 transition-all active:scale-90 ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white'}`}> {isRecording ? <Square size={24} className="text-white" /> : <Play size={24} className="text-black" />} </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 3: Clinical */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-900 font-bold">
            <ClipboardList size={18} /> Clinical Notes
          </div>
          <TextArea label="Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
          <TextArea label="Treatment" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
          <TextArea label="Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
        </div>

        <div className="flex gap-4 pt-10">
          <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
            {submitting ? <RefreshCw className="animate-spin" size={20} /> : (editData ? 'Save Changes' : 'Create Assessment')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const InputField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)} className="patient-input" placeholder={`Enter ${label}...`} />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="patient-input appearance-none">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className="patient-input" placeholder={`Document ${label.toLowerCase()}...`} />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl uppercase tracking-tighter">
            {record.patient_name[0]}
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{record.patient_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest text-white ${record.service_type === 'IP' ? 'bg-indigo-600' : 'bg-blue-600'}`}>{record.service_type || 'OP'}</span>
              <span className="text-xs font-semibold text-slate-400">{record.patient_id}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-300 hover:text-black transition-all"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <DetailItem label="Mobile" value={record.mobile_number} icon={<Phone size={16} />} />
          <DetailItem label="Demographic" value={`${record.age}y / ${record.gender}`} icon={<User size={16} />} />
          <DetailItem label="Date" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={16} />} />
        </div>

        <div className="space-y-8">
          <ViewBlock label="Clinical Evaluation" value={record.diagnosis} />
          <ViewBlock label="Treatment Protocol" value={record.treatment} />
          <ViewBlock label="Remarks" value={record.remarks} />
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 flex gap-4">
        {record.media_file_url ? (
          <a href={record.media_file_url} target="_blank" className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-center shadow-lg transition-all active:scale-95">View Media</a>
        ) : (
          <div className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-bold text-center">No Media</div>
        )}
        <button onClick={onEdit} className="p-4 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50 transition-all active:scale-95"> <Edit3 size={24} /> </button>
        <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50 transition-all active:scale-95"> <Printer size={24} /> </button>
      </div>
    </motion.div>
  </div>
);

const ViewBlock = ({ label, value }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-base font-semibold leading-relaxed text-slate-800">{value || 'No entry documented'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="space-y-2 border-l border-slate-100 pl-4">
    <div className="text-slate-300">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

export default App;
