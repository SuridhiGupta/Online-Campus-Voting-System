import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import { AdminLogin, AdminLayout, Dashboard, ElectionControl, ManageCandidates, ManageStudents, Results } from './pages/AdminPortal';
import { StudentLogin, StudentLayout, VoteScreen, ReviewVotes } from './pages/StudentPortal';
import { TeacherLogin, TeacherLayout, TeacherDashboard } from './pages/TeacherPortal';
import TeacherManagement from './pages/TeacherManagement';

import { NotificationProvider } from './components/NotificationSystem';

function App() {
  return (
    <NotificationProvider>
      <Router>
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
    </Router>
  </NotificationProvider>
);
}

export default App;
