import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  LayoutDashboard,
  Camera,
  Upload,
  Stethoscope,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Calendar,
  ClipboardList,
  User,
  Activity,
  Home,
  Menu,
  Search,
  Users,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock google.script.run for local development
const gas = window.google?.script?.run || {
  saveData: (data) => new Promise((resolve) => {
    console.log('Mock: Saving data', data);
    setTimeout(() => resolve({ success: true, message: 'Saved successfully!' }), 1000);
  }),
  getRecords: () => new Promise((resolve) => {
    console.log('Mock: Fetching records');
    setTimeout(() => resolve([
      { entry_date_time: new Date().toISOString(), patient_name: 'Mrs.Indrani', age: 48, diagnosis: 'Fracture', image_drive_link: '#', visit_type: 'New', gender: 'Female', mobile_number: '9876543210', village: 'Village A', taluk: 'Taluk X' },
      { entry_date_time: new Date(Date.now() - 86400000).toISOString(), patient_name: 'Mrs.Priya', age: 46, diagnosis: 'Joint Pain', image_drive_link: '#', visit_type: 'Review', gender: 'Female', mobile_number: '9123456789', village: 'Village B', taluk: 'Taluk Y' },
      { entry_date_time: new Date(Date.now() - 172800000).toISOString(), patient_name: 'Mr.Dhivotham', age: 23, diagnosis: 'Sprain', image_drive_link: '#', visit_type: 'New', gender: 'Male', mobile_number: '9988776655', village: 'Village C', taluk: 'Taluk Z' }
    ]), 1000);
  })
};

const App = () => {
  const [view, setView] = useState('home');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (window.google) {
        google.script.run.withSuccessHandler((data) => {
          setRecords(data);
          setLoading(false);
        }).getRecords();
      } else {
        const data = await gas.getRecords();
        setRecords(data);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      {/* Sidebar - Desktop Only */}
      <nav className={`
        hidden lg:flex fixed inset-y-0 left-0 w-20 bg-white border-r border-slate-100 flex-col items-center py-8 gap-10 z-50
      `}>
        <div className="p-3 bg-slate-100 rounded-2xl">
          <Stethoscope size={28} className="text-slate-800" />
        </div>
        <div className="flex flex-col gap-6">
          <NavIcon icon={<Home size={22} />} active={view === 'home'} onClick={() => setView('home')} />
          <NavIcon icon={<Plus size={22} />} active={view === 'register'} onClick={() => setView('register')} />
          <NavIcon icon={<LayoutDashboard size={22} />} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        </div>
      </nav>

      <div className="flex-1 lg:ml-20 flex flex-col min-h-screen">
        {/* Top Header - Mobile & Desktop */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white overflow-hidden shadow-inner">
              <Stethoscope size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Guru Ortho</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('home')} className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors">Dashboard</button>
            <button
              onClick={() => setView('register')}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> New
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <HomeHero
                key="home"
                records={records}
                loading={loading}
                onRefresh={loadRecords}
                onRegister={() => setView('register')}
              />
            )}
            {view === 'register' && (
              <RegistrationForm
                key="reg"
                onSuccess={() => {
                  showNotification('Synced with Google Sheets');
                  loadRecords();
                  setView('home');
                }}
                onError={(err) => showNotification(err, 'error')}
              />
            )}
            {view === 'dashboard' && (
              <Dashboard
                key="dash"
                records={records}
                onRefresh={loadRecords}
                loading={loading}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 p-4 px-6 rounded-2xl shadow-2xl flex items-center gap-3 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-bold text-sm tracking-wide">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-all ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
  >
    {icon}
  </button>
);

const HomeHero = ({ records, loading, onRefresh, onRegister }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mobile_number?.includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Title Section */}
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Patient Assessments</h2>
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm">{records.length} assessments • Synced with Google Sheets</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRefresh}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button
          onClick={onRegister}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
        >
          <Plus size={18} />
          New
        </button>
      </div>

      {/* Search Section */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search by name, age, occupation, or condition..."
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-slate-300 transition-all text-slate-700 font-medium placeholder:text-slate-400"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[13px] font-bold text-slate-400">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((record, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-5 text-sm font-medium text-slate-500">
                    {new Date(record.entry_date_time).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-base font-bold text-slate-800 group-hover:text-slate-900">
                    {record.patient_name}
                  </td>
                  <td className="px-6 py-5 text-base font-medium text-slate-600 text-right">
                    {record.age}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-slate-400 font-medium italic">
                    No assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const RegistrationForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    village: '', taluk: '', district: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'New', doctorName: '',
    diagnosis: '', treatment: '', prescription: '', remarks: '',
    enteredBy: ''
  });
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const toggleCamera = async () => {
    if (isCapturing) {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setIsCapturing(false);
    } else {
      setIsCapturing(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        onError('Unable to access camera');
        setIsCapturing(false);
      }
    }
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 400, 300);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    setImage({ base64, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' });
    toggleCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (window.google) {
        google.script.run
          .withSuccessHandler((res) => {
            if (res.success) onSuccess();
            else onError(res.message);
            setSubmitting(false);
          })
          .saveData({ ...formData, image });
      } else {
        const res = await gas.saveData({ ...formData, image });
        if (res.success) onSuccess();
        setSubmitting(false);
      }
    } catch (err) {
      onError('Submission failed');
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Registration</h2>
          <p className="text-slate-500 font-medium">Register a patient and capture medical imaging.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setFormData({ ...formData, visitType: 'New' })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.visitType === 'New' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>NEW</button>
          <button onClick={() => setFormData({ ...formData, visitType: 'Review' })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.visitType === 'Review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>REVIEW</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 01 / Patient Basics</h4>
            <div className="space-y-5">
              <InputField label="Patient Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
              <div className="grid grid-cols-2 gap-5">
                <InputField label="Age" type="number" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">Gender</label>
                  <select className="w-full mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:bg-white focus:border-slate-300 transition-all" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <InputField label="Mobile Number" icon={<Phone size={14} />} value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 02 / Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputField label="Village" value={formData.village} onChange={v => setFormData({ ...formData, village: v })} />
              <InputField label="Taluk" value={formData.taluk} onChange={v => setFormData({ ...formData, taluk: v })} />
              <InputField label="District" value={formData.district} onChange={v => setFormData({ ...formData, district: v })} />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 03 / Clinical Note</h4>
            <div className="space-y-5">
              <TextAreaField label="Diagnosis (டியாமோசிஸ்)" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
              <TextAreaField label="Treatment / Procedure" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section 04 / Medical Imaging</h4>
            <div className="aspect-[4/3] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 overflow-hidden relative group cursor-pointer" onClick={!image && !isCapturing ? toggleCamera : undefined}>
              {isCapturing ? (
                <div className="w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                    <button type="button" onClick={(e) => { e.stopPropagation(); takePhoto(); }} className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><Camera size={24} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleCamera(); }} className="w-14 h-14 bg-white text-slate-900 border border-slate-200 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><X size={24} /></button>
                  </div>
                </div>
              ) : image ? (
                <div className="w-full h-full relative">
                  <img src={image.base64} className="w-full h-full object-cover" alt="Captured" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full backdrop-blur-md"><X size={16} /></button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Camera size={32} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Camera Access</p>
                </div>
              )}
              <canvas ref={canvasRef} width="400" height="300" className="hidden" />
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-sm shadow-2xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Syncing to Sheets...' : 'Confirm & Sync Record'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

const InputField = ({ label, type = 'text', value, onChange, icon, required }) => (
  <div>
    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">{icon} {label}</label>
    <input
      type={type}
      required={required}
      className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-300 transition-all placeholder:text-slate-300"
      value={value}
      placeholder={`Enter ${label}...`}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
    <textarea
      rows={3}
      className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-slate-300 transition-all placeholder:text-slate-300"
      value={value}
      placeholder={`Describe ${label}...`}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const Dashboard = ({ records, onRefresh, loading }) => {
  // Same as HomeHero but maybe with more detailed view later
  return <HomeHero records={records} loading={loading} onRefresh={onRefresh} onRegister={() => window.location.reload()} />;
};

export default App;
