import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  UserPlus, Camera, Video, Stethoscope, Phone, MapPin,
  CheckCircle2, AlertCircle, X, FileText, Calendar,
  ClipboardList, User, Home, Search, RefreshCw,
  Plus, Eye, RotateCcw, Play, Square, Edit3, Upload, File,
  ChevronRight, ChevronDown, Activity, Database, Users, TrendingUp, Printer,
  Clock, ArrowRight, UserCircle, Briefcase, HeartPulse, FileWarning, PlusCircle, CameraOff
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
  if (!url || String(url) === 'None' || !String(url).startsWith('http')) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  return url;
};

// Helper: Convert Google Drive URL to direct streamable link for <video>
const getStreamableFileUrl = (url) => {
  if (!url || String(url) === 'None' || !String(url).startsWith('http')) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://docs.google.com/uc?id=${id}&export=download`;
  return url;
};

// Helper: Convert Google Drive URL to embedded preview viewer (more reliable for playback)
const getEmbedViewerUrl = (url) => {
  if (!url || String(url) === 'None' || !String(url).startsWith('http')) return null;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
  const id = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return url;
};

// Helper: Get record date field (handles different field names)
const getRecordDate = (record) => {
  if (!record) return null;
  const val = record.entry_date_time || record.date || record.entry_date___time || record.entry_date__time || record.timestamp || record.entry_date_and_time || record.entry_date;
  // Google Sheets may serialize dates as numbers or Date strings
  if (val && typeof val === 'string' && val.trim() === '') return null;
  return val;
};

// Helper: Get patient_id from record (handles different key names)
const getPatientId = (record) => {
  if (!record) return '';
  return record.patient_id || record.id || record.patientid || record.patient_Id || '';
};

// Helper: Get patient name from record
const getPatientName = (record) => {
  if (!record) return '';
  return record.patient_name || record.name || record.full_name || record.patient || '';
};

// Helper: Get mobile from record
const getPatientMobile = (record) => {
  if (!record) return '';
  return record.mobile_number || record.mobile || record.contact || record.phone || '';
};

// Helper: Get service type from record
const getServiceType = (record) => {
  if (!record) return 'OP';
  const val = record.service_type || record.sector || record.service || record.type || record.category || '';
  return String(val).trim().toUpperCase() || 'OP';
};

// Helper: Get complaint from record
const getComplaint = (record) => {
  if (!record) return '';
  return record.chief_complaint || record.complaint || '';
};

/**
 * UTILITY: Compress Image using Canvas
 * Resizes to max 1280px and compresses to 0.7 quality
 */
const compressImage = (base64Str, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str); // Fallback to original if error
  });
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
      // CLEAN DATA: Filter out nulls and empty rows (where name is missing)
      const cleanData = Array.isArray(data)
        ? data.filter(r => r && (r.patient_id || r.patient_name || r.name))
        : [];
      setRecords(cleanData);
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
              <span className="text-[8px] md:text-[10px] font-bold text-orange-400 uppercase tracking-widest opacity-80 hidden sm:block">Healthcare Management</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== 'home' && (
              <button
                onClick={() => setView('home')}
                className="clinical-btn-secondary p-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                title="Home"
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
              showNotification={showNotification}
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
  const [expandedId, setExpandedId] = useState(null);

  const stats = useMemo(() => ({
    today: records.filter(r => isToday(getRecordDate(r))).length,
    op: records.filter(r => getServiceType(r) === 'OP').length,
    ip: records.filter(r => getServiceType(r) === 'IP').length,
    total: records.length
  }), [records]);

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return records.filter(r => {
      const name = getPatientName(r);
      const mobile = String(getPatientMobile(r));
      const id = String(getPatientId(r));
      const complaint = getComplaint(r);
      const matchesSearch = search === '' || (
        name.toLowerCase().includes(search) ||
        mobile.includes(search) ||
        id.toLowerCase().includes(search) ||
        complaint.toLowerCase().includes(search)
      );
      const sector = getServiceType(r);
      const matchesTab = activeTab === 'All' || sector === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [records, searchTerm, activeTab]);

  const toggleExpand = (idx) => setExpandedId(expandedId === idx ? null : idx);

  // Color seed for patient avatar
  const avatarColors = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500'];
  const getAvatarColor = (name) => avatarColors[Math.abs((name || '').charCodeAt(0) - 65) % avatarColors.length];

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-1">
        <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar">
          {['All', 'OP', 'IP'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setExpandedId(null); }}
              className={`pb-3 text-[11px] md:text-sm font-black tracking-wider uppercase transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-dark-orange' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark-orange" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pb-2 md:pb-0">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-9 pr-8 py-2 md:py-2.5 bg-slate-50 md:bg-white border-transparent md:border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-dark-orange transition-all font-medium text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={onRefresh} className="p-2.5 text-slate-400 hover:text-dark-orange transition-all bg-white border border-slate-200 rounded-xl shadow-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Result Count */}
      {searchTerm && (
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sector</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chief Complaint</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.slice(0, 100).map((record, i) => (
                <tr key={getPatientId(record) || i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-700">{formatDate(getRecordDate(record))}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">{formatTime(getRecordDate(record))}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800">{getPatientName(record)}</td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                    {record.age || '-'}/{(record.gender || 'M')[0]}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getServiceType(record) === 'IP' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      {getServiceType(record)}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-[11px] font-medium text-slate-500 italic">
                    {getComplaint(record) ? `"${getComplaint(record)}"` : '-'}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                    {String(getPatientMobile(record) || '-')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onViewRecord(record)} className="p-1.5 hover:bg-white hover:text-dark-orange hover:shadow-sm rounded-lg transition-all" title="View Profile">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onEditRecord(record)} className="p-1.5 hover:bg-white hover:text-amber-600 hover:shadow-sm rounded-lg transition-all" title="Edit Record">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && !loading && (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records</p>
          </div>
        )}
      </div>

      {/* Classic Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records</p>
          </div>
        )}

        {filtered.slice(0, 100).map((record, i) => {
          const pName = getPatientName(record);
          const pType = getServiceType(record);
          const pDate = getRecordDate(record);
          const pAge = record.age || '-';
          const pMobile = getPatientMobile(record);
          const pComplaint = getComplaint(record);

          return (
            <div key={getPatientId(record) || i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative flex items-start justify-between">

              {/* Main Content Area */}
              <div className="flex-1 pr-12 min-w-0">
                {/* Header: Badge & Date */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${pType === 'IP' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                    {pType}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 tracking-wide">
                    {formatDate(pDate)}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-black text-slate-900 text-base tracking-tight mb-1 truncate">
                  {pName || 'Unnamed'}
                </h3>

                {/* Info Line: Age & Phone */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5 truncate">
                  <span>{pAge}y</span>
                  <span className="text-slate-300">•</span>
                  <span>{String(pMobile || '-')}</span>
                </div>

                {/* Complaint Line */}
                <div className="text-[12px] font-medium text-slate-500 italic truncate">
                  {pComplaint ? `"${pComplaint}"` : ' '}
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-center gap-2 w-10">
                <button
                  onClick={() => onViewRecord(record)}
                  className="w-10 h-10 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center rounded-xl text-slate-600 transition-colors"
                >
                  <Eye size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => onEditRecord(record)}
                  className="w-10 h-10 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center rounded-xl text-slate-500 hover:text-dark-orange transition-colors"
                >
                  <Edit3 size={17} strokeWidth={2.5} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-8">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        {records.length} Records • Cloud Sync Active
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-xl md:text-3xl font-black text-slate-900 leading-none">{value}</p>
    </div>
    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-slate-50 ${color} shadow-inner`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: 3 })}
    </div>
  </div>
);

const RegistrationForm = ({ editData, onSuccess, onError, onCancel, showNotification }) => {
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
  const [activeSlot, setActiveSlot] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const [captureMode, setCaptureMode] = useState('photo'); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: getPatientName(editData),
        age: editData.age || '',
        gender: editData.gender || editData.sex || 'Male',
        mobile: String(getPatientMobile(editData) || ''),
        service_type: getServiceType(editData),
        address: editData.address || '',
        occupation: editData.occupation || '',
        chief_complaint: recordValue(getComplaint(editData)),
        medical_history: recordValue(editData.medical_history || editData.history),
        diagnosis: recordValue(editData.diagnosis),
        treatment: recordValue(editData.treatment),
        remarks: recordValue(editData.remarks)
      });
      // Filter out 'None' URLs
      const cleanUrl = (u) => (u && String(u) !== 'None' && String(u).trim() !== '') ? u : null;
      setMediaSlots([
        { base64: null, type: null, name: null, url: cleanUrl(editData.media_url_1) },
        { base64: null, type: null, name: null, url: cleanUrl(editData.media_url_2) },
        { base64: null, type: null, name: null, url: cleanUrl(editData.media_url_3) },
        { base64: null, type: null, name: null, url: cleanUrl(editData.media_url_4) }
      ]);
    }
  }, [editData]);

  const recordValue = (val) => val === 'No entry documented' || !val ? '' : val;

  useEffect(() => {
    // Persistent Camera: Start when form opens, Stop when form closes
    startStream();
    return () => stopStream();
  }, []);

  useEffect(() => {
    // Bulletproof Attachment: Retry every 100ms if the video element is missing but needed
    const attachInterval = setInterval(() => {
      const isEmptySlot = !mediaSlots[activeSlot]?.base64 && !mediaSlots[activeSlot]?.url;
      if (isEmptySlot && stream && videoRef.current) {
        if (videoRef.current.srcObject !== stream) {
          console.log('[STREAM] Attaching to video element...');
          videoRef.current.srcObject = stream;
        }
      }
    }, 100);
    return () => clearInterval(attachInterval);
  }, [activeSlot, mediaSlots, stream]);

  const startStream = async () => {
    // 1. Clear previous errors if this is a fresh start/retry
    showNotification(null);
    stopStream();
    setHasAudio(false);

    // TIERED CONSTRAINTS for maximum resilience
    const constraintTiers = [
      // Tier 1: Video + Audio (Ideal)
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
      // Tier 2: Video Only (Fallback if Mic fails)
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      // Tier 3: Basic Video
      { video: true, audio: false }
    ];

    let lastError = null;
    for (const constraints of constraintTiers) {
      try {
        console.log('[STREAM] Trying:', JSON.stringify(constraints));
        const s = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = s;
        setStream(s);
        setHasAudio(s.getAudioTracks().length > 0);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[STREAM] Tier failed:`, err.name);
        // If it's a permission error for Audio, the loop will try Tier 2 (Video Only) next.
      }
    }

    console.error("[STREAM] All tiers failed:", lastError);
    showNotification('Camera access failed. Please check permissions.', 'error');
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[STREAM] Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    setStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !stream) return;

    // 1. Visual FeedBack: Trigger Flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

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
    if (!stream) return;
    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp8' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/mp4'; // Fallback
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          const updated = [...mediaSlots];
          updated[activeSlot] = {
            base64,
            type: options.mimeType,
            name: `vid_${Date.now()}.${options.mimeType.split('/')[1].split(';')[0]}`,
            url: null
          };
          setMediaSlots(updated);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error('Recording Start Error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus('Preparing...');

    try {
      // 1. Process and Compress Media (Image compression happens here)
      const processedMediaSlots = await Promise.all(mediaSlots.map(async (slot, i) => {
        if (slot.base64 && slot.type.startsWith('image')) {
          setSubmitStatus(`Compressing File ${i + 1}...`);
          const compressed = await compressImage(slot.base64);
          return { ...slot, base64: compressed };
        }
        return slot;
      }));

      setSubmitStatus('Contacting Server...');

      // Resolve patient_id: use existing ID for edits, generate new for new records
      const resolvedId = editData ? getPatientId(editData) : `GRU-${Date.now()}`;
      // Resolve date: keep original date for edits, use current for new records
      const resolvedDate = editData ? (getRecordDate(editData) || new Date().toISOString()) : new Date().toISOString();

      const payload = {
        // Map frontend keys to Code.gs expected keys
        patient_name: formData.name,
        age: formData.age,
        gender: formData.gender,
        mobile_number: formData.mobile,
        service_type: formData.service_type,
        address: formData.address,
        occupation: formData.occupation,
        chief_complaint: formData.chief_complaint,
        medical_history: formData.medical_history,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        remarks: formData.remarks,
        patient_id: resolvedId,
        entry_date_time: resolvedDate,
        enteredBy: 'Practitioner',
        // Send existing URLs
        media_url_1: processedMediaSlots[0].url || 'None',
        media_url_2: processedMediaSlots[1].url || 'None',
        media_url_3: processedMediaSlots[2].url || 'None',
        media_url_4: processedMediaSlots[3].url || 'None',
        // Send new base64 uploads (Only if they are valid data URIs)
        media_1: (processedMediaSlots[0].base64 && String(processedMediaSlots[0].base64).startsWith('data:')) ? processedMediaSlots[0] : null,
        media_2: (processedMediaSlots[1].base64 && String(processedMediaSlots[1].base64).startsWith('data:')) ? processedMediaSlots[1] : null,
        media_3: (processedMediaSlots[2].base64 && String(processedMediaSlots[2].base64).startsWith('data:')) ? processedMediaSlots[2] : null,
        media_4: (processedMediaSlots[3].base64 && String(processedMediaSlots[3].base64).startsWith('data:')) ? processedMediaSlots[3] : null,
        // Send document upload (Code.gs expects 'document')
        document: (documentFile.base64 && String(documentFile.base64).startsWith('data:')) ? documentFile : null,
        document_url: documentFile.url || 'None',
      };

      setSubmitStatus('Finalizing Cloud Sync...');
      console.log('[SUBMIT] patient_id:', resolvedId, 'patient_name:', formData.name, 'edit?', !!editData);

      const res = await submitToGas(payload);
      if (res.success || res.status === 'success') {
        setSubmitStatus('Done!');
        onSuccess(res.message || 'Record saved successfully');
      } else {
        onError(res.error || res.message || 'Server rejected');
      }
    } catch (err) {
      console.error('[SUBMIT ERROR]', err);
      onError('Sync Fail: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
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

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative">
        {/* Submission Progress Overlay */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full space-y-6">
                <div className="relative">
                  <RefreshCw className="w-16 h-16 text-dark-orange animate-spin mx-auto" strokeWidth={3} />
                  <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-navy" size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Syncing Patient File</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{submitStatus || 'Working...'}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 italic">Optimizing & uploading data to cloud...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              const slotMedia = mediaSlots[idx] || { base64: null, url: null };
              const hasMedia = !!(slotMedia.base64 || (slotMedia.url && String(slotMedia.url) !== 'None'));

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
                        <div className="w-full h-full">
                          {slotMedia.type?.startsWith('video') || slotMedia.url?.includes('video') || slotMedia.url?.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                            slotMedia.base64 ? (
                              <video src={slotMedia.base64} className="w-full h-full object-contain" controls onClick={(e) => e.stopPropagation()} />
                            ) : (
                              <iframe src={getEmbedViewerUrl(slotMedia.url)} className="w-full h-full border-0" allow="autoplay" title={`Shot ${idx + 1}`} />
                            )
                          ) : (
                            <img src={slotMedia.base64 || getViewableImageUrl(slotMedia.url)} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...mediaSlots];
                            updated[idx] = { base64: null, type: null, name: null, url: null };
                            setMediaSlots(updated);
                            setActiveSlot(idx);
                            // PERSISTENT: No need to startStream here as it stays alive!
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur shadow-lg text-rose-500 rounded-lg hover:bg-white z-10"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    ) : (
                      isSlotActive ? (
                        <div className="w-full h-full relative group bg-black">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                          {/* Camera Status Overlay */}
                          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                            <div className={`w-2 h-2 rounded-full ${stream ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">
                              {stream ? 'Camera Live' : 'Connecting...'}
                            </span>
                          </div>

                          {/* Visual Flash Effect */}
                          <AnimatePresence>
                            {showFlash && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-20 pointer-events-none"
                              />
                            )}
                          </AnimatePresence>

                          {/* Access Error Recovery Overlay */}
                          {!stream && (
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                              <CameraOff size={40} className="text-slate-600 mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Camera Connection Lost</p>
                              <button
                                type="button"
                                onClick={() => startStream()}
                                className="px-5 py-2.5 bg-white text-navy rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
                              >
                                <RefreshCw size={14} /> Retry Camera
                              </button>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-4 z-10">
                            {/* Mode Switcher */}
                            {!isRecording && (
                              <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20">
                                <button
                                  type="button"
                                  onClick={() => setCaptureMode('photo')}
                                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${captureMode === 'photo' ? 'bg-white text-navy shadow-lg' : 'text-white'}`}
                                >
                                  Photo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCaptureMode('video')}
                                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${captureMode === 'video' ? 'bg-white text-navy shadow-lg' : 'text-white'}`}
                                >
                                  Video
                                </button>
                              </div>
                            )}

                            {/* Capture/Record Button */}
                            {captureMode === 'photo' ? (
                              <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-4 border-white/30">
                                <Camera size={26} className="text-dark-orange" />
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                {isRecording && (
                                  <div className="px-3 py-1 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] animate-pulse flex items-center gap-2 shadow-lg">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    {hasAudio ? 'REC + AUDIO' : 'REC (VIDEO ONLY)'} {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={isRecording ? stopRecording : startRecording}
                                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-4 border-white/30 transition-all ${isRecording ? 'bg-rose-500 scale-110' : 'bg-white'}`}
                                >
                                  {isRecording ? <Square size={24} className="text-white fill-white" /> : <Play size={26} className="text-dark-orange ml-1" />}
                                </button>
                              </div>
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 bg-dark-orange text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              editData ? 'Update Record' : 'Save Record'
            )}
          </button>
        </div>
      </form>
    </motion.div >
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
              {getPatientName(record)?.[0]}
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight">{getPatientName(record)}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getServiceType(record) === 'IP' ? 'bg-dark-orange' : 'bg-slate-700'
                  }`}>{getServiceType(record)}</span>
                <span className="text-[9px] font-bold text-slate-400">{getPatientId(record)}</span>
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
                <p className="text-lg font-black text-slate-900 uppercase">{getPatientName(record)}</p>
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
            <InfoItem label="Age/Gender" value={`${record.age || '-'}y / ${record.gender || record.sex || record.sex_type || 'M'}`} icon={<User size={12} />} />
            <InfoItem label="Contact" value={String(getPatientMobile(record) || '-')} icon={<Phone size={12} />} />
            <InfoItem label="Occupation" value={record.occupation || '-'} icon={<Briefcase size={12} />} />
            <InfoItem label="Date" value={formatDate(recordDate)} icon={<Calendar size={12} />} />
          </div>

          {/* Address */}
          {record.address && (
            <DataBlock label="Address" value={record.address} icon={<MapPin size={12} />} />
          )}

          {/* Clinical Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataBlock label="Chief Complaint" value={getComplaint(record)} icon={<FileWarning size={12} />} />
            <DataBlock label="Medical History" value={record.medical_history || record.history} icon={<HeartPulse size={12} />} />
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
