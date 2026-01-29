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
  Printer
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
    setTimeout(() => resolve([
      { entry_date_time: new Date().toISOString(), patient_name: 'Mrs.Indrani', age: 48, diagnosis: 'Osteoarthritis Knee', image_drive_link: '#', visit_type: 'New', gender: 'Female', mobile_number: '9876543210', village: 'Village A', taluk: 'Taluk X', patient_id: 'P-1' },
      { entry_date_time: new Date(Date.now() - 86400000).toISOString(), patient_name: 'Mrs.Priya', age: 46, diagnosis: 'Lumbar Spondylosis', image_drive_link: '#', visit_type: 'Review', gender: 'Female', mobile_number: '9123456789', village: 'Village B', taluk: 'Taluk Y', patient_id: 'P-2' }
    ]), 1000);
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#1A2B3C] text-white px-5 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Stethoscope size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Guru Ortho</h1>
            <p className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">Clinical Portal</p>
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
            <Plus size={16} /> ADD NEW
          </button>
        </div>
      </header>

      {/* Content Area */}
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
                showNotification('Synced with Google Sheets');
                loadRecords();
                setSelectedRecord(savedRecord); // Open view modal immediately
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-6 inset-x-6 md:inset-x-auto md:right-8 p-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 text-white z-[100] ${notification.type === 'error' ? 'bg-rose-500' : 'bg-[#10B981]'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-black text-xs tracking-widest uppercase">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeHero = ({ records, loading, onRefresh, setView, onViewRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mobile_number?.includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={records.length} icon={<Users />} color="bg-blue-500" />
        <StatCard label="New Visits" value={records.filter(r => r.visit_type === 'New').length} icon={<Activity />} color="bg-emerald-500" />
        <StatCard label="Reports Uploaded" value={records.filter(r => r.image_drive_link && r.image_drive_link !== '#').length} icon={<FileText />} color="bg-violet-500" />
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</p>
            <p className="text-sm font-black text-slate-800 uppercase">Cloud Database</p>
          </div>
          <button onClick={onRefresh} className={`p-3 bg-slate-50 rounded-2xl text-slate-900 transition-all ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="relative group shadow-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search Name, Mobile or Diagnosis..."
          className="w-full pl-12 pr-4 py-5 bg-white border border-slate-100 rounded-[28px] outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-sm font-bold placeholder:text-slate-200"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Records Feed</h4>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Auto-Updated
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((record, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              className="bg-white p-6 rounded-[36px] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                    {record.patient_name?.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-black text-slate-800 text-lg leading-tight break-words">{record.patient_name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{record.visit_type} • {record.age}y / {record.gender}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Diagnosis</p>
                <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-relaxed">
                  {record.diagnosis || 'Checkup Pending'}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => onViewRecord(record)}
                  className="flex-1 p-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Eye size={16} /> Open
                </button>
                {record.image_drive_link && record.image_drive_link !== '#' && (
                  <a
                    href={record.image_drive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-200 transition-all"
                  >
                    <Camera size={18} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-current/20`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
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
        className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              {record.patient_name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{record.patient_name}</h3>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{record.patient_id} • {record.visit_type} Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scroll">
          {/* Section: Overview */}
          <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-50">
            <DetailItem label="Mobile" value={record.mobile_number} icon={<Phone />} />
            <DetailItem label="Age / Gender" value={`${record.age}y / ${record.gender}`} icon={<User />} />
            <DetailItem label="Location" value={`${record.village}, ${record.taluk}, ${record.district}`} icon={<MapPin />} />
            <DetailItem label="Visit Date" value={new Date(record.visit_date).toLocaleDateString()} icon={<Calendar />} />
          </div>

          {/* Section: Clinical */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Record</h4>
            <div className="space-y-6">
              <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-50">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Medical Diagnosis</p>
                <p className="text-base font-bold text-slate-800">{record.diagnosis || 'None entered'}</p>
              </div>
              <div className="bg-violet-50/50 p-5 rounded-3xl border border-violet-50">
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">Treatment / Procedure</p>
                <p className="text-base font-bold text-slate-800">{record.treatment_procedure || 'None entered'}</p>
              </div>
              {record.prescription_notes && (
                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-50">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Prescription</p>
                  <p className="text-base font-bold text-slate-800">{record.prescription_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: System */}
          <div className="pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span>Entered By: {record.data_entered_by}</span>
            <span>Ref: {new Date(record.entry_date_time).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-8 bg-slate-50 shrink-0 flex gap-4">
          {record.image_drive_link && record.image_drive_link !== '#' ? (
            <a
              href={record.image_drive_link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-emerald-500/20"
            >
              View Drive Photo
            </a>
          ) : (
            <button disabled className="flex-1 py-4 bg-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed">No Image Attached</button>
          )}
          <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm"><Printer size={20} /></button>
        </div>
      </motion.div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div className="flex gap-4">
    <div className="shrink-0 p-3 bg-slate-100 rounded-xl text-slate-500 h-fit">{React.cloneElement(icon, { size: 16 })}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value || 'N/A'}</p>
    </div>
  </div>
);

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
            if (res.success) onSuccess(res.record);
            else onError(res.message);
            setSubmitting(false);
          })
          .saveData({ ...formData, image });
      } else {
        const res = await gas.saveData({ ...formData, image });
        if (res.success) onSuccess(res.record);
        setSubmitting(false);
      }
    } catch (err) {
      onError('Submission failed');
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-20 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#1A2B3C] rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
          <UserPlus size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">New Patient</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 px-6">Entry will sync automatically with Sheets</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity (Blue) */}
        <section className="bg-blue-50/50 p-6 md:p-8 rounded-[40px] border border-blue-100/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 text-white rounded-xl shadow-md"><User size={20} /></div>
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">01. Identity</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Full Name" required value={formData.name} onChange={v => setFormData({ ...formData, name: v })} color="blue" />
            <div className="grid grid-cols-2 gap-5">
              <InputField label="Age" type="number" value={formData.age} onChange={v => setFormData({ ...formData, age: v })} color="blue" />
              <div>
                <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Gender</label>
                <select className="w-full mt-2 p-4 bg-white border border-blue-200 rounded-2xl font-black text-xs text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </div>
          <InputField label="Mobile Number" icon={<Phone size={14} />} value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} color="blue" />
        </section>

        {/* Section 2: Clinical (Violet) */}
        <section className="bg-violet-50/50 p-6 md:p-8 rounded-[40px] border border-violet-100/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-600 text-white rounded-xl shadow-md"><ClipboardList size={20} /></div>
            <h4 className="text-xs font-black text-violet-900 uppercase tracking-widest">02. Clinical Note</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-violet-400 uppercase ml-1">Visit Type</label>
              <div className="flex bg-white p-1 rounded-2xl mt-2 border border-violet-200">
                <button type="button" onClick={() => setFormData({ ...formData, visitType: 'New' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${formData.visitType === 'New' ? 'bg-violet-600 text-white shadow-lg' : 'text-violet-300'}`}>NEW VISIT</button>
                <button type="button" onClick={() => setFormData({ ...formData, visitType: 'Review' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${formData.visitType === 'Review' ? 'bg-violet-600 text-white shadow-lg' : 'text-violet-300'}`}>REVIEW</button>
              </div>
            </div>
            <InputField label="Visit Date" type="date" value={formData.visitDate} onChange={v => setFormData({ ...formData, visitDate: v })} color="violet" />
          </div>
          <TextAreaField label="Medical Diagnosis" value={formData.diagnosis} onChange={v => setFormData({ ...formData, diagnosis: v })} color="violet" />
          <TextAreaField label="Treatment / Procedure" value={formData.treatment} onChange={v => setFormData({ ...formData, treatment: v })} color="violet" />
          <TextAreaField label="Prescription / Medicines" value={formData.prescription} onChange={v => setFormData({ ...formData, prescription: v })} color="violet" />
        </section>

        {/* Section 4: Imaging (Rose) */}
        <section className="bg-rose-50/50 p-6 md:p-8 rounded-[40px] border border-rose-100/50 space-y-6 text-center">
          <div className="flex items-center gap-3 mb-4 text-left">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-md"><Camera size={20} /></div>
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest">03. X-Ray Capture</h4>
          </div>
          <div className="aspect-square max-w-[320px] mx-auto bg-white rounded-[40px] border-4 border-dashed border-rose-200 overflow-hidden relative group cursor-pointer shadow-inner" onClick={!image && !isCapturing ? toggleCamera : undefined}>
            {isCapturing ? (
              <div className="w-full h-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                  <button type="button" onClick={(e) => { e.stopPropagation(); takePhoto(); }} className="w-14 h-14 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"><Camera size={24} /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleCamera(); }} className="w-14 h-14 bg-white text-rose-500 border border-rose-100 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"><X size={24} /></button>
                </div>
              </div>
            ) : image ? (
              <div className="w-full h-full relative">
                <img src={image.base64} className="w-full h-full object-cover" alt="Captured" />
                <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute bottom-4 right-4 p-3 bg-white text-rose-500 rounded-2xl shadow-xl font-black text-[9px] uppercase tracking-widest">Retake</button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <div className="p-6 bg-rose-50 text-rose-300 rounded-[30px] group-hover:text-rose-500 transition-all">
                  <Camera size={44} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900">Open Camera</p>
                  <p className="text-[9px] font-bold text-rose-400 mt-1 uppercase">Back camera ready</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />
          </div>
        </section>

        {/* Section 2: Address (Amber) */}
        <section className="bg-amber-50/50 p-6 md:p-8 rounded-[40px] border border-amber-100/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md"><MapPin size={20} /></div>
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">04. Address Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField label="Village" value={formData.village} onChange={v => setFormData({ ...formData, village: v })} color="amber" />
            <InputField label="Taluk" value={formData.taluk} onChange={v => setFormData({ ...formData, taluk: v })} color="amber" />
            <InputField label="District" value={formData.district} onChange={v => setFormData({ ...formData, district: v })} color="amber" />
          </div>
          <InputField label="Doctor Remarks" value={formData.remarks} onChange={v => setFormData({ ...formData, remarks: v })} color="amber" />
          <InputField label="Data Entered By" value={formData.enteredBy} onChange={v => setFormData({ ...formData, enteredBy: v })} color="amber" />
        </section>

        {/* Final Submit */}
        <div className="pt-4 px-2 pb-10">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-slate-900/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>SYNCING TO SHEETS...</span>
              </>
            ) : (
              <>
                <span>CONFIRM & SYNC RECORD</span>
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const InputField = ({ label, type = 'text', value, onChange, icon, required, color = "blue" }) => {
  const colors = {
    blue: "border-blue-200/50 focus:border-blue-500 text-blue-900 placeholder:text-blue-300 ring-blue-500/10 focus:ring-4",
    amber: "border-amber-200/50 focus:border-amber-500 text-amber-900 placeholder:text-amber-300 ring-amber-500/10 focus:ring-4",
    violet: "border-violet-200/50 focus:border-violet-500 text-violet-900 placeholder:text-violet-300 ring-violet-500/10 focus:ring-4",
    rose: "border-rose-200/50 focus:border-rose-500 text-rose-900 placeholder:text-rose-300 ring-rose-500/10 focus:ring-4"
  };
  const labelColors = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
    rose: "text-rose-400"
  };

  return (
    <div className="w-full">
      <label className={`text-[10px] font-black uppercase ${labelColors[color]} ml-2 flex items-center gap-1`}>
        {icon} {label}
      </label>
      <input
        type={type}
        required={required}
        className={`w-full mt-2 p-4 bg-white border rounded-2xl font-black text-xs outline-none transition-all ${colors[color]}`}
        value={value}
        placeholder={`ENTER ${label.toUpperCase()}...`}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

const TextAreaField = ({ label, value, onChange, color = "blue" }) => {
  const colors = {
    blue: "border-blue-200/50 focus:border-blue-500 text-blue-900 placeholder:text-blue-300 ring-blue-500/10 focus:ring-4",
    amber: "border-amber-200/50 focus:border-amber-500 text-amber-900 placeholder:text-amber-300 ring-amber-500/10 focus:ring-4",
    violet: "border-violet-200/50 focus:border-violet-500 text-violet-900 placeholder:text-violet-300 ring-violet-500/10 focus:ring-4",
    rose: "border-rose-200/50 focus:border-rose-500 text-rose-900 placeholder:text-rose-300 ring-rose-500/10 focus:ring-4"
  };
  const labelColors = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
    rose: "text-rose-400"
  };

  return (
    <div className="w-full">
      <label className={`text-[10px] font-black uppercase ${labelColors[color]} ml-2`}>{label}</label>
      <textarea
        rows={3}
        className={`w-full mt-2 p-4 bg-white border rounded-2xl font-black text-xs outline-none transition-all ${colors[color]}`}
        value={value}
        placeholder={`TYPE ${label.toUpperCase()}...`}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

export default App;
