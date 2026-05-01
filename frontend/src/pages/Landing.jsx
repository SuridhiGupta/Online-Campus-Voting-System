import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users } from 'lucide-react';
import logo from '../assets/logo.png';
import { DeviceRoleContext } from '../App';

const Landing = () => {
  const navigate = useNavigate();
  const role = React.useContext(DeviceRoleContext);

  const portals = [
    {
      id: 'student',
      title: 'Student Voting',
      description: 'Cast your vote for student representatives and shape campus leadership.',
      icon: <GraduationCap size={40} className="text-[#8A1538]" />,
      path: '/student/login',
      allowedFor: ['student']
    },
    {
      id: 'teacher',
      title: 'Faculty Dashboard',
      description: 'View class-wise turnout, voting progress, and pending student participation.',
      icon: <Users size={40} className="text-[#DDA73B]" />,
      path: '/teacher/login',
      allowedFor: ['admin'] // Only admin PC can see/manage faculty
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Manage elections, candidates, results, and overall voting operations.',
      icon: <ShieldCheck size={40} className="text-slate-600" />,
      path: '/admin/login',
      allowedFor: ['admin']
    }
  ].filter(portal => portal.allowedFor.includes(role));

  return (
    <div className="min-h-screen bg-dashboard-hub flex flex-col font-sans selection:bg-[#8A1538] selection:text-white">

      {/* Official Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={logo}
              alt="College Logo"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                // Fallback if logo.png is missing, to maintain structure
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            {/* Fallback hidden text for the logo */}
            <div className="hidden h-14 w-14 bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-400 text-xs text-center leading-tight">
              Logo
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#8A1538] tracking-tight">
                Dr. D. Y. Patil School of Science and Technology
              </span>
              <span className="text-sm font-medium text-slate-500">
                Pune, Tathwade
              </span>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md tracking-wider uppercase">
            System Online
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative w-full">
        <div className="max-w-4xl w-full mx-auto">

          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight leading-tight mb-4">
              DYP-SST <span className="text-[#8A1538] font-semibold">Student Council Election Portal</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              "Your Vote. Your Voice. Your Campus Leadership."
            </p>
          </div>

          <div className={`grid grid-cols-1 ${
            portals.length === 3 ? 'md:grid-cols-3' : 
            portals.length === 2 ? 'md:grid-cols-2 max-w-3xl' : 
            'md:grid-cols-1 max-w-md'
          } mx-auto gap-8`}>
            {portals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => navigate(portal.path)}
                className="group relative bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#8A1538]/30 hover:-translate-y-[2px] transition-all duration-300 ease-in-out flex flex-col items-start focus:outline-none focus:ring-2 focus:ring-[#8A1538] focus:ring-offset-2 focus:ring-offset-[#f8f9fb] text-left"
              >
                {/* Accent Top Border indicating portal type */}
                <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-xl ${portal.id === 'student' ? 'bg-[#8A1538]' :
                    portal.id === 'teacher' ? 'bg-[#DDA73B]' :
                      'bg-slate-800'
                  }`}></div>



                <div className="mb-6 p-4 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-[#8A1538]/5 transition-colors">
                  {portal.icon}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {portal.title}
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {portal.description}
                </p>

                <div className="mt-8 text-sm font-bold text-[#8A1538] flex items-center group-hover:translate-x-1 transition-transform">
                  Enter Secure Portal &rarr;
                </div>
              </button>
            ))}
          </div>

        </div>
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 font-medium space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} Dr. D. Y. Patil School of Science and Technology. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span>Academic Session: {new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
            <span className="hidden md:inline-block w-px h-4 bg-slate-300"></span>
            <span>Created by <strong className="text-slate-800 font-semibold">Suridhi Gupta</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
