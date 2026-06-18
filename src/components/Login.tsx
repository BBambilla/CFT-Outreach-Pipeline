import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Compass, Users, MapPin } from 'lucide-react';
import { Logo } from './Logo';

export const Login: React.FC = () => {
  const { students, setRole, setCurrentUser, setIsAuthenticated } = useAppContext();
  
  const [loginMethod, setLoginMethod] = useState<'student' | 'coordinator'>('student');
  const [coordinatorAccount, setCoordinatorAccount] = useState<'global' | 'olly'>('global');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select your country.');
      return;
    }
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const expectedPassword = `${student.country.toLowerCase().replace(/\s+/g, '')}2026`;
    if (password !== expectedPassword) {
      setError(`Incorrect password for ${student.country}. (Hint: ${expectedPassword})`);
      return;
    }
    
    setCurrentUser(student);
    setRole('student');
    setIsAuthenticated(true);
  };

  const handleCoordinatorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (coordinatorAccount === 'global') {
      if (password !== 'coordinator2026') {
        setError('Incorrect passcode for Coordinator. (Hint: coordinator2026)');
        return;
      }
      setRole('coordinator');
      setCurrentUser(null);
      setIsAuthenticated(true);
    } else if (coordinatorAccount === 'olly') {
      if (password !== 'olly2026') {
        setError('Incorrect password for Olly Wheatcroft.');
        return;
      }
      setRole('coordinator');
      const adminStudent = students.find(s => s.id === 'student-admin');
      if (adminStudent) setCurrentUser(adminStudent);
      setIsAuthenticated(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-brand-yellow p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-brand-orange/20 rounded-full pointer-events-none blur-xl"></div>
          <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 mx-auto mb-4 border-2 border-white shadow-lg overflow-hidden">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="relative text-2xl font-bold font-heading text-white mb-2 drop-shadow-sm">CFT Sponsor Outreach</h1>
          <p className="relative text-white/90 text-sm">Sign in to your dashboard</p>
        </div>
        
        <div className="p-8">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              onClick={() => { setLoginMethod('student'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${loginMethod === 'student' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Country Rep
            </button>
            <button
              onClick={() => { setLoginMethod('coordinator'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${loginMethod === 'coordinator' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Coordinator
            </button>
          </div>

          {loginMethod === 'student' ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-slate-400" />
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange bg-white"
                  >
                    <option value="" disabled>Select your country...</option>
                    {[...students].filter(s => s.id !== 'student-admin').sort((a,b) => a.country.localeCompare(b.country)).map(student => (
                      <option key={student.id} value={student.id}>
                        {student.country} ({student.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter country password"
                   className="block w-full px-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
                 />
              </div> 
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors mt-6"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleCoordinatorLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                <select
                  value={coordinatorAccount}
                  onChange={(e) => setCoordinatorAccount(e.target.value as any)}
                  className="block w-full px-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange bg-white mb-4"
                >
                  <option value="global">Global Coordinator</option>
                  <option value="olly">Admin (Olly Wheatcroft)</option>
                </select>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passcode / Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={coordinatorAccount === 'olly' ? "Enter password" : "Enter passcode"}
                  className="block w-full px-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
                />
              </div>
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors mt-6"
              >
                Sign In as Coordinator
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
