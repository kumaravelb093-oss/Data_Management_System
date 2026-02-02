import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3,
  ChevronRight, Activity, Database, Users, TrendingUp, Printer
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

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.mobile_number).includes(searchTerm) ||
    r.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: records.length,
    op: records.filter(r => r.service_type === 'OP').length,
    ip: records.filter(r => r.service_type === 'IP').length
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatItem label="Total Patients" value={stats.total} icon={<Users size={20} />} color="text-slate-600" />
        <StatItem label="Out-Patient (OP)" value={stats.op} icon={<TrendingUp size={20} />} color="text-blue-600" />
        <StatItem label="In-Patient (IP)" value={stats.ip} icon={<Activity size={20} />} color="text-indigo-600" />
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search assessments by name, mobile, or sector (OP/IP)..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={onRefresh} className="clinical-btn-secondary">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> <span>Refresh Sync</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full patient-table border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th>Entry Date</th>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Sector</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <tr key={i} onClick={() => onViewRecord(record)} className="table-row">
                  <td>{new Date(record.entry_date_time).toLocaleDateString()}</td>
                  <td className="font-bold text-slate-900">{record.patient_name}</td>
                  <td>{record.age}y</td>
                  <td>{record.gender}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${record.service_type === 'IP' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {record.service_type || 'OP'}
                    </span>
                  </td>
                  <td>{record.mobile_number}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-medium">No patient assessments matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-10">
        <Database size={12} /> Live Sync Active with Google Sheets
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editData ? 'Edit Admission' : 'New Admission'}</h2>
          <p className="text-sm font-medium text-slate-500">Documenting clinical patient assessment</p>
        </div>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity */}
          <section className="glass-card p-6 space-y-6">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              <User size={14} /> Identity & Sector
            </h4>
            <div className="space-y-4">
              <TextField label="Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Age" type="number" required value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
                <SelectBox label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => setFormData({ ...formData, gender: v })} />
              </div>
              <TextField label="Mobile Number" required value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
              <SelectBox label="Sector (OP/IP)" value={formData.service_type} options={['OP', 'IP']} onChange={v => setFormData({ ...formData, service_type: v })} />
            </div>
          </section>

          {/* Media Capture */}
          <section className="glass-card p-6 space-y-6 flex flex-col">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              <Camera size={14} /> X-Ray / Clinical Media
            </h4>
            <div className="flex-1 aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner">
              {media || (editData?.media_file_url && !media) ? (
                <div className="w-full h-full relative">
                  {media ? (
                    media.type.startsWith('image') ? <img src={media.base64} className="w-full h-full object-cover" /> : <video src={media.base64} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Multimedia Attachment Preserved</div>
                  )}
                  <button type="button" onClick={() => { setMedia(null); startStream(); }} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 transition-all"> <RotateCcw size={16} /> </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="flex bg-white/10 backdrop-blur-2xl p-1 rounded-lg border border-white/20">
                      <button type="button" onClick={() => setMode('camera')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${mode === 'camera' ? 'bg-white text-slate-900' : 'text-white'}`}>CAMERA</button>
                      <button type="button" onClick={() => setMode('video')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${mode === 'video' ? 'bg-white text-slate-900' : 'text-white'}`}>VIDEO</button>
                    </div>
                    {mode === 'camera' ? (
                      <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"> <Camera size={24} className="text-slate-900" /> </button>
                    ) : (
                      <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${isRecording ? 'bg-rose-600' : 'bg-white text-slate-900'}`}> {isRecording ? <Square size={20} className="text-white" /> : <Play size={20} />} </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Clinical Assessment */}
        <section className="glass-card p-6 space-y-6">
          <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
            <ClipboardList size={14} /> Clinical Notes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AreaField label="Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
            <AreaField label="Treatment" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
            <AreaField label="Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} />
          </div>
        </section>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onCancel} className="clinical-btn-secondary flex-1 py-4">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="clinical-btn-primary flex-1 py-4">
            {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : (editData ? 'Update Database' : 'Submit Admission')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const TextField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all font-medium text-slate-700"
    />
  </div>
);

const SelectBox = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const AreaField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <textarea
      rows={4} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all font-medium text-slate-700 resize-none"
      placeholder={`Patient's ${label.toLowerCase()}...`}
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

      {/* Modal Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {record.patient_name?.[0]}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{record.patient_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${record.service_type === 'IP' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>{record.service_type || 'OP'}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">• {record.patient_id}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem label="Contact" value={record.mobile_number} icon={<Phone size={14} />} />
          <InfoItem label="Age/Gender" value={`${record.age}y / ${record.gender}`} icon={<User size={14} />} />
          <InfoItem label="Date Entered" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar size={14} />} />
          <InfoItem label="By" value={record.entered_by || 'Staff'} icon={<CheckCircle2 size={14} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <DataBlock label="Diagnosis" value={record.diagnosis} />
            <DataBlock label="Treatment" value={record.treatment} />
            <DataBlock label="Remarks" value={record.remarks} />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Multimedia</label>
            {record.media_file_url ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video shadow-sm">
                {record.media_file_url.includes('google') ? (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-2 p-6 text-center">
                    <Eye className="text-blue-500" size={32} />
                    <p className="text-sm font-bold text-slate-900">Multimedia Captured</p>
                    <a href={record.media_file_url} target="_blank" className="clinical-btn-primary mt-2">View Attachment</a>
                  </div>
                ) : (
                  <img src={record.media_file_url} className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 flex items-center justify-center">No media attached</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-6 border-t border-slate-100 flex gap-4">
        <button onClick={onEdit} className="clinical-btn-primary flex-1 py-4">
          <Edit3 size={18} /> Edit Database Record
        </button>
        <button onClick={() => window.print()} className="clinical-btn-secondary px-6">
          <Printer size={18} />
        </button>
      </div>
    </motion.div>
  </div>
);

const DataBlock = ({ label, value }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
    <div className="bg-slate-50 p-4 rounded-xl text-slate-800 font-medium leading-relaxed border border-slate-100">
      {value || 'No entry documented.'}
    </div>
  </div>
);

const InfoItem = ({ label, value, icon }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-slate-400">
      {icon} <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-900 truncate">{value}</p>
  </div>
);

export default App;
