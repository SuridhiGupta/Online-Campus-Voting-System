import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldAlert, ArrowLeft, ShieldCheck, Lock, User, AlertCircle, FileText, Download, Users, CheckCircle, X } from 'lucide-react';
import api from '../utils/api';
import logo from '../assets/logo.png';
import { useNotification } from '../components/NotificationSystem';

// ==========================================
// 1. TEACHER LOGIN
// ==========================================
export const TeacherLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return setError('Both fields are required.');
    try {
      setLoading(true);
      const res = await api.post('/teacher/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('teacher_token', res.data.token);
        localStorage.setItem('teacher_id', res.data.teacher_id);
        navigate('/teacher/dashboard');
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to securely authenticate.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dashboard-hub flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up-fade">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-[#8A1538]"><ArrowLeft size={16} className="mr-2" /> Return to Portal</button>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A1538]/5 to-transparent pointer-events-none"></div>
          <div className="bg-slate-50 border-b border-slate-100 p-8 text-center flex flex-col items-center">
            <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 mb-4 animate-pulse-soft"><ShieldCheck size={32} className="text-[#8A1538]" /></div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Portal</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Departmental Access</p>
          </div>
          <div className="p-8">
            {error && <div className="mb-6 bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 flex items-start"><AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" /><span className="font-medium">{error}</span></div>}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-slate-400" /></div>
                  <input type="text" className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#8A1538]" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-slate-400" /></div>
                  <input type="password" className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#8A1538]" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-md shadow-md text-sm font-bold text-white bg-[#8A1538] hover:bg-[#6D0F2A] disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                {loading ? 'Authenticating...' : 'Authorize Login'}
              </button>
            </form>
          </div>
          <div className="bg-white border-t border-slate-100 p-6 flex flex-col items-center justify-center">
            <img src={logo} className="h-12 opacity-60 mb-2 mix-blend-multiply" onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. TEACHER LAYOUT
// ==========================================
export const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [electionStatus, setElectionStatus] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);

  const yearMap = { '1': 'FE', '2': 'SE', '3': 'TE', '4': 'BE' };
  const deptMap = { 'AI/DS': 'AIDS' };

  useEffect(() => {
    if (!localStorage.getItem('teacher_token')) { navigate('/teacher/login'); return; }

    // Add token to interceptor
    api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('teacher_token')}`;

    fetchStatus();
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/teacher/profile');
      setTeacherProfile(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/teacher/login');
      }
      console.error("Failed to fetch teacher profile", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await api.get('/teacher/election-status');
      setElectionStatus(res.data.is_active);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate('/teacher/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-hub flex flex-col">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 md:px-8 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] shrink-0 z-10 relative">
          <div className="flex items-center space-x-6 md:space-x-8">
            <Link to="/teacher/dashboard" className="flex items-center space-x-3 group">
              <img src={logo} alt="Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" onError={(e) => e.target.style.display = 'none'} />
              <div>
                <h2 className="text-[#8A1538] font-black tracking-tight text-xl leading-none">DYP-SST</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 leading-none">Faculty Base</p>
              </div>
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center space-x-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all bg-[#8A1538] text-white shadow-md">
              <LayoutDashboard size={16} />
              <span>Class Overview</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="hidden md:flex items-center space-x-3 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
              <ShieldAlert size={16} className={electionStatus ? "text-emerald-500" : "text-amber-500"} />
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">ELECTION: {electionStatus ? <span className="text-emerald-600">LIVE</span> : <span className="text-amber-600">OFFLINE</span>}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
                <div className="h-6 w-6 rounded-full bg-[#8A1538] flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                  {teacherProfile?.username?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 leading-none">
                    {teacherProfile?.username || 'Faculty Member'}
                  </span>
                  {teacherProfile?.department && (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {deptMap[teacherProfile.department] || teacherProfile.department} — {yearMap[teacherProfile.year] || teacherProfile.year}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => { localStorage.removeItem('teacher_token'); localStorage.removeItem('teacher_id'); navigate('/'); }} className="flex items-center space-x-2 px-4 py-1.5 bg-red-50 text-[#8A1538] border border-red-100 rounded-lg font-bold text-sm hover:bg-[#8A1538] hover:text-white transition-all group">
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative scroll-smooth"><Outlet context={{ electionStatus, fetchStatus }} /></div>
      </main>
    </div>
  );
};

// ==========================================
// 3. DASHBOARD
// ==========================================
export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { electionStatus } = useOutletContext();
  const [stats, setStats] = useState({ total_students: 0, total_votes: 0, turnout_percentage: 0 });
  const [profile, setProfile] = useState({ department: '', year: '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  const yearMap = { '1': 'FE', '2': 'SE', '3': 'TE', '4': 'BE' };
  const deptMap = { 'AI/DS': 'AIDS', 'CSE': 'CSE', 'BCA': 'BCA', 'MCA': 'MCA' };

  useEffect(() => {
    fetchTeacherData();
  }, [electionStatus]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes] = await Promise.all([
        api.get('/teacher/dashboard/stats'),
        api.get('/teacher/students')
      ]);
      setStats(statsRes.data);
      setProfile({ department: statsRes.data.department, year: statsRes.data.year });
      setStudents(studentsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/teacher/login');
      }
      console.error("Dashboard Fetch Error:", err);
      if (err.response?.status === 404) {
        setProfile({ department: null, year: null });
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Students in Class", value: stats.total_students, icon: <Users size={28} className="text-blue-500" />, bg: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
    { title: "Class Ballots Cast", value: stats.total_votes, icon: <CheckCircle className="text-[#8A1538]" />, bg: "bg-[#8A1538]/5 border-[#8A1538]/20", textColor: "text-[#8A1538]" },
    { title: "Class Turnout", value: `${stats.turnout_percentage}%`, icon: <LayoutDashboard className="text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-700" }
  ];

  const downloadReport = async (endpoint, filename) => {
    try {
      const token = localStorage.getItem('teacher_token');
      const res = await api.get(endpoint, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast("Failed to download file.", "error");
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Synchronizing Class Data...</div>;

  if (profile.department === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up-fade">
        <div className="bg-amber-50 p-6 rounded-full border border-amber-100 mb-6">
          <AlertCircle size={64} className="text-amber-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">No Class Assigned</h2>
        <p className="text-slate-500 mt-2 max-w-sm font-medium italic">Your faculty profile has not been assigned a specific class by the administrator yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Metrics Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            {deptMap[profile.department] || profile.department} (YEAR {profile.year})
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Live metrics strictly for your assigned department and year.</p>
        </div>
        {parseInt(stats.total_students) === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center animate-slide-up-fade">
            <div className="bg-amber-50 p-5 rounded-full border border-amber-100 mb-6">
              <ShieldAlert size={48} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Dataset Uploaded Yet</h3>
            <p className="text-slate-500 mt-2 max-w-md font-medium italic">Your assigned class mapping is active, but the administrator hasn't uploaded the student roll for this department and year yet.</p>
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3 text-slate-400">
              <Lock size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Controls Temporarily Disabled</span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statCards.map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-premium p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${card.bg} opacity-50 transition-transform group-hover:scale-125`}></div>
                  <div className="relative z-10 flex items-center justify-between mb-4"><div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 ${card.textColor}`}>{card.icon}</div></div>
                  <div className="relative z-10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</h3>
                    <span className="text-4xl font-black text-slate-800">{card.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Reports Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 items-stretch">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-premium flex flex-col">
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center space-x-2">
                  <h3 className="font-semibold text-slate-700 text-base">Completed Voters</h3>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Download a detailed CSV record of all students in your assigned class who have securely voted in election.</p>
                  <button onClick={() => downloadReport('/teacher/students/voted/export', 'voted_students.csv')} className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-sm transition-all shadow-sm">
                    <Download size={18} />
                    <span>Download Voted Roll</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-premium flex flex-col">
                <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center space-x-2">
                  <h3 className="font-semibold text-slate-700 text-base">Pending Voters</h3>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Download a detailed CSV record of all students in your assigned class who still needs to vote.</p>
                  <button onClick={() => downloadReport('/teacher/students/pending/export', 'pending_students.csv')} className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl border border-amber-500 bg-amber-50 text-amber-600 hover:bg-amber-700 hover:text-white font-bold text-sm transition-all shadow-sm">
                    <Download size={18} />
                    <span>Download Pending Roll</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


