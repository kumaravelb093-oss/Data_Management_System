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
  Filter
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
      { entry_date_time: new Date().toISOString(), patient_name: 'Kumaravel', age: 30, diagnosis: 'Fracture', image_drive_link: '#', visit_type: 'New', gender: 'Male', mobile_number: '9876543210', village: 'Village A', taluk: 'Taluk X' },
      { entry_date_time: new Date(Date.now() - 86400000).toISOString(), patient_name: 'Anitha', age: 25, diagnosis: 'Joint Pain', image_drive_link: '#', visit_type: 'Review', gender: 'Female', mobile_number: '9123456789', village: 'Village B', taluk: 'Taluk Y' }
    ]), 1000);
  })
};

const App = () => {
  const [view, setView] = useState('home'); // Starting view
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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <nav className={`
        fixed inset-y-0 left-0 w-72 bg-[#1A2B3C] text-white p-6 flex flex-col gap-8 z-50 transition-transform duration-300
        lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Stethoscope size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Guru Ortho</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <SidebarItem
            icon={<Home size={20} />}
            label="Home Overview"
            active={view === 'home'}
            onClick={() => { setView('home'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<UserPlus size={20} />}
            label="Patient Entry"
            active={view === 'register'}
            onClick={() => { setView('register'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="All Records"
            active={view === 'dashboard'}
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
          />
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-medium">Cloud Database Connected</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-700 capitalize">
              {view === 'home' ? 'Welcome, Doctor' : view === 'register' ? 'New Registration' : 'Patient Database'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-bold">Ortho Clinic</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tamil Nadu, India</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <HomeOverview
                key="home"
                records={records}
                onAction={(v) => setView(v)}
              />
            )}
            {view === 'register' && (
              <RegistrationForm
                key="reg"
                onSuccess={() => {
                  showNotification('Patient Record Saved Successfully!');
                  loadRecords(); // Refresh data
                  setView('dashboard');
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 right-8 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
          >
            <div className="p-2 bg-white/20 rounded-lg">
              {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <span className="font-semibold pr-4">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const HomeOverview = ({ records, onAction }) => {
  const stats = [
    { label: 'Total Patients', value: records.length, icon: <Users size={24} />, color: 'bg-blue-500' },
    { label: 'Today Visits', value: records.filter(r => new Date(r.entry_date_time).toDateString() === new Date().toDateString()).length, icon: <Activity size={24} />, color: 'bg-emerald-500' },
    { label: 'X-Ray Reports', value: records.filter(r => r.image_drive_link && r.image_drive_link !== '#').length, icon: <FileText size={24} />, color: 'bg-purple-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className={`p-4 rounded-2xl text-white ${stat.color} shadow-lg shadow-current/10`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" /> Recent Activity
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {records.slice(0, 4).map((record, i) => (
              <div key={i} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {record.patient_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{record.patient_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{record.visit_type} • {new Date(record.entry_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-emerald-500"><ChevronRight size={18} /></div>
              </div>
            ))}
            <button
              onClick={() => onAction('dashboard')}
              className="w-full p-4 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors text-center"
            >
              View All Records
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => onAction('register')}
              className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-emerald-500 hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-white/20 group-hover:text-white">
                  <UserPlus size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-white">New Patient Registration</p>
                  <p className="text-xs text-slate-400 group-hover:text-white/80">Register a new clinic visit</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-white" />
            </button>

            <button
              onClick={() => onAction('dashboard')}
              className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-[#1A2B3C] hover:border-[#1A2B3C] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-white/10 group-hover:text-white">
                  <LayoutDashboard size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 group-hover:text-white">View Patient Database</p>
                  <p className="text-xs text-slate-400 group-hover:text-white/80">Search and filter all records</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-white" />
            </button>
          </div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto pb-20">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
              <User size={14} className="text-emerald-500" /> Patient Profile
            </h4>
            <div className="space-y-4">
              <InputField label="Patient Full Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Age" type="number" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} />
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">Gender</label>
                  <select className="input-premium mt-1.5" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <InputField label="Mobile Number" icon={<Phone size={14} />} value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" /> Location Info
            </h4>
            <div className="space-y-4">
              <InputField label="Village" value={formData.village} onChange={v => setFormData({ ...formData, village: v })} />
              <InputField label="Taluk" value={formData.taluk} onChange={v => setFormData({ ...formData, taluk: v })} />
              <InputField label="District" value={formData.district} onChange={v => setFormData({ ...formData, district: v })} />
            </div>
          </div>
        </div>

        {/* Clinical Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" /> Visit Context
            </h4>
            <div className="space-y-4">
              <InputField label="Visit Date" type="date" value={formData.visitDate} onChange={v => setFormData({ ...formData, visitDate: v })} />
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1">Visit Type</label>
                <select className="input-premium mt-1.5" value={formData.visitType} onChange={e => setFormData({ ...formData, visitType: e.target.value })}>
                  <option>New</option><option>Review</option>
                </select>
              </div>
              <InputField label="Doctor Name" value={formData.doctorName} onChange={v => setFormData({ ...formData, doctorName: v })} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
              <ClipboardList size={14} className="text-emerald-500" /> Clinical Notes
            </h4>
            <div className="space-y-4">
              <TextAreaField label="Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} />
              <TextAreaField label="Treatment / Procedure" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} />
            </div>
          </div>
        </div>

        {/* Image & Submit */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
              <Camera size={14} className="text-emerald-500" /> Medical Imaging
            </h4>
            <div className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group">
              {isCapturing ? (
                <div className="w-full h-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                    <button type="button" onClick={takePhoto} className="p-4 bg-emerald-500 text-white rounded-full shadow-lg"><Camera size={24} /></button>
                    <button type="button" onClick={toggleCamera} className="p-4 bg-rose-500 text-white rounded-full shadow-lg"><X size={24} /></button>
                  </div>
                </div>
              ) : image ? (
                <div className="w-full h-full relative">
                  <img src={image.base64} className="w-full h-full object-cover" alt="Captured" />
                  <button type="button" onClick={() => setImage(null)} className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-full"><X size={14} /></button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-10 cursor-pointer hover:bg-slate-100 transition-colors" onClick={toggleCamera}>
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors">
                    <Camera size={32} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to Open Camera</p>
                </div>
              )}
              <canvas ref={canvasRef} width="400" height="300" className="hidden" />
            </div>
          </div>

          <div className="bg-[#1A2B3C] p-6 rounded-3xl shadow-xl space-y-4 text-white">
            <TextAreaField label="Patient Instruction / Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} dark />
            <InputField label="Data Entered By" value={formData.enteredBy} onChange={v => setFormData({ ...formData, enteredBy: v })} dark />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? 'Syncing...' : 'Submit Patient Data'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

const InputField = ({ label, type = 'text', value, onChange, icon, required, dark }) => (
  <div>
    <label className={`text-xs font-bold ${dark ? 'text-slate-400' : 'text-slate-500'} ml-1 flex items-center gap-1`}>
      {icon} {label}
    </label>
    <input
      type={type}
      required={required}
      className={`input-premium mt-1.5 ${dark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, dark }) => (
  <div>
    <label className={`text-xs font-bold ${dark ? 'text-slate-400' : 'text-slate-500'} ml-1`}>{label}</label>
    <textarea
      rows={3}
      className={`input-premium mt-1.5 ${dark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const Dashboard = ({ records, onRefresh, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mobile_number?.includes(searchTerm);
    const matchesType = filterType === 'All' || r.visit_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name, Mobile or Diagnosis..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-emerald-500 focus:bg-white transition-all text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <Filter size={16} className="text-slate-400" />
            <select
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="All">All Visits</option>
              <option value="New">New Only</option>
              <option value="Review">Review Only</option>
            </select>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto lg:ml-0 p-3 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold px-6 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm disabled:opacity-50"
          >
            <Activity size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A2B3C] text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Patient & Contact</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Clinical Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Visit History</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-800 tracking-tight">{record.patient_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">{record.gender} / {record.age}y</span>
                      <span className="text-[10px] font-bold text-slate-400">{record.mobile_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-700 line-clamp-1">{record.diagnosis || 'General Checkup'}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{record.village}, {record.taluk}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg inline-block ${record.visit_type === 'New' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {record.visit_type}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 italic flex items-center gap-1">
                      <Clock size={10} /> {new Date(record.entry_date_time).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {record.image_drive_link && record.image_drive_link !== '#' ? (
                      <a
                        href={record.image_drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center w-max gap-2"
                      >
                        <FileText size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">View Report</span>
                      </a>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        <X size={12} /> No Records
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-32 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full">
                        <Search size={48} className="opacity-20" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest">No matching records found</p>
                    </div>
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

export default App;
