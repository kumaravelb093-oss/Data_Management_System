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
  Activity
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
      { entry_date_timestamp: new Date().toISOString(), patient_name: 'Kumaravel', age: 30, diagnosis: 'Fracture', image_drive_link: '#' },
      { entry_date_timestamp: new Date().toISOString(), patient_name: 'Siva', age: 45, diagnosis: 'Knee Pain', image_drive_link: '#' }
    ]), 1000);
  })
};

const App = () => {
  const [view, setView] = useState('register');
  const [records, setRecords] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (view === 'dashboard') {
      loadRecords();
    }
  }, [view]);

  const loadRecords = async () => {
    try {
      if (window.google) {
        google.script.run.withSuccessHandler(setRecords).getRecords();
      } else {
        const data = await gas.getRecords();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <nav className="w-64 bg-[#1A2B3C] text-white p-6 flex flex-col gap-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Guru Ortho</h1>
        </div>

        <div className="flex flex-col gap-2">
          <SidebarItem
            icon={<UserPlus size={20} />}
            label="Registration"
            active={view === 'register'}
            onClick={() => setView('register')}
          />
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
        </div>

        <div className="mt-auto p-4 bg-white/5 rounded-xl text-xs border border-white/10">
          <p className="opacity-60 mb-1">Powered by</p>
          <p className="font-semibold">Sheets & Drive Backend</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {view === 'register' ? (
            <RegistrationForm
              key="reg"
              onSuccess={() => {
                showNotification('Patient Record Saved!');
                setView('dashboard');
              }}
              onError={(err) => showNotification(err, 'error')}
            />
          ) : (
            <Dashboard
              key="dash"
              records={records}
              onRefresh={loadRecords}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-3 text-white ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
          >
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-medium">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-white/10'
      }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const RegistrationForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    village: '',
    taluk: '',
    district: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'New',
    doctorName: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    remarks: '',
    enteredBy: ''
  });
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      onError('Unable to access camera');
      setIsCapturing(false);
    }
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 400, 300);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    setImage({ base64, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' });
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, image };
      if (window.google) {
        google.script.run
          .withSuccessHandler((res) => {
            if (res.success) onSuccess();
            else onError(res.message);
            setLoading(false);
          })
          .saveData(payload);
      } else {
        const res = await gas.saveData(payload);
        if (res.success) onSuccess();
        setLoading(false);
      }
    } catch (err) {
      onError('Submission failed');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-5xl mx-auto pb-12"
    >
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-[#1A2B3C]">Patient Registration</h2>
        <p className="text-gray-500 mt-1">Complete the clinic record for the current visit.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Patient Basics */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b pb-2">
              <User size={18} /> Basic Details
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
              <input required className="input-field mt-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Age</label>
                <input type="number" className="input-field mt-1" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                <select className="input-field mt-1" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
              <input className="input-field mt-1" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
            </div>
          </section>

          <section className="card space-y-4">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b pb-2">
              <MapPin size={18} /> Address Details
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Village</label>
              <input className="input-field mt-1" value={formData.village} onChange={e => setFormData({ ...formData, village: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Taluk</label>
              <input className="input-field mt-1" value={formData.taluk} onChange={e => setFormData({ ...formData, taluk: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">District</label>
              <input className="input-field mt-1" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
            </div>
          </section>
        </div>

        {/* Column 2: Visit & Medical */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b pb-2">
              <Calendar size={18} /> Visit Details
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Visit Date</label>
              <input type="date" className="input-field mt-1" value={formData.visitDate} onChange={e => setFormData({ ...formData, visitDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Visit Type</label>
              <select className="input-field mt-1" value={formData.visitType} onChange={e => setFormData({ ...formData, visitType: e.target.value })}>
                <option>New</option>
                <option>Review/Follow-up</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Doctor Name</label>
              <input className="input-field mt-1" value={formData.doctorName} onChange={e => setFormData({ ...formData, doctorName: e.target.value })} />
            </div>
          </section>

          <section className="card space-y-4">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b pb-2">
              <ClipboardList size={18} /> Medical Details
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Diagnosis (டியாமோசிஸ்)</label>
              <textarea className="input-field mt-1" rows={2} value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Treatment / Procedure</label>
              <textarea className="input-field mt-1" rows={2} value={formData.treatment} onChange={e => setFormData({ ...formData, treatment: e.target.value })} />
            </div>
          </section>
        </div>

        {/* Column 3: Imaging & Submit */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b pb-2">
              <Camera size={18} /> X-Ray / Wound Image
            </h3>
            <div className="aspect-video relative overflow-hidden rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              {isCapturing ? (
                <div className="w-full h-full relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4">
                    <button type="button" onClick={takePhoto} className="btn btn-primary rounded-full p-3"><Camera size={20} /></button>
                    <button type="button" onClick={stopCamera} className="bg-red-500 text-white rounded-full p-3"><X size={20} /></button>
                  </div>
                </div>
              ) : image ? (
                <div className="w-full h-full relative">
                  <img src={image.base64} className="w-full h-full object-cover" alt="Patient Capture" />
                  <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={startCamera} className="flex flex-col items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors">
                  <Camera size={40} />
                  <span className="text-sm font-medium">Open Camera</span>
                </button>
              )}
            </div>
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />
          </section>

          <section className="card space-y-4 bg-emerald-50/30 border-emerald-100 border">
            <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b border-emerald-100 pb-2">
              <Activity size={18} /> Finalize Entry
            </h3>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Prescription Notes</label>
              <textarea className="input-field mt-1" rows={2} value={formData.prescription} onChange={e => setFormData({ ...formData, prescription: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Data Entered By</label>
              <input className="input-field mt-1" placeholder="Staff/Doctor Name" value={formData.enteredBy} onChange={e => setFormData({ ...formData, enteredBy: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-4 text-lg justify-center shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Saving Record...' : 'Submit to System'}
            </button>
          </section>
        </div>
      </form>
    </motion.div>
  );
};

const Dashboard = ({ records, onRefresh }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto"
    >
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[#1A2B3C]">Clinical Dashboard</h2>
          <p className="text-gray-500">Live feed from Google Sheets</p>
        </div>
        <button onClick={onRefresh} className="btn bg-white border border-gray-200 text-gray-700">
          <Activity size={18} className="text-emerald-500" /> Sync Latest
        </button>
      </header>

      <div className="card p-0 overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A2B3C] text-white">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold">Patient Information</th>
                <th className="px-6 py-4 text-sm font-semibold">Diagnosis & Treatment</th>
                <th className="px-6 py-4 text-sm font-semibold">Visit Details</th>
                <th className="px-6 py-4 text-sm font-semibold">Reports</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {records.length > 0 ? records.map((record, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{record.patient_name}</div>
                    <div className="text-xs text-gray-500">{record.age}y / {record.gender} | {record.mobile_number}</div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-1">{record.village}, {record.taluk}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium line-clamp-1">{record.diagnosis || 'No Diagnosis'}</div>
                    <div className="text-[11px] text-gray-400 line-clamp-1 mt-1">{record.treatment_procedure}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{record.visit_type}</div>
                    <div className="text-xs text-gray-400 mt-1">By {record.doctor_name || 'Staff'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {record.image_drive_link && record.image_drive_link !== '#' ? (
                      <a
                        href={record.image_drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn bg-emerald-50 text-emerald-700 text-xs py-2 px-3 hover:bg-emerald-100"
                      >
                        <FileText size={14} /> Open Image
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">No Uploads</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="opacity-10 mb-4 flex justify-center"><ClipboardList size={64} /></div>
                    <p className="text-gray-400">Syncing with Google Sheets...</p>
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
