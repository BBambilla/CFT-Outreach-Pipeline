import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Layers, Presentation, Compass, Users } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { role, setRole, currentUser, students, setCurrentUser } = useAppContext();

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50 h-16 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center text-white font-heading font-bold text-lg mr-3 shadow-sm">C</div>
            <span className="font-bold text-xl tracking-tight text-slate-800 mr-8 font-heading">CFT Sponsor Outreach</span>
            
            <div className="hidden sm:flex sm:space-x-4">
              <a href="#" className="text-slate-800 bg-slate-100 px-3 py-2 rounded-md text-sm font-medium">
                Pipeline
              </a>
              <a href="#" className="text-slate-500 hover:bg-slate-50 hover:text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Knowledge Base
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {role === 'student' && (
              <select 
                className="text-sm border border-slate-200 text-slate-600 rounded-md shadow-sm focus:border-brand-orange focus:ring-brand-orange px-3 py-1.5"
                value={currentUser?.id}
                onChange={(e) => setCurrentUser(students.find(s => s.id === e.target.value) || null)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setRole('student')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${role === 'student' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Student
              </button>
              <button
                onClick={() => setRole('coordinator')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${role === 'coordinator' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Coordinator
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
