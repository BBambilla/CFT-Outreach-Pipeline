import React, { useState, useEffect } from 'react';
import { Compass, Users, MapPin, Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'student' | 'coordinator'>('student');
  const [coordinatorAccount, setCoordinatorAccount] = useState<'global' | 'olly'>('global');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [directory, setDirectory] = useState<{id: string, name: string, country: string}[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchDirectory = async () => {
      if (!supabase) {
        setError('Database client not initialized');
        return;
      }
      const { data, error } = await supabase.from('login_directory').select('*');
      if (error) {
        setError('Failed to load rep list: ' + error.message);
      } else if (data) {
        const sorted = data.sort((a, b) => {
          if (a.country < b.country) return -1;
          if (a.country > b.country) return 1;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
        setDirectory(sorted);
      }
    };
    fetchDirectory();
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!selectedStudentId) {
      setError('Please select your country.');
      return;
    }
    
    setError('');
    setIsSigningIn(true);
    const email = `${selectedStudentId}@cft-app.local`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsSigningIn(false);
    }
  };

  const handleCoordinatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setError('');
    setIsSigningIn(true);
    let email = '';
    if (coordinatorAccount === 'global') {
      email = 'pratishtha@cft-app.local';
    } else if (coordinatorAccount === 'olly') {
      email = 'olly@cft-app.local';
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsSigningIn(false);
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
                    {directory.map(rep => (
                      <option key={rep.id} value={rep.id}>
                        {rep.country} ({rep.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                 <div className="relative">
                   <input
                     type={showPassword ? "text" : "password"}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="Enter country password"
                     className="block w-full px-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange pr-10"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
              </div> 
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors mt-6 disabled:opacity-50"
              >
                {isSigningIn ? 'Signing in...' : 'Sign In'}
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
                  <option value="global">Admin (Pratishtha Parajuli)</option>
                  <option value="olly">Admin (Olly Wheatcroft)</option>
                </select>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passcode / Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={coordinatorAccount === 'olly' ? "Enter password" : "Enter passcode"}
                    className="block w-full px-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors mt-6 disabled:opacity-50"
              >
                {isSigningIn ? 'Signing in...' : 'Sign In as Coordinator'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
