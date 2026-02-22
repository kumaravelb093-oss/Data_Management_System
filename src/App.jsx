import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3, Upload, File,
  ChevronRight, Activity, Database, Users, TrendingUp, Printer,
  Clock, ArrowRight, UserCircle, Briefcase, HeartPulse, FileWarning, PlusCircle
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

const PLUS_CIRCLE = <PlusCircle size={20} />;
const ROTATE_CCW = <RotateCcw size={16} />;

// Helper: Parse date from various formats (Google Sheets returns different formats)
const parseRecordDate = (dateValue) => {
  if (!dateValue) return null;

  // If it's already a Date object or a valid date string
  const parsed = new Date(dateValue);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try parsing Google Sheets date format (may be a number representing days since epoch)
  if (typeof dateValue === 'number') {
    // Google Sheets epoch starts from Dec 30, 1899
    const sheetsEpoch = new Date(1899, 11, 30);
    const result = new Date(sheetsEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    if (!isNaN(result.getTime())) return result;
  }

  return null;
};

// Helper: Format date for display
const formatDate = (dateValue) => {
  const date = parseRecordDate(dateValue);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper: Format time for display
const formatTime = (dateValue) => {
  const date = parseRecordDate(dateValue);
  if (!date) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// Helper: Check if date is today
const isToday = (dateValue) => {
  const date = parseRecordDate(dateValue);
  if (!date) return false;

  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Helper: Convert Google Drive URL to viewable image thumbnail
const getViewableImageUrl = (url) => {
  if (!url) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  return url;
};

// Helper: Convert Google Drive URL to direct streamable link for <video>
const getStreamableFileUrl = (url) => {
  if (!url) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://docs.google.com/uc?id=${id}&export=download`;
  return url;
};

// Helper: Convert Google Drive URL to embedded preview viewer (more reliable for playback)
const getEmbedViewerUrl = (url) => {
  if (!url) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return url;
};

// Helper: Get record date field (handles different field names)
const getRecordDate = (record) => {
  return record.entry_date___time || record.entry_date_time || record.entry_date__time || record.timestamp || record.entry_date_and_time;
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

  const loadRecords = useCallback(async () => {
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
    } catch (e) {
      showNotification('Sync Error: Check Authorization', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const showNotification = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const handleEdit = useCallback((record) => {
    setSelectedRecord(null);
    setEditingRecord(record);
    setView('register');
  }, []);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setView('register');
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Responsive Professional Header */}
      <header className="bg-navy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-dark-orange rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Stethoscope className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-black tracking-tight text-white leading-none">Guru Ortho</h1>
              <span className="text-[8px] md:text-[10px] font-bold text-orange-400 uppercase tracking-widest opacity-80 hidden sm:block">Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <button
                onClick={() => setView('home')}
                className="clinical-btn-secondary p-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <Home size={18} />
              </button>
            )}
            <button
              onClick={handleAdd}
              className="clinical-btn-primary p-2 md:px-4 md:py-2 text-[10px] md:text-sm whitespace-nowrap bg-dark-orange hover:bg-orange-700 border-0"
            >
              <Plus size={18} /> <span className="hidden sm:inline">New Admission</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <Dashboard
              key="home"
              records={records}
              loading={loading}
              onRefresh={loadRecords}
              onViewRecord={setSelectedRecord}
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
            className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 px-4 py-3 md:px-6 md:py-4 rounded-xl shadow-2xl text-white font-bold text-xs md:text-sm z-[100] flex items-center gap-2 max-w-[90vw] ${notification.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = ({ records, loading, onRefresh, onViewRecord, onEditRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Optimized: Memoize stats calculation with proper date parsing
  const stats = useMemo(() => ({
    today: records.filter(r => isToday(getRecordDate(r))).length,
    op: records.filter(r => r.service_type?.trim().toUpperCase() === 'OP').length,
    ip: records.filter(r => r.service_type?.trim().toUpperCase() === 'IP').length,
    total: records.length
  }), [records]);

  // Optimized: Memoize filtered records
  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return records.filter(r => {
      const matchesSearch = search === '' || (
        r.patient_name?.toLowerCase().includes(search) ||
        String(r.mobile_number).includes(search) ||
        r.patient_id?.toLowerCase().includes(search) ||
        r.address?.toLowerCase().includes(search) ||
        r.chief_complaint?.toLowerCase().includes(search)
      );

      const recordSector = r.service_type?.trim().toUpperCase();
      const matchesTab = activeTab === 'All' || recordSector === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [records, searchTerm, activeTab]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 md:space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <StatItem label="Today" value={stats.today} icon={<Clock size={16} />} color="text-orange-600" />
        <StatItem label="OP" value={stats.op} icon={<TrendingUp size={16} />} color="text-navy" />
        <StatItem label="IP" value={stats.ip} icon={<Activity size={16} />} color="text-orange-700" />
        <StatItem label="Total" value={stats.total} icon={<Users size={16} />} color="text-slate-800" />
      </div>

      {/* Tabs + Search Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar">
          {['All', 'OP', 'IP'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-[11px] md:text-sm font-black tracking-wider uppercase transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-dark-orange' : 'text-slate-500'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-orange" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-dark-orange transition-all font-medium text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={onRefresh} className="p-2.5 text-slate-400 hover:text-dark-orange transition-all bg-white border border-slate-200 rounded-xl shadow-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mobile Card View + Desktop Table */}
      <div className="glass-card overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.slice(0, 50).map((record, i) => (
            <div key={i} className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-navy'
                    }`}>
                    {record.service_type || 'OP'}
                  </span>
                  <span className="text-[10px] font-black text-slate-500">{formatDate(getRecordDate(record))}</span>
                </div>
                <h3 className="font-black text-slate-900 text-sm truncate">{record.patient_name}</h3>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">{record.age}y • {record.mobile_number}</p>
                {record.chief_complaint && (
                  <p className="text-[11px] font-bold text-slate-500 mt-1 truncate italic">"{record.chief_complaint}"</p>
                )}
              </div>
              {/* Mobile Action Buttons */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onViewRecord(record)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-orange-100 hover:text-dark-orange transition-all"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onEditRecord(record)}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-all"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No records found</div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full patient-table border-collapse">
            <thead>
              <tr className="bg-slate-100 italic">
                <th className="text-slate-700 font-black">Date</th>
                <th className="text-slate-700 font-black">Name</th>
                <th className="text-slate-700 font-black">Age</th>
                <th className="text-slate-700 font-black">Sector</th>
                <th className="text-slate-700 font-black">Chief Complaint</th>
                <th className="text-slate-700 font-black">Contact</th>
                <th className="text-center text-slate-700 font-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((record, i) => (
                <tr key={i} className="table-row hover:bg-slate-50">
                  <td className="whitespace-nowrap text-xs">
                    <div>{formatDate(getRecordDate(record))}</div>
                    <div className="text-[9px] text-slate-400">{formatTime(getRecordDate(record))}</div>
                  </td>
                  <td className="font-bold text-slate-900">{record.patient_name}</td>
                  <td>{record.age}y/{record.gender?.[0]}</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-navy'
                      }`}>
                      {record.service_type || 'OP'}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate text-slate-500 text-xs">{record.chief_complaint || '-'}</td>
                  <td className="text-xs">{record.mobile_number}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewRecord(record); }}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-navy transition-all"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditRecord(record); }}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-amber-100 hover:text-amber-600 transition-all"
                        title="Edit Record"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan="7" className="py-16 text-center text-slate-400 font-medium">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-8">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        {records.length} Records • Cloud Sync Active
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, icon, color }) => (
  <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-sm">
    <div>
      <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-lg md:text-2xl font-black text-slate-900 leading-none">{value}</p>
    </div>
    <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 ${color}`}>
      {icon}
    </div>
  </div>
);

const RegistrationForm = ({ editData, onSuccess, onError, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', mobile: '',
    service_type: 'OP', address: '', occupation: '',
    chief_complaint: '', medical_history: '',
    diagnosis: '', treatment: '', remarks: ''
  });
  const [mediaSlots, setMediaSlots] = useState([
    { base64: null, type: null, name: null, url: null },
    { base64: null, type: null, name: null, url: null },
    { base64: null, type: null, name: null, url: null },
    { base64: null, type: null, name: null, url: null }
  ]);
  const [documentFile, setDocumentFile] = useState({ base64: null, type: null, name: null, url: null });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'video'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordTime(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatRecordTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.patient_name || '',
        age: editData.age || '',
        gender: editData.gender || 'Male',
        mobile: editData.mobile_number || '',
        service_type: editData.service_type || 'OP',
        address: editData.address || '',
        occupation: editData.occupation || '',
        chief_complaint: recordValue(editData.chief_complaint),
        medical_history: recordValue(editData.medical_history),
        diagnosis: recordValue(editData.diagnosis),
        treatment: recordValue(editData.treatment),
        remarks: recordValue(editData.remarks)
      });
      setMediaSlots([
        { base64: null, type: null, name: null, url: editData.media_url_1 || null },
        { base64: null, type: null, name: null, url: editData.media_url_2 || null },
        { base64: null, type: null, name: null, url: editData.media_url_3 || null },
        { base64: null, type: null, name: null, url: editData.media_url_4 || null }
      ]);
    }
  }, [editData]);

  const recordValue = (val) => val === 'No entry documented' || !val ? '' : val;

  useEffect(() => {
    if (!mediaSlots[activeSlot]?.base64 && !mediaSlots[activeSlot]?.url) startStream();
    return () => stopStream();
  }, [mode, activeSlot, mediaSlots]);

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
    const newMedia = { base64: canvas.toDataURL('image/jpeg'), type: 'image/jpeg', name: `pic_${Date.now()}.jpg`, url: null };
    const updated = [...mediaSlots];
    updated[activeSlot] = newMedia;
    setMediaSlots(updated);
  };

  const startRecording = () => {
    if (!stream || isProcessing) return;

    const chunks = [];
    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

    try {
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => (e.data.size > 0) && chunks.push(e.data);
      mr.onstop = () => {
        setIsProcessing(true);
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const newMedia = {
            base64: reader.result,
            type: mimeType,
            name: `vid_${Date.now()}.${ext}`,
            url: null
          };
          const updated = [...mediaSlots];
          updated[activeSlot] = newMedia;
          setMediaSlots(updated);
          setIsProcessing(false);
          showNotification('Video processed successfully');
        };
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      showNotification('Recording failed to start', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        patient_id: editData?.patient_id,
        entry_date_time: editData?.entry_date___time || editData?.entry_date_time,
        enteredBy: 'Practitioner',
        // Send existing URLs
        media_url_1: mediaSlots[0].url,
        media_url_2: mediaSlots[1].url,
        media_url_3: mediaSlots[2].url,
        media_url_4: mediaSlots[3].url,
        // Send new base64 uploads
        media1: mediaSlots[0].base64 ? mediaSlots[0] : null,
        media2: mediaSlots[1].base64 ? mediaSlots[1] : null,
        media3: mediaSlots[2].base64 ? mediaSlots[2] : null,
        media4: mediaSlots[3].base64 ? mediaSlots[3] : null,
        // Send document upload
        document_file: (documentFile.base64 && documentFile.base64.startsWith('data:')) ? documentFile : null,
        document_url: documentFile.url,
      };
      const res = await submitToGas(payload);
      if (res.success) onSuccess(res.message);
      else onError(res.error || 'Server rejected');
    } catch (err) { onError('Sync Fail'); }
    finally { setIsSubmitting(false); }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{editData ? 'Modify Record' : 'New Admission'}</h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Patient Registration</p>
        </div>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-900 transition-all bg-white rounded-xl shadow-sm border border-slate-100">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Identity & Contact Section */}
        <section className="glass-card p-4 md:p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
            <UserCircle size={12} /> Patient Identity
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Full Name" required value={formData.name} onChange={v => updateField('name', v)} />
            <TextField label="Mobile" required value={formData.mobile} onChange={v => updateField('mobile', v)} />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            <TextField label="Age" type="number" required value={formData.age} onChange={v => updateField('age', v)} />
            <SelectBox label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={v => updateField('gender', v)} />
            <SelectBox label="Sector" value={formData.service_type} options={['OP', 'IP']} onChange={v => updateField('service_type', v)} />
            <TextField label="Occupation" value={formData.occupation} onChange={v => updateField('occupation', v)} />
          </div>
          <AreaField label="Address" rows={2} value={formData.address} onChange={v => updateField('address', v)} placeholder="Patient's address..." />
        </section>

        {/* Clinical Assessment Section */}
        <section className="glass-card p-4 md:p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
            <HeartPulse size={12} /> Clinical Assessment
          </h4>
          <AreaField label="Chief Complaint" rows={2} value={formData.chief_complaint} onChange={v => updateField('chief_complaint', v)} placeholder="Primary symptoms and concerns..." />
          <AreaField label="Medical History" rows={2} value={formData.medical_history} onChange={v => updateField('medical_history', v)} placeholder="Past medical history, surgeries, allergies..." />
        </section>

        {/* Multimedia Section - Vertical Filling */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            <Camera size={12} /> Diagnostic Documentation (Up to 4)
          </h4>

          <div className="space-y-4">
            {[0, 1, 2, 3].map((idx) => {
              const isSlotActive = activeSlot === idx;
              const slotMedia = mediaSlots[idx];
              const hasMedia = !!(slotMedia.base64 || slotMedia.url);

              return (
                <div
                  key={idx}
                  className={`glass-card overflow-hidden transition-all border-2 ${isSlotActive ? 'border-dark-orange shadow-lg' : 'border-transparent'}`}
                  onClick={() => !isSlotActive && setActiveSlot(idx)}
                >
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Slot {idx + 1}</span>
                    {hasMedia && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-black uppercase">Captured</span>
                    )}
                  </div>

                  <div className="aspect-video bg-slate-900 relative">
                    {hasMedia ? (
                      <div className="w-full h-full relative">
                        {slotMedia.base64 ? (
                          slotMedia.type.startsWith('image') ? (
                            <img src={slotMedia.base64} className="w-full h-full object-contain" />
                          ) : (
                            <video src={slotMedia.base64} className="w-full h-full object-contain" controls />
                          )
                        ) : (
                          <div className="w-full h-full">
                            {slotMedia.url.includes('video') || slotMedia.url.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                              <iframe src={getEmbedViewerUrl(slotMedia.url)} className="w-full h-full border-0" allow="autoplay" title={`Shot ${idx + 1}`} />
                            ) : (
                              <img src={getViewableImageUrl(slotMedia.url)} className="w-full h-full object-contain" />
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...mediaSlots];
                            updated[idx] = { base64: null, type: null, name: null, url: null };
                            setMediaSlots(updated);
                            startStream();
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur shadow-lg text-rose-500 rounded-lg hover:bg-white"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    ) : (
                      isSlotActive ? (
                        <div className="w-full h-full relative">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                          {/* Processing Overlay */}
                          {isProcessing && (
                            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                              <RefreshCw className="animate-spin text-dark-orange" size={40} />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white animate-pulse">Processing Video...</p>
                            </div>
                          )}

                          {/* Recording Feedback Overlay */}
                          {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 z-10">
                              <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{formatRecordTime(recordTime)}</span>
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Live</span>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 z-10">
                            {!isRecording && !isProcessing && (
                              <div className="flex bg-black/40 backdrop-blur-xl p-1 rounded-xl border border-white/20">
                                <button type="button" onClick={() => setMode('camera')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-navy shadow-xl' : 'text-white/70 hover:text-white'}`}>Photo</button>
                                <button type="button" onClick={() => setMode('video')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-navy shadow-xl' : 'text-white/70 hover:text-white'}`}>Video</button>
                              </div>
                            )}

                            {!isProcessing && (
                              mode === 'camera' ? (
                                <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-4 border-white/30">
                                  <Camera size={26} className="text-dark-orange" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={isRecording ? stopRecording : startRecording}
                                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-4 border-white/30 transition-all ${isRecording ? 'bg-rose-500 scale-110 shadow-rose-500/20' : 'bg-white'}`}
                                >
                                  {isRecording ? <Square size={22} className="text-white fill-white" /> : <Play size={24} className="text-dark-orange ml-1" />}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-800 transition-colors">
                          <PlusCircle size={32} className="mb-2 opacity-50" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Tap to enable slot {idx + 1}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Document Upload Section */}
        <section className="glass-card p-4 md:p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
            <Upload size={12} /> Supporting Documents (Optional)
          </h4>
          <div className="relative group p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-dark-orange transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-3">
            {documentFile.base64 || documentFile.url ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-dark-orange">
                  <File size={32} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-700 truncate max-w-[250px]">{documentFile.name || 'document_uploaded'}</p>
                  <button
                    type="button"
                    onClick={() => setDocumentFile({ base64: null, type: null, name: null, url: null })}
                    className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Remove Document
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-400">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-tight">Upload PDF, Image or Video</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Files in your phone memory</p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setDocumentFile({
                        base64: reader.result,
                        type: file.type,
                        name: file.name
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </>
            )}
          </div>
        </section>

        {/* Treatment Section */}
        <section className="glass-card p-4 md:p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
            <ClipboardList size={12} /> Treatment Protocol
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AreaField label="Diagnosis" rows={3} value={formData.diagnosis} onChange={v => updateField('diagnosis', v)} placeholder="Clinical diagnosis..." />
            <AreaField label="Treatment" rows={3} value={formData.treatment} onChange={v => updateField('treatment', v)} placeholder="Treatment plan..." />
            <AreaField label="Remarks" rows={3} value={formData.remarks} onChange={v => updateField('remarks', v)} placeholder="Additional notes..." />
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 bg-dark-orange text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : (editData ? 'Update Record' : 'Save Record')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const TextField = ({ label, type = 'text', required, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-dark-orange focus:bg-white transition-all font-black text-slate-800 text-sm"
    />
  </div>
);

const SelectBox = ({ label, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-dark-orange focus:bg-white transition-all font-black text-slate-800 text-sm appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const AreaField = ({ label, rows = 3, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <textarea
      rows={rows} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-dark-orange focus:bg-white transition-all font-bold text-slate-800 text-sm resize-none"
      placeholder={placeholder}
    />
  </div>
);

const Modal = ({ record, onClose, onEdit }) => {
  const mediaUrls = useMemo(() => [
    record.media_url_1,
    record.media_url_2,
    record.media_url_3,
    record.media_url_4
  ].filter(url => url && url !== 'None'), [record]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const recordDate = getRecordDate(record);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-3xl md:rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-5 md:px-6 md:py-6 bg-navy text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-slate-800 to-navy rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg border border-white/10">
              {record.patient_name?.[0]}
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight">{record.patient_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${record.service_type?.trim().toUpperCase() === 'IP' ? 'bg-dark-orange' : 'bg-slate-700'
                  }`}>{record.service_type || 'OP'}</span>
                <span className="text-[9px] font-bold text-slate-400">{record.patient_id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3"
              title="Print Clinical Report"
            >
              <Printer size={16} /> <span className="hidden md:inline">Print Report</span>
            </button>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 print:overflow-visible print:h-auto">
          {/* Print Only Header */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">GURU ORTHOPEDIC CLINIC</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Specialized Orthopedic Care & Data Management</p>
            <div className="mt-4 flex justify-between items-end text-left border-t border-slate-100 pt-4">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                <p className="text-lg font-black text-slate-900 uppercase">{record.patient_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Record Date</p>
                <p className="text-sm font-black text-slate-900">{formatDate(recordDate)}</p>
              </div>
            </div>
          </div>

          {/* Clinical Header Section */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 print:hidden">
            <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <ClipboardList size={12} /> Clinical Case Summary
            </h4>
          </div>
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <InfoItem label="Age/Gender" value={`${record.age}y / ${record.gender}`} icon={<User size={12} />} />
            <InfoItem label="Contact" value={record.mobile_number} icon={<Phone size={12} />} />
            <InfoItem label="Occupation" value={record.occupation || '-'} icon={<Briefcase size={12} />} />
            <InfoItem label="Date" value={formatDate(recordDate)} icon={<Calendar size={12} />} />
          </div>

          {/* Address */}
          {record.address && (
            <DataBlock label="Address" value={record.address} icon={<MapPin size={12} />} />
          )}

          {/* Clinical Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataBlock label="Chief Complaint" value={record.chief_complaint} icon={<FileWarning size={12} />} />
            <DataBlock label="Medical History" value={record.medical_history} icon={<HeartPulse size={12} />} />
          </div>

          {/* Treatment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DataBlock label="Diagnosis" value={record.diagnosis} />
            <DataBlock label="Treatment" value={record.treatment} />
            <DataBlock label="Remarks" value={record.remarks} />
          </div>

          {/* Attached Document */}
          {record.document_url && record.document_url !== 'None' && (
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <File size={12} /> Attached Document
              </p>
              <a
                href={record.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-dark-orange shadow-sm">
                    <File size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Clinical Document</p>
                    <p className="text-[9px] font-bold text-slate-400">View Attachment</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-dark-orange transition-all" />
              </a>
            </div>
          )}

          {/* Media Display - Multi-Gallery Support */}
          {mediaUrls.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Camera size={12} /> Diagnostic Media ({mediaUrls.length}/4)
              </p>

              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black relative shadow-inner aspect-video">
                {mediaUrls[activeMediaIndex].includes('video') || mediaUrls[activeMediaIndex].match(/\.(mp4|webm|mov|ogg)$/i) ? (
                  <iframe
                    src={getEmbedViewerUrl(mediaUrls[activeMediaIndex])}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="autoplay"
                    loading="lazy"
                    title={`Media ${activeMediaIndex + 1}`}
                  />
                ) : (
                  <img
                    src={getViewableImageUrl(mediaUrls[activeMediaIndex])}
                    alt="Diagnostic"
                    className="w-full h-full object-contain bg-black"
                    loading="lazy"
                  />
                )}

                <a
                  href={mediaUrls[activeMediaIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur text-white rounded text-[8px] font-black uppercase hover:bg-black/80 transition-all flex items-center gap-1 shadow-lg"
                >
                  <Plus size={8} /> Full View
                </a>
              </div>

              {/* Thumbnails Gallery */}
              {mediaUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {mediaUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeMediaIndex === idx ? 'border-dark-orange scale-105 shadow-md' : 'border-slate-100 opacity-60'
                        }`}
                    >
                      {url.includes('video') || url.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                          <Play size={16} className="text-white fill-white/20" />
                          <div className="absolute bottom-1 right-1 px-1 bg-black/60 rounded text-[6px] font-black text-white uppercase">Video</div>
                        </div>
                      ) : (
                        <img src={getViewableImageUrl(url)} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onEdit} className="flex-[2] py-3.5 bg-navy text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/10">
            <Edit3 size={14} /> Edit Record
          </button>
          <button onClick={() => window.print()} className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all active:scale-[0.98]">
            <Printer size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DataBlock = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1.5 flex items-center gap-1.5 font-display">
      {icon} {label}
    </p>
    <p className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed">
      {value || <span className="text-slate-400 italic">Not documented</span>}
    </p>
  </div>
);

const InfoItem = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
    <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-dark-orange shadow-sm mx-auto mb-1.5">
      {icon}
    </div>
    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-[11px] font-bold text-slate-900 truncate">{value || '-'}</p>
  </div>
);

export default App;
