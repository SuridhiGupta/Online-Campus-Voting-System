import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, X, CheckCircle, Trash2, AlertCircle, Download, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import { useNotification } from '../components/NotificationSystem';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ teacher_id: '', department: '', year: '' });
  const [createForm, setCreateForm] = useState({ username: '', password: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

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

  const getYearLabel = (yearNum) => {
    const map = { 1: 'FE', 2: 'SE', 3: 'TE', 4: 'BE', '1': 'FE', '2': 'SE', '3': 'TE', '4': 'BE' };
    return map[yearNum] || yearNum;
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/teacher-assignments')
      ]);
      setTeachers(tRes.data);
      setAssignments(aRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignForm.teacher_id || !assignForm.department || !assignForm.year) {
      showToast("Please select Teacher, Department and Year.", "error");
      return;
    }
    try {
      setIsAssigning(true);
      await api.post('/admin/assign-teacher', assignForm);
      const aRes = await api.get('/admin/teacher-assignments');
      setAssignments(aRes.data);
      setAssignForm({ teacher_id: '', department: '', year: '' });
      showToast("Teacher class assigned successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Assignment failed.", "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.password) return;
    try {
      setIsCreating(true);
      await api.post('/admin/create-teacher', createForm);
      fetchData();
      setCreateForm({ username: '', password: '' });
      showToast("Teacher account created successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Creation failed.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const downloadAssignments = async () => {
    try {
      const res = await api.get('/admin/export-teacher-assignments', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'teacher_assignments.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) { showToast("Download failed", "error"); }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("CRITICAL: This will PERMANENTLY delete the teacher's account and all their class mappings. Continue?")) {
      try {
        await api.delete(`/admin/delete-teacher/${teacherId}`);
        fetchData();
        showToast("Teacher account deleted successfully.", "success");
      } catch (err) {
        showToast(err.response?.data?.error || "Failed to delete teacher", "error");
      }
    }
  };

  // Logic to determine available years based on selected department in the form
  const selectedDeptObjForForm = departments.find(d => d.id === assignForm.department);
  const availableYears = selectedDeptObjForForm ? yearLabels.slice(0, selectedDeptObjForForm.years) : [];

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold animate-pulse uppercase tracking-widest">Initializing Management Base...</div>;

  return (
    <div className="relative space-y-8 max-w-5xl mx-auto pb-12 animate-slide-up-fade">

      <div className="bg-white rounded-xl shadow-premium border border-slate-200 p-8 text-center">

        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Teacher Management</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto italic font-medium">Configure faculty authorizations and class assignments with strict 1-to-1 mapping.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* CARD 0: CREATE TEACHER ACCOUNT */}
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden">
          <div className="bg-[#f8f9fb] border-b border-slate-100 p-6 font-semibold text-slate-700 flex items-center space-x-2">
            <Users size={20} className="text-[#8A1538]" />
            <span>Create Teacher Account</span>
          </div>
          <div className="p-8">
            <form onSubmit={handleCreateTeacher} className="max-w-3xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    type="text" 
                    value={createForm.username}
                    onChange={e => setCreateForm({...createForm, username: e.target.value})}
                    placeholder="Enter teacher username"
                    className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    value={createForm.password}
                    onChange={e => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="Set manual password"
                    className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full max-w-sm bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest text-xs"
                >
                  <span>{isCreating ? "Creating..." : "Create Teacher Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* CARD 1: ASSIGN TEACHER CLASS */}
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden">
          <div className="bg-[#f8f9fb] border-b border-slate-100 p-6 font-semibold text-slate-700 flex items-center space-x-2">
            <GraduationCap size={20} className="text-[#8A1538]" />
            <span>Assign Teacher Class</span>
          </div>
          <div className="p-8">
            <form onSubmit={handleAssignTeacher} className="max-w-3xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Teacher</label>
                  <select 
                    value={assignForm.teacher_id} 
                    onChange={e => setAssignForm({...assignForm, teacher_id: e.target.value})}
                    className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all" 
                    required
                  >
                    <option value="" disabled hidden>Select Teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                  <select 
                    value={assignForm.department} 
                    onChange={e => setAssignForm({...assignForm, department: e.target.value})}
                    className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all" 
                    required
                  >
                    <option value="" disabled hidden>Select Department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                  <select 
                    value={assignForm.year} 
                    onChange={e => setAssignForm({...assignForm, year: e.target.value})}
                    disabled={!assignForm.department}
                    className={`w-full border border-slate-300 p-2.5 rounded-md outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-sm transition-all ${!assignForm.department ? 'bg-slate-50 opacity-50 cursor-not-allowed' : ''}`}
                    required
                  >
                    <option value="" disabled hidden>{assignForm.department ? 'Select Year...' : 'Select Dept First...'}</option>
                    {availableYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button 
                  type="submit" 
                  disabled={isAssigning}
                  className="w-full max-w-sm bg-[#8A1538] hover:bg-[#6D0F2A] text-white font-black py-4 rounded-xl shadow-lg shadow-[#8A1538]/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest text-xs"
                >
                  <CheckCircle size={18} />
                  <span>{isAssigning ? "Assigning..." : "Confirm Assignment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* CARD 2: CURRENT ASSIGNMENTS */}
        <div className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden">
          <div className="bg-[#f8f9fb] border-b border-slate-100 p-6 font-semibold text-slate-700 flex items-center space-x-2">
            <Users size={20} className="text-[#8A1538]" />
            <span>Active Assignments Registry</span>
          </div>
          <div className="flex justify-end px-8 pt-4">
            <button onClick={downloadAssignments} className="flex items-center space-x-2 text-xs font-bold text-[#8A1538] hover:bg-[#8A1538]/5 px-4 py-2 rounded-lg border border-[#8A1538]/20 transition-all">
              <Download size={14} />
              <span>Export Assignments</span>
            </button>
          </div>
          <div className="p-8">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium italic">No active teacher assignments detected in the database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((asgn) => (
                  <div key={asgn.teacher_id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col relative group hover:border-[#8A1538]/30 transition-all hover:shadow-lg hover:shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#8A1538] font-black text-sm shadow-sm group-hover:bg-[#8A1538] group-hover:text-white group-hover:border-[#8A1538] transition-all">
                        {asgn.teacher_name?.charAt(0).toUpperCase()}
                      </div>
                      <button 
                        onClick={() => handleDeleteTeacher(asgn.teacher_id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Teacher Account"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight leading-tight mb-1">{asgn.teacher_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asgn.department}</p>
                      <div className="mt-4 flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-[#8A1538]/10 text-[#8A1538] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#8A1538]/10">
                            {getYearLabel(asgn.year)}
                          </span>
                          {parseInt(asgn.student_count) > 0 ? (
                            <div className="flex items-center space-x-1.5 transition-all">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dataset Synced</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 text-amber-500 animate-slide-up-fade">
                              <AlertCircle size={10} className="shrink-0" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Incomplete Link</span>
                            </div>
                          )}
                        </div>
                        {parseInt(asgn.student_count) === 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-md p-2 flex items-start space-x-2 animate-slide-up-fade">
                            <ShieldAlert size={12} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-700 leading-tight">Assigned but no dataset uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
