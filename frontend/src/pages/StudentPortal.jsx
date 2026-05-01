import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Fingerprint, AlertOctagon, ArrowLeft, Lock, User as UserIcon, CheckCircle2, ShieldCheck, ArrowRight, Stamp, ShieldAlert, Clock } from 'lucide-react';
import api, { ROOT_URL } from '../utils/api';
import logo from '../assets/logo.png';
import { useNotification } from '../components/NotificationSystem';

// ==========================================
// 1. STUDENT LOGIN PORTAL
// ==========================================
export const StudentLogin = () => {
  const [erpId, setErpId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null); // stores { status, message, end_time, start_time }
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/student/election-status');
        setElectionStatus(res.data);
      } catch (err) {
        setElectionStatus({ status: 'ERROR', message: "Voting is currently unavailable. Please try again later." });
      }
    };
    checkStatus();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!erpId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/student/login', { erp_id: erpId });
      sessionStorage.setItem('studentSessionToken', res.data.student.erp_id);
      sessionStorage.setItem('studentName', res.data.student.name);
      sessionStorage.setItem('studentDepartment', res.data.student.department || '');
      sessionStorage.setItem('studentYear', res.data.student.year || '');
      navigate('/student/vote');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication denied.');
    } finally {
      setLoading(false);
    }
  };

  if (electionStatus === null) return <div className="min-h-screen bg-dashboard-hub flex items-center justify-center">Loading network...</div>;
  if (electionStatus.status !== 'LIVE') {
    const isStopped = electionStatus.status === 'STOPPED';
    const isEnded = electionStatus.status === 'ENDED';
    const isNotStarted = electionStatus.status === 'NOT_STARTED';

    return (
      <div className="min-h-screen bg-dashboard-hub flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col items-center p-12 text-center border-t-8 border-slate-800">
          <div className="mb-6 bg-slate-50 p-6 rounded-full border border-slate-100">
            {isStopped ? <ShieldAlert size={64} className="text-amber-500 animate-pulse-soft" /> : 
             isEnded ? <ShieldCheck size={64} className="text-emerald-500" /> :
             isNotStarted ? <Clock size={64} className="text-blue-500 animate-pulse-soft" /> :
             <AlertOctagon size={64} className="text-[#8A1538]" />}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Notice</h2>
          <p className="text-slate-500 font-bold max-w-sm text-lg leading-relaxed">
            {electionStatus.message}
          </p>
          <button onClick={() => navigate('/')} className="mt-8 text-sm font-bold text-[#8A1538] hover:underline">
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-hub flex flex-col items-center justify-center p-4 selection:bg-[#8A1538] selection:text-white">
      <div className="w-full max-w-md animate-slide-up-fade">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center text-sm font-semibold text-slate-500 hover:text-[#8A1538]">
          <ArrowLeft size={16} className="mr-2" /> Return to Portal
        </button>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A1538]/5 to-transparent pointer-events-none"></div>
          <div className="bg-slate-50 border-b border-slate-100 p-8 text-center flex flex-col items-center">
            <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 mb-4 animate-pulse-soft">
              <ShieldCheck size={32} className="text-[#8A1538]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Voting Portal</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Enter Your Correct ERP ID only</p>
          </div>
          <div className="p-8 relative z-10">
            {error && <div className="mb-6 bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200 flex items-start"><AlertOctagon size={16} className="mt-0.5 mr-2 shrink-0" /><span className="font-medium">{error}</span></div>}
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Student ERP ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Fingerprint size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#8A1538]"
                    placeholder="Enter 8-digit ERP ID"
                    value={erpId}
                    onChange={(e) => setErpId(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-md shadow-md text-sm font-bold text-white bg-[#8A1538] hover:bg-[#6D0F2A] disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                {loading ? <span className="flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>Verifying...</span> : 'Begin Voting'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. STUDENT LAYOUT SHELL
// ==========================================
export const StudentLayout = () => {
  const navigate = useNavigate();
  const [electionStatus, setElectionStatus] = useState(null);
  const studentName = sessionStorage.getItem('studentName') || '';
  const studentDept = sessionStorage.getItem('studentDepartment') || '';
  const studentYear = sessionStorage.getItem('studentYear') || '';

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => window.history.pushState(null, null, window.location.href);
    if (!sessionStorage.getItem('studentSessionToken')) navigate('/student/login', { replace: true });
    
    // Fetch status to keep header updated
    const checkStatus = async () => {
      try {
        const res = await api.get('/student/election-status');
        setElectionStatus(res.data);
        if (res.data.status !== 'LIVE') navigate('/student/login'); // fallback if stopped while logged in
      } catch (err) { }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // refresh every 30s
    return () => { window.onpopstate = null; clearInterval(interval); };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dashboard-hub flex flex-col select-none">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-20 shadow-sm relative">
        <div className="flex items-center py-2">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center whitespace-nowrap">
          <span className={`font-bold text-sm tracking-widest uppercase flex items-center ${electionStatus?.status === 'LIVE' ? 'text-emerald-600' : 'text-[#8A1538]'}`}>
            {electionStatus?.status === 'LIVE' ? '"Official Voting" - Have Started' : 
             electionStatus?.status === 'STOPPED' ? '"Official Voting" - Paused' :
             '"Official Voting" - Pending'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {studentName && (
            <div className="hidden md:flex items-center space-x-2 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
              <UserIcon size={14} className="text-[#8A1538]" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">{studentName}</span>
              {studentDept && studentYear && <span className="text-xs text-slate-400 font-medium">| {studentDept} — {studentYear} Year</span>}
            </div>
          )}
          <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Session Encrypted</span>
          </div>
        </div>
      </header>
      <main className="flex-1 relative overflow-auto flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-5xl px-4 relative z-10"><Outlet /></div>
      </main>
    </div>
  );
};

// ==========================================
// 3. VOTE SCREEN
// ==========================================
export const VoteScreen = () => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const erpId = sessionStorage.getItem('studentSessionToken');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/vote-screen');
        const allPosts = res.data.data;

        // Check which posts student already voted on
        const reviewRes = await api.get(`/student/review-votes/${erpId}`);
        const votedPostIds = (reviewRes.data.review || [])
          .filter(r => r.status === 'completed')
          .map(r => r.post_id);

        const remaining = allPosts.filter(p => !votedPostIds.includes(p.post_id));

        if (remaining.length === 0) {
          navigate('/student/review');
          return;
        }
        setPosts(remaining);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Voting is currently unavailable. Please try again later.');
          setTimeout(() => { sessionStorage.clear(); navigate('/student/login'); }, 3000);
        }
      } finally { setLoading(false); }
    };
    fetchPosts();
  }, [navigate, erpId]);

  const handleVoteSubmit = async () => {
    if (!selection) return;
    try {
      setLoading(true);
      const isSkip = selection === 'skip';
      const candidateId = isSkip ? null : selection;
      await api.post('/student/submit-vote', { erp_id: erpId, post_id: posts[currentIndex].post_id, candidate_id: candidateId, skip: isSkip });
      setSelection(null);
      if (currentIndex + 1 < posts.length) setCurrentIndex(currentIndex + 1);
      else navigate('/student/review');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vote.');
    } finally { setLoading(false); }
  };

  const handleNextClick = () => {
    if (currentIndex === 0) {
      if (window.confirm("Reminder: Once you move to the next post, your choice for the current position will be finalized and cannot be changed. Proceed to the next ballot?")) {
        handleVoteSubmit();
      }
    } else {
      handleVoteSubmit();
    }
  };

  const currentPost = posts[currentIndex];
  if (loading && !currentPost) return <div className="text-center text-slate-500 font-bold animate-pulse">Loading secure ballot...</div>;
  if (!currentPost) return <div className="text-center text-slate-500">No ballot data available.</div>;

  return (
    <div className="w-full relative">
      <div className="absolute -top-10 left-0 right-0 flex justify-center space-x-2">
        {posts.map((_, idx) => <div key={idx} className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${idx < currentIndex ? 'bg-[#DDA73B]' : idx === currentIndex ? 'bg-[#8A1538]' : 'bg-slate-200'}`}></div>)}
      </div>
      <div className="bg-white rounded-3xl p-8 lg:p-12 border-t-8 border-[#8A1538] shadow-xl relative overflow-hidden mt-8">
        <div className="relative z-10 text-center mb-10">
          <h4 className="text-[#8A1538] font-bold uppercase tracking-widest text-xs mb-2">Post {currentIndex + 1} of {posts.length}</h4>
          <h2 className="text-3xl text-slate-800 font-bold tracking-tight">{currentPost.post_name}</h2>
          <p className="text-slate-500 font-medium mt-2">Select your representative for this position.</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-center p-4 rounded-xl border border-red-200 font-bold mb-8">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {currentPost.candidates.map((cand) => {
            const isSelected = selection === cand.candidate_id;
            return (
              <button
                key={cand.candidate_id} disabled={loading}
                onClick={() => setSelection(cand.candidate_id)}
                className={`group relative bg-white border-2 rounded-2xl p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isSelected ? 'border-[#8A1538] shadow-md bg-red-50/20' : 'border-slate-200 hover:border-[#8A1538]'}`}
              >
                <div className="absolute inset-0 bg-[#8A1538] opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl pointer-events-none"></div>

                <div className={`absolute top-4 right-4 transition-all transform bg-white rounded-full shadow-sm ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'}`}>
                  <CheckCircle2 size={28} className="text-[#8A1538]" />
                </div>

                <div className={`h-40 w-40 mx-auto rounded-full border mb-4 overflow-hidden flex shrink-0 items-center justify-center transition-all ${isSelected ? 'bg-white border-[#8A1538] border-4' : 'bg-slate-100 border-slate-200 group-hover:border-[#8A1538] group-hover:border-4'}`}>
                  {cand.photo_url ? <img src={`${ROOT_URL}/uploads/candidates/${cand.photo_url}`} className="h-full w-full object-cover" /> : <UserIcon size={56} className="text-slate-400 group-hover:text-[#8A1538]" />}
                </div>

                <h3 className={`text-xl font-bold tracking-tight transition-colors ${isSelected ? 'text-[#8A1538]' : 'text-slate-800 group-hover:text-[#8A1538]'}`}>{cand.candidate_name}</h3>
              </button>
            )
          })}
        </div>
        <div className="flex justify-center border-t border-slate-100 pt-8 relative z-10 space-x-4">
          <button disabled={loading} onClick={() => setSelection('skip')} className={`flex items-center space-x-2 px-6 py-2.5 border rounded-lg font-bold text-sm tracking-wider uppercase transition-all shadow-sm ${selection === 'skip' ? 'bg-[#8A1538] text-white border-[#8A1538] ring-2 ring-[#8A1538]/30' : 'bg-red-50 text-[#8A1538] border-red-100 hover:bg-[#8A1538] hover:text-white'}`}>
            <span>Skip This Position</span>
          </button>
          {selection && (
            <button disabled={loading} onClick={handleNextClick} className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold text-sm tracking-wider uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. REVIEW VOTES
// ==========================================
export const ReviewVotes = () => {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();
  const erpId = sessionStorage.getItem('studentSessionToken');

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await api.get(`/student/review-votes/${erpId}`);
        setReviewData(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (erpId) fetchReview();
  }, [erpId]);

  const handleFinalize = async () => {
    try {
      setLoading(true);
      await api.post('/student/finish-voting', { erp_id: erpId });
      setFinished(true);
      setTimeout(() => { sessionStorage.clear(); navigate('/'); }, 5000);
    } catch (err) {
      // If already finalized, treat as success
      if (err.response?.data?.message === 'Voting already completed') {
        setFinished(true);
        setTimeout(() => { sessionStorage.clear(); navigate('/'); }, 5000);
      } else {
        setLoading(false);
      }
    }
  };

  if (loading) return <div className="text-center text-slate-500 font-bold animate-pulse">Processing...</div>;

  if (finished) return (
    <div className="bg-white rounded-3xl p-12 max-w-2xl mx-auto border-t-8 border-emerald-600 shadow-xl text-center">
      <ShieldCheck size={80} className="text-emerald-600 mx-auto mb-6" />
      <h1 className="text-4xl font-black text-slate-800 mb-4">Ballot Cast Successfully</h1>
      <p className="text-emerald-700 font-medium text-lg mb-8">Your vote has been securely encrypted in the institutional ledger.</p>
      <div className="w-full bg-slate-100 h-1 flex rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full animate-[progress_5s_linear] w-[100%] transition-all"></div>
      </div>
      <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Terminal restarting...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="rounded-3xl p-8 lg:p-12 border-t-8 border-[#8A1538] shadow-xl relative overflow-hidden" style={{background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#8A1538]/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#8A1538]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4 border border-slate-100 animate-pulse-soft"><Stamp size={32} className="text-[#8A1538]" /></div>
          <h2 className="text-2xl text-slate-800 font-bold tracking-tight">Review Your Votes</h2>
        </div>
        <div className="relative z-10 bg-white rounded-2xl border border-slate-200 overflow-hidden mb-10 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#8A1538] text-white">
              <tr>
                <th className="p-4 font-bold uppercase text-xs">Position</th>
                <th className="p-4 font-bold uppercase text-xs">Choice Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {reviewData?.review?.map((vote, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-700">{vote.post_name}</td>
                  <td className="p-4">
                    {vote.status === "pending" ? <span className="text-slate-400 uppercase font-bold tracking-widest text-xs bg-slate-100 px-2 py-1 rounded">Skipped</span> : <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded uppercase text-xs tracking-widest">Vote Registered</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={handleFinalize} className="relative z-10 w-full bg-[#8A1538] hover:bg-[#6D0F2A] text-white p-4 rounded-xl font-bold tracking-wider uppercase transition-colors text-center shadow-sm">
          <span className="inline-flex items-center justify-center space-x-2"><span>Final Submission</span><ArrowRight size={20} /></span>
        </button>
      </div>
    </div>
  );
};
