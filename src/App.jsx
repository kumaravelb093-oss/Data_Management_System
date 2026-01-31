import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, ArrowRight, Eye, Printer, RotateCcw, Play, Square, Edit3,
  ChevronRight, Map, Briefcase, Pill, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const submitToGas = async (payload) => {
  try {
    if (!API_URL) throw new Error('API URL Missing');
    const res = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) { throw error; }
};

const App = () => {
  const [view, setView] = useState('home');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (!API_URL) return;
      const response = await fetch(API_URL);
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) { showNotification('Sync Failed', 'error'); }
    setLoading(false);
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* PhysioTrack Minimal Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-slate-900">PhysioTrack</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clinical Enterprise</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'home' ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Dashboard</button>
          <button
            onClick={() => { setEditingRecord(null); setView('register'); }}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> New
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Dashboard
              key="home" records={records} loading={loading}
              onRefresh={loadRecords} onViewRecord={setSelectedRecord}
              onEditRecord={(rec) => { setEditingRecord(rec); setView('register'); }}
            />
          )}
          {view === 'register' && (
            <RegistrationForm
              key="reg" editData={editingRecord}
              onSuccess={(m) => { showNotification(m); loadRecords(); setView('home'); }}
              onError={(e) => showNotification(e, 'error')}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedRecord && (
          <Modal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed bottom-8 right-6 p-5 rounded-2xl shadow-2xl flex items-center gap-4 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-emerald-400" />}
            <span className="font-black text-xs uppercase tracking-widest">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ records, loading, onRefresh, onViewRecord, onEditRecord }) => {
  const [search, setSearch] = useState('');
  const filtered = records.filter(r =>
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(r.mobile).includes(search) ||
    r.village?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Patient Assessments</h2>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          {filtered.length} assessments • Synced with Google Sheets
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={onRefresh} className="px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => {/* logic for new from dash */ }} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold flex items-center gap-3">
          <Plus size={18} /> New
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input
          type="text" placeholder="Search by name, age, occupation, or diagnosis..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-slate-900 transition-all shadow-sm"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* PhysioTrack Styled Table */}
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Name</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Age</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-6 font-bold text-slate-500 text-sm">{new Date(r.timestamp).toLocaleDateString()}</td>
                <td className="px-8 py-6 font-black text-slate-900 text-base">{r.full_name}</td>
                <td className="px-8 py-6 font-bold text-slate-500 text-sm">{r.age}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onViewRecord(r)} className="p-3 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Eye size={16} /></button>
                    <button onClick={() => onEditRecord(r)} className="p-3 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Edit3 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No records matching search</div>
        )}
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ editData, onSuccess, onError }) => {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', mobile: '', alt_mobile: '',
    village: '', taluk: '', district: '', address: '',
    visit_type: 'New Visit', purpose: '', diagnosis: '',
    notes: '', treatment: '', medicines: '', review_date: ''
  });
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (editData) setForm({ ...editData, name: editData.full_name, mobile: editData.mobile || '' });
    startStream();
    return () => stopStream();
  }, [editData]);

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) { }
  };

  const stopStream = () => stream?.getTracks().forEach(t => t.stop());

  const capture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setMedia({ base64: canvas.toDataURL('image/jpeg'), type: 'image/jpeg', name: `cln_${Date.now()}.jpg` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitToGas({ ...form, media, patient_id: editData?.patient_id });
      if (res.success) onSuccess(res.message);
      else onError(res.error);
    } catch (err) { onError('Connection Failure'); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto pb-40">
      <div className="mb-12">
        <button onClick={() => window.history.back()} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"><ChevronRight className="rotate-180" size={14} /> Back to Dashboard</button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">{editData ? 'Modify Assessment' : 'New Assessment'}</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 italic">Comprehensive Clinical Record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <FormSection title="I. Patient Identity" icon={<User />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" type="number" value={form.age} onChange={v => setForm({ ...form, age: v })} required />
              <Select label="Gender" value={form.gender} options={['Male', 'Female', 'Other']} onChange={v => setForm({ ...form, gender: v })} />
            </div>
            <Field label="Primary Mobile" value={form.mobile} onChange={v => setForm({ ...form, mobile: v })} required />
            <Field label="Alternate Mobile" value={form.alt_mobile} onChange={v => setForm({ ...form, alt_mobile: v })} />
          </div>
        </FormSection>

        <FormSection title="II. Geographic Data" icon={<Map />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Village" value={form.village} onChange={v => setForm({ ...form, village: v })} />
            <Field label="Taluk" value={form.taluk} onChange={v => setForm({ ...form, taluk: v })} />
            <Field label="District" value={form.district} onChange={v => setForm({ ...form, district: v })} />
          </div>
          <div className="mt-6">
            <Area label="Full Residential Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          </div>
        </FormSection>

        <FormSection title="III. Clinical Evaluation" icon={<ClipboardList />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Select label="Visit Type" value={form.visit_type} options={['New Visit', 'Follow-up', 'Emergency', 'Surgery Review']} onChange={v => setForm({ ...form, visit_type: v })} />
            <Field label="Purpose of Visit" value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} />
          </div>
          <div className="space-y-6">
            <Area label="Diagnosis (Clinical Findings)" value={form.diagnosis} onChange={v => setForm({ ...form, diagnosis: v })} />
            <Area label="Doctor's Remarks & Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>
        </FormSection>

        <FormSection title="IV. Treatment & Review" icon={<Pill />}>
          <Area label="Treatment Plan" value={form.treatment} onChange={v => setForm({ ...form, treatment: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Area label="Medicines Prescribed" value={form.medicines} onChange={v => setForm({ ...form, medicines: v })} />
            <div className="space-y-6">
              <Field label="Next Review Date" type="date" value={form.review_date} onChange={v => setForm({ ...form, review_date: v })} />
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Multimedia Documentation</p>
                <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden relative border-4 border-white shadow-inner">
                  {media ? <img src={media.base64} className="w-full h-full object-cover" /> : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />}
                  {!media ? (
                    <button type="button" onClick={capture} className="absolute bottom-4 right-4 p-4 bg-slate-900 text-white rounded-full shadow-xl active:scale-90"><Camera size={20} /></button>
                  ) : (
                    <button type="button" onClick={() => setMedia(null)} className="absolute bottom-4 right-4 p-4 bg-rose-500 text-white rounded-full shadow-xl"><RotateCcw size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <button
          type="submit" disabled={submitting}
          className="w-full py-8 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.6em] text-xs shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? <RefreshCw className="animate-spin" size={20} /> : <span>{editData ? 'Update Database Record' : 'Commit Patient Registry'}</span>}
        </button>
      </form>
    </motion.div>
  );
};

const FormSection = ({ title, icon, children }) => (
  <div className="p-10 bg-white border border-slate-100 rounded-[48px] shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0" />
    <div className="flex items-center gap-4 mb-10 relative z-10 text-slate-900">
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">{React.cloneElement(icon, { size: 18 })}</div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

const Field = ({ label, type = 'text', value, onChange, required }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">{label}</label>
    <input
      type={type} value={value} required={required}
      onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900/5 rounded-2xl font-bold text-slate-800 outline-none transition-all placeholder:text-slate-200"
      placeholder={label.toUpperCase()}
    />
  </div>
);

const Select = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-4.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900/5 rounded-2xl font-black text-slate-800 outline-none transition-all uppercase"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const Area = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">{label}</label>
    <textarea
      rows={3} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900/5 rounded-3xl font-bold text-slate-800 outline-none transition-all placeholder:text-slate-200 leading-relaxed"
      placeholder={label.toUpperCase()}
    />
  </div>
);

const Modal = ({ record, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-10 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white font-black text-2xl uppercase shadow-xl">{record.full_name?.[0]}</div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">{record.full_name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.patient_id} • CLINICAL ASSESSMENT</p>
          </div>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        <div className="grid grid-cols-2 gap-8 pb-10 border-b border-slate-50">
          <DetailItem label="Mobile" value={record.mobile} icon={<Phone size={14} />} />
          <DetailItem label="Demographics" value={`${record.age}y / ${record.gender}`} icon={<User size={14} />} />
          <DetailItem label="Village" value={record.village} icon={<MapPin size={14} />} />
          <DetailItem label="Visit Type" value={record.visit_type} icon={<Clock size={14} />} />
        </div>
        <div className="space-y-8">
          <RecordBlock label="Diagnosis" value={record.clinical_diagnosis} color="bg-slate-50" />
          <RecordBlock label="Treatment Plan" value={record.treatment_plan} color="bg-slate-50" />
          <RecordBlock label="Prescribed Medicines" value={record.medicines} color="bg-slate-900 text-white" />
          {record.media_url && <a href={record.media_url} target="_blank" className="block w-full py-6 bg-slate-50 text-slate-900 rounded-[32px] text-center font-black text-[11px] uppercase tracking-widest border border-slate-100 shadow-sm border-dashed">Open Diagnostic Media</a>}
        </div>
      </div>
      <div className="p-8 bg-slate-50 flex gap-4">
        <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><Printer size={18} /> Print Record</button>
      </div>
    </motion.div>
  </div>
);

const RecordBlock = ({ label, value, color }) => (
  <div className={`p-8 rounded-[40px] border border-slate-100 ${color}`}>
    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3">{label}</p>
    <p className="text-base font-bold leading-relaxed">{value || 'No entry documented'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value || 'N/A'}</p>
    </div>
  </div>
);

export default App;
