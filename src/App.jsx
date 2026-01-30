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
  Plus,
  ArrowRight,
  Eye,
  Download,
  Printer,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock google.script.run for local development
const gas = window.google?.script?.run || {
  saveData: (data) => new Promise((resolve) => {
    console.log('Mock: Saving data', data);
    const mockRecord = {
      patient_id: 'P-' + Date.now(),
      patient_name: data.name,
      age: data.age,
      gender: data.gender,
      mobile_number: data.mobile,
      village: data.village,
      taluk: data.taluk,
      district: data.district,
      visit_date: data.visitDate || new Date().toISOString(),
      visit_type: data.visitType,
      doctor_name: data.doctorName,
      diagnosis: data.diagnosis,
      treatment_procedure: data.treatment,
      prescription_notes: data.prescription,
      doctor_remarks: data.remarks,
      image_drive_link: '#',
      data_entered_by: data.enteredBy || 'Doctor',
      entry_date_time: new Date().toISOString()
    };
    setTimeout(() => resolve({ success: true, message: 'Saved successfully!', record: mockRecord }), 1000);
  }),
  getRecords: () => new Promise((resolve) => {
    console.log('Mock: Fetching records');
    setTimeout(() => resolve([]), 1000);
  })
};

const App = () => {
  const [view, setView] = useState('home');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (window.google) {
        google.script.run
          .withSuccessHandler((data) => {
            setRecords(data);
            setLoading(false);
          })
          .withFailureHandler((err) => {
            showNotification('Sync Error: ' + err.message, 'error');
            setLoading(false);
          })
          .getRecords();
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
    setTimeout(() => setNotification(null), 5000); // 5 seconds for errors
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1A2B3C] text-white px-5 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Stethoscope size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Guru Ortho</h1>
            <p className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-widest leading-none">Management v2.1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <Home size={20} />
            </button>
          )}
          <button
            onClick={() => setView('register')}
            className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> NEW PATIENT
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <HomeHero
              key="home"
              records={records}
              loading={loading}
              onRefresh={loadRecords}
              setView={setView}
              onViewRecord={(rec) => setSelectedRecord(rec)}
            />
          )}
          {view === 'register' && (
            <RegistrationForm
              key="reg"
              onSuccess={(savedRecord) => {
                showNotification('Patient Record Locked & Saved');
                loadRecords();
                setSelectedRecord(savedRecord);
                setView('home');
              }}
              onError={(err) => showNotification(err, 'error')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Record Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <Modal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className={`fixed bottom-8 inset-x-8 md:inset-x-auto md:right-8 p-5 rounded-[28px] shadow-2xl flex items-center justify-center gap-4 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'
              }`}
          >
            <div className={`p-2 rounded-xl bg-white/20`}>
              {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-emerald-400" />}
            </div>
            <span className="font-black text-[11px] tracking-[0.1em] uppercase leading-tight max-w-[200px]">{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-50"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeHero = ({ records, loading, onRefresh, setView, onViewRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    visitType: 'All',
    gender: 'All',
    dateRange: 'All'
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      visitType: 'All',
      gender: 'All',
      dateRange: 'All'
    });
  };

  const filtered = records.filter(r => {
    const matchesSearch = r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mobile_number?.includes(searchTerm);

    const matchesVisit = filters.visitType === 'All' || r.visit_type === filters.visitType;
    const matchesGender = filters.gender === 'All' || r.gender === filters.gender;

    let matchesDate = true;
    if (filters.dateRange === 'Today') {
      matchesDate = new Date(r.entry_date_time).toDateString() === new Date().toDateString();
    } else if (filters.dateRange === 'Week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      matchesDate = new Date(r.entry_date_time) >= weekAgo;
    }

    return matchesSearch && matchesVisit && matchesGender && matchesDate;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search Name, Phone or Diagnosis..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-emerald-300 transition-all text-sm font-bold placeholder:text-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                }`}
            >
              <Filter size={16} /> Filters
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all"
            >
              <RotateCcw size={16} /> Restore
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-50 pt-4 relative"
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-2 right-0 p-2 text-slate-300 hover:text-rose-500 transition-colors md:hidden"
              >
                <X size={18} />
              </button>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Filter Parameters</h5>
                <button
                  onClick={() => setShowFilters(false)}
                  className="hidden md:flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-all"
                >
                  <X size={14} /> Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterSelect
                  label="Visit Nature"
                  value={filters.visitType}
                  options={['All', 'New', 'Review']}
                  onChange={v => setFilters({ ...filters, visitType: v })}
                />
                <FilterSelect
                  label="Gender"
                  value={filters.gender}
                  options={['All', 'Male', 'Female', 'Other']}
                  onChange={v => setFilters({ ...filters, gender: v })}
                />
                <FilterSelect
                  label="Date Range"
                  value={filters.dateRange}
                  options={['All', 'Today', 'Week']}
                  onChange={v => setFilters({ ...filters, dateRange: v })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Clinic Records Overview</h4>
          <p className="text-xl font-black text-slate-900 tracking-tight">{filtered.length} Assessments Registered</p>
        </div>
        <button onClick={onRefresh} className={`p-4 bg-white border border-slate-100 rounded-2xl text-slate-900 hover:bg-emerald-50 hover:text-emerald-600 transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} />
        </button>
      </div>

      {/* List Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((record, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={i}
            className="bg-white p-6 rounded-[36px] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-10 w-12 h-1 ${record.visit_type === 'New' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

            <div className="flex gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center font-black text-slate-300 text-xl group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-6">
                {record.patient_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 text-lg leading-tight truncate">{record.patient_name}</h5>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1">{record.age}y / {record.gender} • {record.visit_type}</p>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none italic">Diagnosis</p>
              <p className="text-sm font-bold text-slate-700 line-clamp-1 truncate leading-tight">
                {record.diagnosis || 'Clinical Review Pending'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                <Clock size={12} className="text-emerald-500" />
                {new Date(record.entry_date_time).toLocaleDateString()}
              </div>
              <button
                onClick={() => onViewRecord(record)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
              >
                <Eye size={14} /> Open
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center bg-white rounded-[40px] border border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
            <div className="p-8 bg-slate-50 rounded-full text-slate-100">
              <Search size={64} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching assessments in this view</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FilterSelect = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">{label}</label>
    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${value === opt ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const Modal = ({ record, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]"
      >
        <div className="bg-[#1A2B3C] p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-2xl">
              {record.patient_name?.[0]}
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-none mb-1 uppercase">{record.patient_name}</h3>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest opacity-80">{record.patient_id} • CASE RECORD</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {/* Quick Bio */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 pb-10 border-b border-slate-50">
            <DetailItem label="Mobile Contact" value={record.mobile_number} icon={<Phone />} />
            <DetailItem label="Age / Gender" value={`${record.age}y • ${record.gender}`} icon={<User />} />
            <DetailItem label="Visit Nature" value={record.visit_type} icon={<Clock />} />
            <DetailItem label="Entry Point" value={new Date(record.entry_date_time).toLocaleDateString()} icon={<Calendar />} />
            <div className="col-span-2">
              <DetailItem label="Permanent Address" value={`${record.village}, ${record.taluk}, ${record.district}`} icon={<MapPin />} />
            </div>
          </div>

          {/* Clinical Detail */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Case History</h4>
              <div className="h-0.5 flex-1 bg-slate-50 ml-4 rounded-full" />
            </div>

            <div className="space-y-6">
              <ViewCard label="Diagnosed Medical Condition" value={record.diagnosis} color="bg-blue-50 text-blue-900 border-blue-100" accent="bg-blue-500" />
              <ViewCard label="Advised Treatment / Procedure" value={record.treatment_procedure} color="bg-violet-50 text-violet-900 border-violet-100" accent="bg-violet-500" />
              {record.prescription_notes && (
                <ViewCard label="Prescribed Medicines" value={record.prescription_notes} color="bg-emerald-50 text-emerald-900 border-emerald-100" accent="bg-emerald-500" />
              )}
              {record.doctor_remarks && (
                <ViewCard label="Doctor's Internal Remarks" value={record.doctor_remarks} color="bg-amber-50 text-amber-900 border-amber-100" accent="bg-amber-500" />
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Registered by</p>
              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{record.data_entered_by}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Last Synced</p>
              <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{new Date(record.last_updated_time || record.entry_date_time).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 shrink-0 flex gap-4">
          {record.image_drive_link && record.image_drive_link !== '#' ? (
            <a
              href={record.image_drive_link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-5 bg-[#1A2B3C] text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest text-center shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <FileText size={18} /> Open Drive X-Ray
            </a>
          ) : (
            <div className="flex-1 py-5 bg-slate-200 text-slate-400 rounded-[24px] font-black text-[11px] uppercase tracking-widest text-center cursor-not-allowed">Imaging Not Found</div>
          )}
          <button onClick={() => window.print()} className="p-5 bg-white border border-slate-200 text-slate-900 rounded-[24px] shadow-sm hover:shadow-lg transition-all"><Printer size={22} /></button>
        </div>
      </motion.div>
    </div>
  );
};

const ViewCard = ({ label, value, color, accent }) => (
  <div className={`p-6 rounded-[28px] border relative ${color}`}>
    <div className={`absolute top-6 left-0 w-1 h-6 rounded-r-full ${accent}`} />
    <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40 mb-2 leading-none">{label}</p>
    <p className="text-base font-bold leading-relaxed">{value || 'Observation Data Missing'}</p>
  </div>
);

const DetailItem = ({ label, value, icon }) => (
  <div className="flex gap-4">
    <div className="shrink-0 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 h-fit">{React.cloneElement(icon, { size: 16 })}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value || 'N/A'}</p>
    </div>
  </div>
);

const RegistrationForm = ({ onSuccess, onError }) => {
  const initialForm = {
    name: '', age: '', gender: 'Male', mobile: '',
    village: '', taluk: '', district: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'New', doctorName: '',
    diagnosis: '', treatment: '', prescription: '', remarks: '',
    enteredBy: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const clearForm = () => {
    setFormData(initialForm);
    setImage(null);
    if (isCapturing) toggleCamera();
  };

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
        onError('Camera Hardware Inaccessible');
        setIsCapturing(false);
      }
    }
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 400, 300);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    setImage({ base64, name: `clinic_${Date.now()}.jpg`, type: 'image/jpeg' });
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
            if (res.success) onSuccess(res.record);
            else onError(res.message);
            setSubmitting(false);
          })
          .withFailureHandler((err) => {
            onError('Google Apps Script Failure: ' + err.message);
            setSubmitting(false);
          })
          .saveData({ ...formData, image });
      } else {
        const res = await gas.saveData({ ...formData, image });
        if (res.success) onSuccess(res.record);
        setSubmitting(false);
      }
    } catch (err) {
      onError('Synchronization Fatal Error');
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pb-24 max-w-4xl mx-auto">
      {/* Form Header with Clear Bit */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-20 h-20 bg-[#1A2B3C] rounded-[32px] mb-6 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 relative">
          <UserPlus size={40} />
          <button
            type="button"
            onClick={clearForm}
            className="absolute -top-2 -right-2 p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all scale-90"
            title="Clear Everything"
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Registration</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Advanced Orthopedic Clinical Entry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Bio (Blue) */}
        <Section title="01. Identity & Profile" color="blue" icon={<User />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Patient Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} color="blue" />
            <div className="grid grid-cols-2 gap-5">
              <InputField label="Age (Years)" type="number" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} color="blue" />
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase ml-2 tracking-widest">Gender</label>
                <select className="w-full mt-2.5 p-4.5 bg-white border border-blue-100 rounded-2xl font-black text-xs text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all uppercase" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </div>
          <InputField label="Primary Contact Mobile" icon={<Phone size={14} />} value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} color="blue" />
        </Section>

        {/* Section 2: Clinical (Violet) */}
        <Section title="02. Clinical Assessment" color="violet" icon={<ClipboardList />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-violet-400 uppercase ml-2 tracking-widest leading-none block mb-2.5">Visit Classification</label>
              <div className="flex bg-white p-1.5 rounded-2xl border border-violet-100 gap-1.5">
                <button type="button" onClick={() => setFormData({ ...formData, visitType: 'New' })} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${formData.visitType === 'New' ? 'bg-violet-600 text-white shadow-xl' : 'text-violet-300'}`}>NEW CASE</button>
                <button type="button" onClick={() => setFormData({ ...formData, visitType: 'Review' })} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${formData.visitType === 'Review' ? 'bg-violet-600 text-white shadow-xl' : 'text-violet-300'}`}>REVIEW</button>
              </div>
            </div>
            <InputField label="Date of Assessment" type="date" value={formData.visitDate} onChange={v => setFormData({ ...formData, visitDate: v })} color="violet" />
          </div>
          <TextAreaField label="Clinical Diagnosis (Assessment)" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} color="violet" />
          <TextAreaField label="Prescription / Medicines Advice" value={formData.prescription} onChange={v => setFormData({ ...formData, prescription: v })} color="violet" />
        </Section>

        {/* Section 3: Radiography (Rose) */}
        <Section title="03. Radiography Capture" color="rose" icon={<Camera />}>
          <div className="aspect-square max-w-[340px] mx-auto bg-white rounded-[48px] border-4 border-dashed border-rose-100 overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:scale-[1.01]" onClick={!image && !isCapturing ? toggleCamera : undefined}>
            {isCapturing ? (
              <div className="w-full h-full relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6">
                  <button type="button" onClick={(e) => { e.stopPropagation(); takePhoto(); }} className="w-18 h-18 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30"><Camera size={32} /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleCamera(); }} className="w-18 h-18 bg-white text-rose-500 rounded-full flex items-center justify-center shadow-2xl"><X size={32} /></button>
                </div>
              </div>
            ) : image ? (
              <div className="w-full h-full relative">
                <img src={image.base64} className="w-full h-full object-cover" alt="Captured" />
                <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest">Discard Photo</button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-5 p-10">
                <div className="p-8 bg-rose-50 text-rose-200 rounded-[40px] group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                  <Camera size={56} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-900 leading-none">Open Camera</p>
                  <p className="text-[9px] font-bold text-rose-300 mt-2 uppercase tracking-widest">Uploads to Cloud Drive</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />
          </div>
        </Section>

        {/* Section 4: Location (Amber) */}
        <Section title="04. Address & Metadata" color="amber" icon={<MapPin />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Village" value={formData.village} onChange={v => setFormData({ ...formData, village: v })} color="amber" />
            <InputField label="Taluk" value={formData.taluk} onChange={v => setFormData({ ...formData, taluk: v })} color="amber" />
            <InputField label="District" value={formData.district} onChange={v => setFormData({ ...formData, district: v })} color="amber" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <InputField label="Doctor Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} color="amber" />
            <InputField label="Data Entered By" value={formData.enteredBy} onChange={v => setFormData({ ...formData, enteredBy: v })} color="amber" />
          </div>
        </Section>

        {/* Submit */}
        <div className="pt-6 px-2 flex flex-col gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-7 bg-slate-900 text-white rounded-[36px] font-black uppercase tracking-[0.3em] text-sm shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
          >
            {submitting ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                <span>SYNCING CLINIC DATA...</span>
              </>
            ) : (
              <>
                <span>SAVE PATIENT RECORD</span>
                <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={clearForm}
            className="w-full py-4 bg-transparent border-2 border-slate-100 text-slate-300 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100"
          >
            Purge Current Form (Reset)
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const Section = ({ title, color, icon, children }) => {
  const styles = {
    blue: "bg-blue-50/50 border-blue-100",
    violet: "bg-violet-50/50 border-violet-100",
    rose: "bg-rose-50/50 border-rose-100",
    amber: "bg-amber-50/50 border-amber-100"
  };
  const iconStyles = {
    blue: "bg-blue-500",
    violet: "bg-violet-600",
    rose: "bg-rose-500",
    amber: "bg-amber-500"
  };
  const textStyles = {
    blue: "text-blue-900",
    violet: "text-violet-900",
    rose: "text-rose-900",
    amber: "text-amber-900"
  };

  return (
    <section className={`p-8 md:p-10 rounded-[48px] border-2 border-white shadow-sm space-y-8 ${styles[color]}`}>
      <div className="flex items-center gap-4 mb-2">
        <div className={`p-3 text-white rounded-2xl shadow-xl shadow-current/10 ${iconStyles[color]}`}>{React.cloneElement(icon, { size: 20, strokeWidth: 3 })}</div>
        <h4 className={`text-base font-black uppercase tracking-tight ${textStyles[color]}`}>{title}</h4>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
};

const InputField = ({ label, type = 'text', value, onChange, icon, required, color = "blue" }) => {
  const colors = {
    blue: "border-blue-200/50 focus:border-blue-500 text-blue-900 placeholder:text-blue-100 focus:bg-white",
    amber: "border-amber-200/50 focus:border-amber-500 text-amber-900 placeholder:text-amber-100 focus:bg-white",
    violet: "border-violet-200/50 focus:border-violet-500 text-violet-900 placeholder:text-violet-100 focus:bg-white",
    rose: "border-rose-200/50 focus:border-rose-500 text-rose-900 placeholder:text-rose-100 focus:bg-white"
  };
  const labelColors = {
    blue: "text-blue-400 font-bold",
    amber: "text-amber-400 font-bold",
    violet: "text-violet-400 font-bold",
    rose: "text-rose-400 font-bold"
  };

  return (
    <div className="w-full">
      <label className={`text-[10px] font-black uppercase ${labelColors[color]} ml-2 leading-none block mb-2.5 tracking-widest`}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        className={`w-full p-4.5 bg-white/40 border-2 rounded-[22px] font-black text-xs outline-none transition-all ${colors[color]}`}
        value={value}
        placeholder={`${label.toUpperCase()}...`}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

const TextAreaField = ({ label, value, onChange, color = "blue" }) => {
  const colors = {
    blue: "border-blue-200/50 focus:border-blue-500 text-blue-900 placeholder:text-blue-100 focus:bg-white",
    amber: "border-amber-200/50 focus:border-amber-500 text-amber-900 placeholder:text-amber-100 focus:bg-white",
    violet: "border-violet-200/50 focus:border-violet-500 text-violet-900 placeholder:text-violet-100 focus:bg-white",
    rose: "border-rose-200/50 focus:border-rose-500 text-rose-900 placeholder:text-rose-100 focus:bg-white"
  };
  const labelColors = {
    blue: "text-blue-400 font-bold",
    amber: "text-amber-400 font-bold",
    violet: "text-violet-400 font-bold",
    rose: "text-rose-400 font-bold"
  };

  return (
    <div className="w-full">
      <label className={`text-[10px] font-black uppercase ${labelColors[color]} ml-2 leading-none block mb-2.5 tracking-widest`}>{label}</label>
      <textarea
        rows={4}
        className={`w-full p-5 bg-white/40 border-2 rounded-[28px] font-black text-xs outline-none transition-all ${colors[color]}`}
        value={value}
        placeholder={`DESCRIBE ${label.toUpperCase()}...`}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

export default App;
