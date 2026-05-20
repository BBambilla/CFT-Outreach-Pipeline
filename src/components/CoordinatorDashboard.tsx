import React from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Clock, Trophy, Users } from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { sponsors, students } = useAppContext();

  // 1. Funnel Chart Data
  const funnelData = PILELINE_STATUSES.map(status => ({
    name: status,
    count: sponsors.filter(s => s.status === status).length
  }));

  // 2. Student Progress / Leaderboard (Stuck analysis)
  const studentStats = students.map(student => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coordinator Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of all student pipelines and sponsor statuses.</p>
        </div>
      </div>

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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold font-heading text-sdg-green mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-sdg-green" />
              Recent Wins
            </h2>
            <div className="space-y-3">
              {funnelData.find(f => f.name === 'Committed')?.count === 0 ? (
                <p className="text-sm text-slate-500">No wins yet. Keep pushing!</p>
              ) : (
                sponsors.filter(s => s.status === 'Committed').map(s => (
                  <div key={s.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{s.organization}</p>
                    <p className="text-xs text-slate-500 mt-1">Secured by {students.find(st => st.id === s.assignedStudentId)?.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stuck Alert */}
          <div className="bg-white border text-sm border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold font-heading text-slate-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-orange" />
              Stuck Sponsors (10+ days)
            </h2>
            {stuckSponsors.length === 0 ? (
              <p className="text-slate-500">Pipeline is flowing well.</p>
            ) : (
              <ul className="space-y-3">
                {stuckSponsors.map(s => (
                  <li key={s.id} className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-slate-900 block">{s.organization}</span>
                      <span className="text-xs text-slate-500">{s.status} • {students.find(st => st.id === s.assignedStudentId)?.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Data Quality */}
          <div className="bg-white border text-sm border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold font-heading text-slate-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-code-red" />
              Data Quality Warning
            </h2>
            <p className="text-slate-500 mb-3 text-xs">{missingInfoSponsors.length} sponsors missing contact info.</p>
            <div className="space-y-2">
              {missingInfoSponsors.slice(0,5).map(s => (
                <div key={s.id} className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-700 font-medium">{s.organization}</span>
                  <span className="text-xs text-slate-400">{students.find(st => st.id === s.assignedStudentId)?.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
