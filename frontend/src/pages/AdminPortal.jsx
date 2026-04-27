import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import { LayoutDashboard, Settings2, Users, FileBarChart, LogOut, ShieldAlert, ArrowLeft, ShieldCheck, Lock, User, AlertCircle, PlayCircle, StopCircle, RefreshCw, AlertTriangle, Download, Trophy, FileText, Plus, PlusCircle, X, Trash2, Image as ImageIcon, Camera, UploadCloud, FileType, CheckCircle, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import logo from '../assets/logo.png';
import { useNotification } from '../components/NotificationSystem';

// ==========================================
// 1. ADMIN LOGIN
// ==========================================
export const AdminLogin = () => {
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
      const res = await api.post('/admin/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('admin_id', res.data.admin_id);
        navigate('/admin/dashboard');
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to securely authenticate.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-premium-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up-fade">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-[#8A1538] transition-colors"><ArrowLeft size={16} className="mr-2" /> Return to Portal</button>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A1538]/5 to-transparent pointer-events-none"></div>
          <div className="bg-slate-50 border-b border-slate-100 p-8 text-center flex flex-col items-center">
            <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 mb-4 animate-pulse-soft"><ShieldCheck size={32} className="text-[#8A1538]" /></div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Center</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Authorized access for election administrators only</p>
          </div>
          <div className="p-8">
            {error && <div className="mb-6 bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 flex items-start"><AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" /><span className="font-medium">{error}</span></div>}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Administrator ID</label>
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
              <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-[#8A1538] hover:bg-[#6D0F2A] disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
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
// 2. ADMIN LAYOUT
// ==========================================
export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [electionStatus, setElectionStatus] = useState(null); // stores the full status object
  const [headerStats, setHeaderStats] = useState({ voted: 0, total: 0 });

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/admin/login');
    else {
      fetchStatus();
      fetchHeaderStats();
      
      // Auto-refresh status every 5 seconds
      const poll = setInterval(fetchStatus, 5000);
      return () => clearInterval(poll);
    }
  }, [navigate]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/admin/election/status');
      setElectionStatus(res.data);
    } catch (err) { console.error("Failed to fetch status", err); }
  };

  const fetchHeaderStats = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        api.get('/admin/dashboard/votes-count'),
        api.get('/admin/dashboard/students-count')
      ]);
      setHeaderStats({ voted: vRes.data.total_votes, total: sRes.data.total_students });
    } catch (err) { }
  };

  const menuItems = [
    { label: 'Election Control', icon: <Settings2 size={20} />, path: '/admin/control' },
    { label: 'Candidates Engine', icon: <Users size={20} />, path: '/admin/candidates' },
    { label: 'Teacher Management', icon: <GraduationCap size={20} />, path: '/admin/teachers' },
    { label: 'Student Directory', icon: <FileType size={20} />, path: '/admin/students' },
    { label: 'Result Reports', icon: <FileBarChart size={20} />, path: '/admin/results' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col h-auto md:h-screen sticky top-0">
        <Link to="/admin/dashboard" className="p-7 border-b border-slate-100 flex items-center space-x-4 hover:bg-slate-50 transition-colors">
          <img src={logo} alt="Logo" className="h-16 w-auto" onError={(e) => e.target.style.display = 'none'} />
          <div>
            <h2 className="text-[#8A1538] font-black tracking-tight text-2xl leading-tight">DYP-SST</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Admin Base</p>
          </div>
        </Link>
        <nav className="flex-grow p-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === item.path ? 'bg-[#8A1538]/10 text-[#8A1538] border border-[#8A1538]/20 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
              {item.icon} <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-dashboard-hub transition-colors duration-500">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] shrink-0 z-10 relative">
          <div className="flex items-center space-x-6">
            <Link to="/admin/dashboard" className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${location.pathname === '/admin/dashboard' ? 'bg-[#8A1538] text-white shadow-md' : 'bg-red-50 text-[#8A1538] border border-red-100 hover:bg-red-100'}`}>
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </Link>
            {location.pathname !== '/admin/dashboard' && (
              <>
                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {menuItems.find(i => i.path === location.pathname)?.label || 'Election Hub'}
                </h1>
              </>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-4 mr-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Live Turnout</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-700">{headerStats.voted} <span className="text-slate-400 font-medium">/ {headerStats.total}</span></span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-[#8A1538] transition-all duration-1000" style={{ width: `${(headerStats.voted / (headerStats.total || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
              <ShieldAlert size={16} className={electionStatus?.status === 'LIVE' ? "text-emerald-500" : "text-amber-500"} />
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Election: {electionStatus?.status === 'LIVE' ? <span className="text-emerald-600">LIVE</span> : <span className="text-amber-600">OFFLINE</span>}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-[#8A1538] flex items-center justify-center text-white font-black text-xs shadow-sm border border-[#8A1538]">S</div>
                <span className="text-sm font-bold text-slate-700">Admin: Suridhi</span>
              </div>
              <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center space-x-2 px-4 py-1.5 bg-red-50 text-[#8A1538] border border-red-100 rounded-lg font-bold text-sm hover:bg-[#8A1538] hover:text-white transition-all group">
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative scroll-smooth"><Outlet context={{ electionStatus, fetchStatus, fetchHeaderStats }} /></div>
      </main>
    </div>
  );
};

// ==========================================
// 3. DASHBOARD (ANALYTICS HUB)
// ==========================================
export const Dashboard = () => {
  const { fetchHeaderStats } = useOutletContext();
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/dashboard/stats-breakdown');
        setBreakdown(res.data);
        fetchHeaderStats();
      } catch (err) {
        console.error("Failed to fetch breakdown", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const departments = ['AI/DS', 'CSE', 'BCA', 'MCA'];

  // Normalization Helpers to handle legacy/mismatched labels
  const normalizeDept = (d) => {
    if (!d) return '';
    const dept = d.toUpperCase();
    if (dept === 'AIDS' || dept === 'AI/DS') return 'AI/DS';
    return dept;
  };

  const normalizeYear = (y) => {
    const yearMap = { '1': 'FE', '2': 'SE', '3': 'TE', '4': 'BE', 'FE': 'FE', 'SE': 'SE', 'TE': 'TE', 'BE': 'BE' };
    return yearMap[y] || y; // Default to raw if not in map
  };

  const getBranchStats = (targetDept) => {
    return breakdown.filter(item => normalizeDept(item.department) === targetDept);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">Loading Analytics Hub...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Election Overview</h2>
          <p className="text-slate-500 font-medium">Real-time participation metrics across all academic branches.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Registry Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {departments.map((dept) => {
          const stats = getBranchStats(dept);
          const totalInBranch = stats.reduce((acc, s) => acc + Number(s.total_students), 0);
          const votedInBranch = stats.reduce((acc, s) => acc + Number(s.voted_count), 0);
          const turnout = totalInBranch > 0 ? ((votedInBranch / totalInBranch) * 100).toFixed(1) : 0;

          return (
            <div key={dept} className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden flex flex-col group hover:border-[#8A1538]/30 hover:shadow-[0_15px_30px_-5px_rgba(138,21,56,0.08)] transition-all duration-500 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A1538]/[0.02] rounded-full -mr-16 -mt-16 group-hover:bg-[#8A1538]/[0.05] transition-colors duration-500"></div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="p-3.5 rounded-full bg-[#8A1538] shadow-md text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border-2 border-white/20"><GraduationCap size={22} /></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{dept}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Participation</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#8A1538] leading-none">{turnout}%</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Turnout</p>
                </div>
              </div>
              <div className="p-6 flex-1 bg-white relative z-10">
                <div className="space-y-5">
                  {['FE', 'SE', 'TE', 'BE'].map(year => {
                    if ((dept === 'BCA' || dept === 'MCA') && year === 'BE') return null;
                    // Match against normalized year values
                    const yearData = stats.find(s => normalizeYear(s.year) === year) || { total_students: 0, voted_count: 0 };
                    const yearTurnout = yearData.total_students > 0 ? (yearData.voted_count / yearData.total_students) * 100 : 0;

                    return (
                      <div key={year} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold text-slate-700">{year} Class</span>
                          <span className="text-xs font-bold text-slate-500">{yearData.voted_count} / {yearData.total_students} <span className="ml-1 text-[#8A1538]">({yearTurnout.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-[#8A1538]/80 group-hover:bg-[#8A1538] transition-all duration-700" style={{ width: `${yearTurnout}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// ==========================================
// 4. ELECTION CONTROL
// ==========================================
export const ElectionControl = () => {
  const { electionStatus, fetchStatus } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Sync inputs with current data if NOT_STARTED or LIVE
  useEffect(() => {
    if (electionStatus?.start_time && electionStatus?.end_time) {
      // Convert to local datetime-local format
      const start = new Date(electionStatus.start_time);
      const end = new Date(electionStatus.end_time);
      
      const format = (d) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      
      setStartTime(format(start));
      setEndTime(format(end));
    }
  }, [electionStatus]);

  // Helper to sync with "NOW" for Start Now button
  const setStartToNow = () => {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    setStartTime(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleSetSchedule = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/election/set-time', { start_time: startTime, end_time: endTime });
      await fetchStatus();
      showToast('Election schedule activated successfully.', 'success');
    } catch (err) { 
      showToast(err.response?.data?.error || 'Failed to update schedule', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStop = async () => {
    if (!window.confirm("Are you sure you want to STOP the election? Voting will be paused immediately.")) return;
    try {
      setLoading(true);
      await api.post('/admin/election/stop');
      await fetchStatus();
      showToast('Election paused successfully.', 'success');
    } catch (err) { 
      showToast('Failed to pause election', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const handleReset = async () => {
    if (!window.confirm("CRITICAL WARNING: This will ERASE ALL VOTES and clear the schedule. Continue?")) return;
    try { 
      setLoading(true); 
      await api.post('/admin/election/reset'); 
      await fetchStatus(); 
      setStartTime('');
      setEndTime('');
      showToast('System reset complete.', 'success'); 
    } catch (err) { 
      showToast('Reset failed', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const isLive = electionStatus?.status === 'LIVE';
  const isStopped = electionStatus?.status === 'STOPPED';

  return (
    <div className="max-w-5xl space-y-6 mx-auto pb-10">
      <div className="bg-white rounded-xl shadow-premium border border-slate-200 p-8 text-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">MASTER ELECTION CONTROL</h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">Coordinate and govern the campus-wide Election Network</p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Network State */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-premium flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <span className="font-bold text-slate-700 text-lg">Network State</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{electionStatus?.status || 'OFFLINE'}</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <form onSubmit={handleSetSchedule} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8A1538]/10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</label>
                  <input 
                    type="datetime-local" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8A1538]/10" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  {electionStatus?.status !== 'LIVE' && (
                    <button 
                      type="submit" 
                      onClick={() => {
                        if (electionStatus?.status === 'NOT_STARTED') setStartToNow();
                      }}
                      disabled={loading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                      <span>
                        {electionStatus?.status === 'ENDED' ? 'RESTART ELECTION' : 
                         electionStatus?.status === 'NOT_STARTED' ? 'START NOW' : 
                         'START ELECTION'}
                      </span>
                    </button>
                  )}

                  {(electionStatus?.status === 'LIVE' || electionStatus?.status === 'NOT_STARTED') && (
                    <button 
                      type="button"
                      onClick={handleStop}
                      disabled={loading}
                      className="flex-1 bg-[#e65100] hover:bg-[#cc4400] text-white font-black py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm uppercase tracking-wider disabled:opacity-30"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={20} /> : <StopCircle size={20} />}
                      <span>Stop Election</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
            <p className="text-xs text-slate-400 mt-6 text-center font-medium leading-relaxed">
              {electionStatus?.status === 'NOT_STARTED' ? "Voting is scheduled but not started yet." :
               electionStatus?.status === 'LIVE' ? "Voting is currently active." :
               electionStatus?.status === 'STOPPED' ? "Voting is temporarily paused." :
               electionStatus?.status === 'ENDED' ? "Voting has ended." :
               "No election scheduled."}
            </p>
          </div>
        </div>

        {/* Card 2: Danger Zone */}
        <div className="bg-red-50/30 border border-red-200 rounded-xl overflow-hidden shadow-premium flex flex-col">
          <div className="p-6 border-b border-red-100 flex items-center space-x-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="font-bold text-red-700 text-lg">Danger Zone</span>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">
              Permanently erase all current election data and reset the system for a new vote. Use this only if you are starting a new election session.
            </p>
            <div className="space-y-4">
              <button 
                 disabled={loading || isLive} 
                 onClick={handleReset} 
                 className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl border-2 border-red-500 text-red-600 font-bold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:border-slate-200 disabled:text-slate-400"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                <span>Format Election Registry</span>
              </button>
              {(isLive || loading) && (
                <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-widest">
                  Must halt election before wiping data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MANAGE CANDIDATES
// ==========================================
export const ManageCandidates = () => {
  const [posts, setPosts] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [selectedPostId, setSelectedPostId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePostId, setActivePostId] = useState('all');
  const { showToast } = useNotification();

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([api.get('/admin/posts'), api.get('/admin/candidates')]);
      setPosts(p.data);
      setCandidates(c.data);
      if (p.data.length && !selectedPostId) setSelectedPostId(p.data[0].id);
    } catch (err) { console.error("Data fetch error", err); }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/posts/create', { title: newPostTitle });
      setNewPostTitle('');
      fetchData();
    } catch (err) { showToast("Failed to add position", "error"); }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Delete this role and all associated candidates?")) {
      try {
        await api.delete(`/admin/posts/delete/${id}`);
        fetchData();
        showToast("Position deleted successfully.", "success");
      } catch (err) { showToast("Error deleting post", "error"); }
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newCandidateName);
    formData.append('post_id', selectedPostId);
    if (photoFile) formData.append('photo', photoFile);
    try {
      await api.post('/admin/candidates/add', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewCandidateName(''); setPhotoFile(null); setPreviewUrl(null); fetchData();
    } catch (err) { showToast("Failed to register candidate", "error"); }
  };

  const handleDeleteCandidate = async (id) => {
    if (window.confirm("Delete this candidate profile?")) {
      try {
        await api.delete(`/admin/candidates/delete/${id}`);
        fetchData();
        showToast("Candidate removed successfully.", "success");
      } catch (err) { showToast("Error removing candidate", "error"); }
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: REGISTRATION PORTAL (1/3) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <PlusCircle size={18} className="text-[#8A1538]" />
            <span className="font-black text-slate-800 uppercase tracking-tight">Registration Portal</span>
          </div>

          <div className="p-6 space-y-8">
            {/* Position architect */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1: Architect Roles</label>
              <form onSubmit={handleAddPost} className="flex space-x-2">
                <input type="text" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} required className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] transition-all" placeholder="e.g. President" />
                <button type="submit" className="bg-[#8A1538] hover:bg-[#6D0F2A] text-white p-2.5 rounded-lg transition-all shadow-md active:scale-95"><Plus size={20} /></button>
              </form>

              {/* Mini Post List */}
              <div className="flex flex-wrap gap-2 pt-1">
                {posts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => setActivePostId(post.id)}
                    className={`group flex items-center px-3 py-1.5 rounded-md border text-xs font-bold transition-all cursor-pointer ${activePostId == post.id ? 'bg-[#8A1538] text-white border-[#8A1538] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-[#8A1538]/30'}`}
                  >
                    <span>{post.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className={`ml-2 transition-opacity ${activePostId == post.id ? 'text-white/70 hover:text-white' : 'text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100'} flex items-center justify-center`}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* Member Onboarding */}
            <form onSubmit={handleAddCandidate} className="space-y-5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2: Member Onboarding</label>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">Target Role</label>
                  <select value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#8A1538]/20 transition-all bg-white" required>
                    {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    {posts.length === 0 && <option disabled>Create a role first</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">Legal Name</label>
                  <input type="text" value={newCandidateName} onChange={e => setNewCandidateName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#8A1538]/20 transition-all" placeholder="Enter full name" required />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">Official Portrait</label>
                  <div className="relative group overflow-hidden rounded-lg">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center space-x-4 bg-slate-50 group-hover:bg-slate-100 transition-colors relative z-10">
                      {previewUrl ? (
                        <div className="relative">
                          <img src={previewUrl} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md" alt="Preview" />
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                            <CheckCircle size={12} />
                          </div>
                        </div>
                      ) : (
                        <Camera size={20} className="text-slate-400" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                          {photoFile ? 'Portrait Selected' : 'Choose Portrait'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {photoFile ? photoFile.name : 'Click to browse files'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={!selectedPostId || posts.length === 0} className="w-full bg-[#8A1538] hover:bg-[#6D0F2A] disabled:opacity-50 text-white font-black py-3 rounded-lg shadow-lg shadow-[#8A1538]/20 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-xs">
                Register Profile
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT: ACTIVE CANDIDATES CONSOLE (2/3) */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-1 bg-[#8A1538] rounded-full"></div>
              <span className="font-black text-slate-800 uppercase tracking-tight text-xl">Official Candidates</span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Post:</span>
              <select
                value={activePostId}
                onChange={(e) => setActivePostId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#8A1538]/10 transition-all cursor-pointer"
              >
                <option value="all">Display All Roles</option>
                {posts.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f8f9fb] text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Identity</th>
                  <th className="px-8 py-5">Full Name</th>
                  {activePostId === 'all' && <th className="px-8 py-5">Assigned Post</th>}
                  <th className="px-8 py-5 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates
                  .filter(c => activePostId === 'all' || c.post_id == activePostId)
                  .map(cand => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-5">
                        <div className="h-12 w-12 rounded-full bg-white overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center group-hover:border-[#8A1538]/30 transition-all">
                          {cand.photo_url ? <img src={`http://localhost:5000/uploads/candidates/${cand.photo_url}`} className="h-full w-full object-cover" /> : <User size={24} className="text-slate-200" />}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-base">{cand.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Candidate</span>
                        </div>
                      </td>
                      {activePostId === 'all' && (
                        <td className="px-8 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase bg-red-50 text-[#8A1538] border border-red-100">
                            {cand.post_name}
                          </span>
                        </td>
                      )}
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => handleDeleteCandidate(cand.id)} className="text-red-400 hover:text-red-600 bg-transparent hover:bg-red-50 p-2.5 rounded-xl font-bold transition-all opacity-0 group-hover:opacity-100 inline-flex items-center justify-center border border-transparent hover:border-red-100 shadow-sm hover:shadow-md">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <User size={48} className="text-slate-100 mb-2" />
                        <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">Roster is empty</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. MANAGE STUDENTS
// ==========================================
export const ManageStudents = () => {
  const { fetchHeaderStats } = useOutletContext();
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const { showToast } = useNotification();

  const fetchDatasets = async () => {
    try {
      setDatasetsLoading(true);
      const res = await api.get('/admin/students/datasets');
      setDatasets(res.data);
    } catch (err) {
      console.error("Failed to fetch datasets", err);
    } finally {
      setDatasetsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const getYearLabel = (yearNum) => {
    const map = { 1: 'FE', 2: 'SE', 3: 'TE', 4: 'BE', '1': 'FE', '2': 'SE', '3': 'TE', '4': 'BE' };
    return map[yearNum] || yearNum;
  };

  const handleDeleteDataset = async (dept, yr) => {
    if (window.confirm(`Are you sure you want to delete the dataset for ${dept} - ${getYearLabel(yr)}?`)) {
      try {
        await api.delete('/admin/students/delete-dataset', {
          data: { department: dept, year: yr }
        });
        fetchDatasets();
        if (fetchHeaderStats) fetchHeaderStats();
        showToast("Dataset deleted successfully.", "success");
      } catch (err) {
        showToast(err.response?.data?.error || "Failed to delete dataset", "error");
      }
    }
  };

  const departments = [
    { id: 'AI/DS', name: 'Artificial Intelligence and Data Science (AI/DS)', years: 4 },
    { id: 'CSE', name: 'Computer Science and Engineering (CSE)', years: 4 },
    { id: 'BCA', name: 'Bachelor of Computer Applications (BCA)', years: 3 },
    { id: 'MCA', name: 'Master of Computer Applications (MCA)', years: 3 }
  ];

  const yearLabels = [
    { id: 1, name: 'First Year (FE)' },
    { id: 2, name: 'Second Year (SE)' },
    { id: 3, name: 'Third Year (TE)' },
    { id: 4, name: 'Final Year (BE)' }
  ];

  // Logic to determine available years based on selected department
  const selectedDeptObj = departments.find(d => d.id === department);
  const availableYears = selectedDeptObj ? yearLabels.slice(0, selectedDeptObj.years) : [];

  // Reset year if it's no longer available for the new department
  useEffect(() => {
    if (department && !availableYears.some(y => y.id == year)) {
      setYear('');
    }
  }, [department, availableYears]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setUploadStatus('idle');
    } else {
      showToast("Please upload a valid .csv file.", "error");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setUploadStatus('idle');
    }
  };

  const clearSelection = () => {
    setCsvFile(null);
    setUploadStatus('idle');
    setMessage('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    if (!department || !year) {
      showToast("Please select both Department and Academic Year before importing.", "error");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('department', department);
    formData.append('year', year);
    formData.append('file', csvFile);

    try {
      await api.post('/admin/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('success');
      setMessage('Dataset imported successfully');
      setCsvFile(null);
      fetchDatasets();
      if (fetchHeaderStats) fetchHeaderStats();
    } catch (err) {
      setUploadStatus('error');
      setMessage(err.response?.data?.error || "Import failed. Check CSV format.");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-premium border border-slate-200 p-8 text-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Student Directory Import</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto italic font-medium">Securely upload verified student datasets designated by Department and Year.</p>
      </div>

      <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden mb-8">
        <div className="bg-[#f8f9fb] border-b border-slate-100 p-6 font-semibold text-slate-700 flex items-center space-x-2">
          <FileText size={20} className="text-[#8A1538]" />
          <span>Uploaded Datasets</span>
        </div>
        <div className="p-6">
          {datasetsLoading ? (
            <div className="text-center text-slate-500 py-4 font-medium animate-pulse">Loading datasets...</div>
          ) : datasets.length === 0 ? (
            <div className="text-center text-slate-500 py-4 font-medium">No datasets uploaded yet.</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {datasets.map((ds, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 transition-all hover:border-[#8A1538]/30 hover:shadow-sm group">
                  <span className="font-black text-slate-800 tracking-tight text-xs">
                    {getYearLabel(ds.year)} {ds.department}
                  </span>
                  <button
                    onClick={() => handleDeleteDataset(ds.department, ds.year)}
                    className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 hover:border-red-200 shadow-sm cursor-pointer"
                    title="Delete Dataset"
                  >
                    <X size={12} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden">
        <div className="bg-[#f8f9fb] border-b border-slate-100 p-6 font-semibold text-slate-700 flex items-center space-x-2">
          <UploadCloud size={20} className="text-[#8A1538]" />
          <span>CSV Dataset Upload</span>
        </div>
        <div className="p-6">
          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department Segment</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all" required>
                  <option value="" disabled hidden>Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} disabled={!department} className={`w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all ${!department ? 'bg-slate-50 opacity-50 cursor-not-allowed' : ''}`} required>
                  <option value="" disabled hidden>{department ? 'Select Year Segment...' : 'Select Department First...'}</option>
                  {availableYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group/upload relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 min-h-[200px] cursor-pointer ${dragging ? 'border-[#8A1538] bg-[#8A1538]/5' : 'border-slate-300 bg-slate-50/50 hover:border-[#8A1538]/50 hover:bg-[#8A1538]/[0.02]'}`}
            >
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="csv-upload"
                className="absolute inset-0 cursor-pointer z-10"
              ></label>

              {!csvFile ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <UploadCloud size={48} className={`transition-colors ${dragging ? 'text-[#8A1538]' : 'text-slate-400'}`} />
                  <span className="bg-[#8A1538]/10 text-[#8A1538] px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider pointer-events-none group-hover/upload:bg-[#8A1538] group-hover/upload:text-white group-hover/upload:shadow-lg group-hover/upload:shadow-[#8A1538]/25 group-hover/upload:-translate-y-0.5 transition-all duration-300">Choose File</span>
                  <span className="text-sm font-medium text-slate-400">No file chosen</span>
                  <p className="text-xs text-slate-400 font-medium">Must be formatted with ERP IDs as the primary column.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4 relative z-20">
                  <div className="bg-emerald-50 p-3 rounded-full">
                    <CheckCircle size={36} className="text-emerald-500" />
                  </div>
                  <p className="text-lg font-black text-slate-800 tracking-tight">{csvFile.name}</p>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="flex items-center space-x-2 px-4 py-1.5 bg-red-50 text-[#8A1538] border border-red-100 rounded-lg font-bold text-xs hover:bg-[#8A1538] hover:text-white transition-all duration-300 cursor-pointer"
                  >
                    <X size={14} />
                    <span>Clear Selection</span>
                  </button>
                </div>
              )}
            </div>

            {uploadStatus !== 'idle' && (
              <div className={`p-4 rounded-xl text-sm font-bold border flex items-center space-x-3 animate-slide-up-fade ${uploadStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {uploadStatus === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{message}</span>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={!csvFile || isUploading}
                className="w-full max-w-sm bg-[#8A1538] hover:bg-[#6D0F2A] hover:shadow-xl hover:shadow-[#8A1538]/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg text-white font-black py-4 rounded-xl shadow-lg shadow-[#8A1538]/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest text-xs"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Processing Dataset...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    <span>Confirm & Import</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. RESULTS
// ==========================================
export const Results = () => {
  const [results, setResults] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnerFilter, setWinnerFilter] = useState('all');
  const { showToast } = useNotification();




  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [res, winRes] = await Promise.all([api.get('/admin/results'), api.get('/admin/results/winners')]);

        // Group the results by position
        const grouped = res.data.reduce((acc, row) => {
          const { post_name, candidate_name, vote_count } = row;
          if (!acc[post_name]) acc[post_name] = { post_name, candidates: [] };
          acc[post_name].candidates.push({ candidate_name, vote_count });
          return acc;
        }, {});

        setResults(Object.values(grouped));
        setWinners(winRes.data);
      } catch (err) {
        console.error("Failed to load results", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = () => {
    try {
      const token = localStorage.getItem('token');
      // Using window.open with token query param for most robust download behavior
      window.open(`http://localhost:5000/api/admin/results/export?token=${token}`, '_blank');
    } catch (err) {
      showToast("Failed to initiate download.", "error");
    }
  };


  if (loading) return <div className="p-10 text-center text-slate-500">Retrieving official tallies...</div>;
  window.results_debug = results; // debug in console
  return (
    <div className="max-w-5xl space-y-8 mx-auto">

      <div className="bg-white rounded-xl shadow-premium border border-slate-200 p-8 flex flex-col items-center text-center space-y-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Result Reports</h2>
        </div>


        <button
          onClick={handleExport}
          className="bg-[#DDA73B] hover:bg-yellow-600 text-white px-8 py-3.5 font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex items-center space-x-2 w-full md:w-auto"
        >
          <Download size={20} />
          <span>Export Official CSV</span>
        </button>



      </div>

      <div className="bg-[#fff9ea] rounded-xl shadow-sm border-2 border-[#DDA73B]/50 overflow-hidden">
        <div className="p-4 border-b border-[#DDA73B]/30 flex items-center space-x-2">
          <Trophy size={20} className="text-[#DDA73B]" />
          <span className="font-bold text-[#b58320] text-sm uppercase tracking-wider">Projected Winners</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {winners.map(w => (
              <div key={w.post_name} className="bg-white p-5 rounded-lg border border-[#DDA73B]/20 text-center shadow-sm relative overflow-hidden">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{w.post_name}</h3>
                <p className="text-xl font-black text-slate-800 mb-3">{w.winner_name}</p>
                <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">{w.total_votes} Votes</span>
              </div>
            ))}
            {winners.length === 0 && <div className="col-span-full text-center text-[#b58320] font-semibold py-4">Awaiting tabulated data...</div>}
          </div>
        </div>
      </div>


    </div>
  );
};
