import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import { AdminLogin, AdminLayout, Dashboard, ElectionControl, ManageCandidates, ManageStudents, Results, TeacherManagement, ManageDevices } from './pages/AdminPortal';
import { StudentLogin, StudentLayout, VoteScreen, ReviewVotes } from './pages/StudentPortal';
import { TeacherLogin, TeacherLayout, TeacherDashboard } from './pages/TeacherPortal';

import { NotificationProvider, useNotification } from './components/NotificationSystem';

import api, { deviceId } from './utils/api';
import { ShieldAlert, Monitor, CheckCircle, RefreshCw, Users, Settings2, GraduationCap, FileType, FileBarChart, Lock } from 'lucide-react';

export const DeviceRoleContext = React.createContext(null);

const SecurityGate = ({ children }) => {
  const [status, setStatus] = React.useState('checking'); 
  const [role, setRole] = React.useState(null);
  const [displayId, setDisplayId] = React.useState(null);
  const [lockdownError, setLockdownError] = React.useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const checkAuth = React.useCallback(async () => {
    try {
      const res = await api.get('/devices/status');
      if (res.data.approved) {
        setStatus('approved');
        setRole(res.data.role);
        setDisplayId(res.data.device_no);
      } else {
        const regRes = await api.post('/devices/register', { 
          deviceId, 
          deviceName: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Unknown Device' 
        });
        setStatus('unauthorized');
        setDisplayId(res.data.device_no || regRes.data.device_no || res.data.deviceNo || regRes.data.deviceNo);
        setLockdownError(null);
      }
    } catch (err) { 
      if (err.response?.status === 403) {
        setLockdownError(err.response.data.error || "Election is Live. Network is locked.");
      }
      setStatus('unauthorized'); 
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
    let interval;
    if (status !== 'approved') {
      interval = setInterval(checkAuth, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [checkAuth, status]);
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <RefreshCw className="mx-auto mb-4 text-slate-400 animate-spin" size={40} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Initializing Security...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-t-8 border-[#8A1538] p-10 text-center">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            {lockdownError ? <Lock size={40} className="text-[#8A1538]" /> : <ShieldAlert size={40} className="text-[#8A1538]" />}
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {lockdownError ? "NETWORK LOCKED" : "NETWORK ACCESS PENDING"}
          </h1>
          <div className={`mb-8 ${lockdownError ? "bg-red-50 p-4 rounded-xl border border-red-100" : ""}`}>
            <p className={`text-sm leading-relaxed ${lockdownError ? "text-red-600 font-semibold" : "text-slate-500 font-medium"}`}>
              {lockdownError || "This PC needs admin approval to join the network."}
            </p>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Assign ID</label>
              <div className="font-mono text-lg bg-white p-3 rounded-lg border border-slate-200 text-[#8A1538] font-black flex items-center justify-center">
                DEVICE {displayId || '?'}
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white border border-slate-200 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Check Approval Status</span>
            </button>
          </div>
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Institutional Security Grid v2.0</p>
        </div>
      </div>
    );
  }

  return (
    <DeviceRoleContext.Provider value={role}>
      {children}
    </DeviceRoleContext.Provider>
  );
};

function App() {
  return (
    <NotificationProvider>
      <Router>
        <SecurityGate>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* Admin Flow */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="control" element={<ElectionControl />} />
              <Route path="candidates" element={<ManageCandidates />} />
              <Route path="teachers" element={<TeacherManagement />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="results" element={<Results />} />
              <Route path="devices" element={<ManageDevices />} />
            </Route>

            {/* Student Flow Portal */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student" element={<StudentLayout />}>
              <Route path="vote" element={<VoteScreen />} />
              <Route path="review" element={<ReviewVotes />} />
            </Route>

            {/* Faculty Flow */}
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
        </SecurityGate>
      </Router>
    </NotificationProvider>
  );
}

export default App;
