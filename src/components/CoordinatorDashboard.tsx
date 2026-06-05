import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Clock, Trophy, Users, Plus, KanbanSquare, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { AddLeadModal } from './AddLeadModal';
import { KanbanBoard } from './KanbanBoard';
import { SponsorDetailModal } from './SponsorDetailModal';

export const CoordinatorDashboard: React.FC = () => {
  const { sponsors, students } = useAppContext();
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [view, setView] = useState<'overview' | 'pipeline' | 'admin'>('overview');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  // 1. Funnel Chart Data
  const funnelData = PILELINE_STATUSES.map(status => ({
    name: status,
    count: sponsors.filter(s => s.status === status).length
  }));

  // 2. Student Progress / Leaderboard (Stuck analysis)
  const studentStats = students.filter(student => student.id !== 'student-admin').map(student => {
    const assigned = sponsors.filter(s => s.assignedStudentId === student.id);
    const inResearch = assigned.filter(s => s.status === 'To Research').length;
    const contacted = assigned.filter(s => s.status === 'Contacted').length;
    const committed = assigned.filter(s => s.status === 'Committed').length;
    return { name: student.name, inResearch, contacted, committed, total: assigned.length };
  });

  // 3. Stuck Sponsors
  const stuckThreshold = new Date(Date.now() - 10 * 86400000);
  const stuckSponsors = sponsors.filter(s => {
    if (s.status === 'Committed' || s.status === 'Declined / No Response') return false;
    const lastActive = s.lastContactedAt ? new Date(s.lastContactedAt) : new Date(s.createdAt);
    return lastActive < stuckThreshold;
  });

  // 4. Data Quality
  const missingInfoSponsors = sponsors.filter(s => !s.contactName || !s.email);

  const adminSponsors = sponsors.filter(s => s.assignedStudentId === 'student-admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Coordinator Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of all student pipelines, global leads, and administrative tools.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setView('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'overview' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={16} />
              Overview
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'pipeline' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <KanbanSquare size={16} />
              Global Pipeline
            </button>
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'admin' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ShieldAlert size={16} />
              Admin Leads
            </button>
          </div>
          <button 
            onClick={() => setIsAddingLead(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column (Charts & Progress) */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-slate-900 mb-6">Pipeline Funnel (All Students)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'var(--font-sans)' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'var(--font-sans)' }} />
                    <Bar dataKey="count" fill="#E4531F" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-slate-500" />
                  Student Progress Table
                </h2>
              </div>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">In Research</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Contacted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Committed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {studentStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{stat.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{stat.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={stat.inResearch > 2 ? 'text-red-600 font-medium' : 'text-slate-500'}>{stat.inResearch}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{stat.contacted}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">{stat.committed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Column (Alerts & Feeds) */}
          <div className="space-y-8">
            
            {/* Wins */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm border-t-4 border-t-sdg-green">
              <h2 className="text-base font-semibold font-heading text-green-800 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-sdg-green" />
                Recent Wins
              </h2>
              <div className="space-y-3">
                {funnelData.find(f => f.name === 'Committed')?.count === 0 ? (
                  <p className="text-sm text-green-700/70">No wins yet. Keep pushing!</p>
                ) : (
                  sponsors.filter(s => s.status === 'Committed').map(s => (
                    <div key={s.id} className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                      <p className="text-sm font-bold text-green-900">{s.organization}</p>
                      <p className="text-xs text-green-700 mt-1">Secured by <span className="font-semibold">{students.find(st => st.id === s.assignedStudentId)?.name}</span></p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stuck Alert */}
            <div className="bg-orange-50 border text-sm border-orange-200 rounded-xl p-6 shadow-sm border-t-4 border-t-brand-orange">
              <h2 className="font-semibold font-heading text-orange-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-brand-orange" />
                Stuck Sponsors (10+ days)
              </h2>
              {stuckSponsors.length === 0 ? (
                <p className="text-orange-700/70">Pipeline is flowing well.</p>
              ) : (
                <ul className="space-y-3">
                  {stuckSponsors.map(s => (
                    <li key={s.id} className="flex justify-between items-start bg-white p-2 rounded border border-orange-100 shadow-sm">
                      <div>
                        <span className="font-semibold text-orange-900 block">{s.organization}</span>
                        <span className="text-xs text-orange-700">{s.status} • {students.find(st => st.id === s.assignedStudentId)?.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Data Quality */}
            <div className="bg-red-50 border text-sm border-red-200 rounded-xl p-6 shadow-sm border-t-4 border-t-code-red">
              <h2 className="font-semibold font-heading text-red-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-code-red" />
                Data Quality Warning
              </h2>
              <p className="text-red-700/80 mb-3 text-xs font-medium">{missingInfoSponsors.length} sponsors missing contact info.</p>
              <div className="space-y-2">
                {missingInfoSponsors.slice(0,5).map(s => (
                  <div key={s.id} className="flex justify-between border-b border-red-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-red-900 font-semibold">{s.organization}</span>
                    <span className="text-xs text-red-600">{students.find(st => st.id === s.assignedStudentId)?.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : view === 'pipeline' ? (
        <div className="mt-8 flex-1 w-full bg-slate-50 border shadow-inner overflow-x-auto border-t border-slate-200 px-8 py-8 -ml-8 -mr-8 min-h-[500px]">
          <KanbanBoard sponsors={sponsors} onSponsorClick={setSelectedSponsorId} />
        </div>
      ) : (
        <div className="mt-8 flex-1 w-full bg-slate-50 border shadow-inner overflow-x-auto border-t border-slate-200 px-8 py-8 -ml-8 -mr-8 min-h-[500px]">
          <KanbanBoard sponsors={adminSponsors} onSponsorClick={setSelectedSponsorId} />
        </div>
      )}
      
      {isAddingLead && <AddLeadModal onClose={() => setIsAddingLead(false)} />}
      {selectedSponsorId && <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />}
    </div>
  );
};

