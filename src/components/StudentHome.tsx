import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES, SponsorStatus, Sponsor } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { SponsorDetailModal } from './SponsorDetailModal';
import { AddLeadModal } from './AddLeadModal';
import { Plus, LifeBuoy } from 'lucide-react';
import { RequestSupportModal } from './RequestSupportModal';

export const StudentHome: React.FC = () => {
  const { sponsors, currentUser, students } = useAppContext();
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  if (!currentUser) return null;

  const countryStudents = students.filter(s => s.country === currentUser.country).map(s => s.id);
  const countrySponsors = sponsors.filter(s => countryStudents.includes(s.assignedStudentId));
  const mySponsors = sponsors.filter(s => s.assignedStudentId === currentUser.id);

  const stats = {
    contacted: countrySponsors.filter(s => s.status === 'Contacted').length,
    inConversation: countrySponsors.filter(s => s.status === 'In Conversation').length,
    committed: countrySponsors.filter(s => s.status === 'Committed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-brand-canary">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Contacted</p>
          <p className="text-2xl font-bold text-slate-800">{stats.contacted}</p>
        </div>
        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 shadow-sm border-t-4 border-t-brand-orange">
          <p className="text-xs font-bold text-orange-600/80 uppercase tracking-widest mb-1 font-heading">In Conversation</p>
          <p className="text-2xl font-bold text-brand-orange font-heading">{stats.inConversation}</p>
        </div>
        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 shadow-sm border-t-4 border-t-sdg-green">
          <p className="text-xs font-bold text-green-700/80 uppercase tracking-widest mb-1 font-heading">Committed</p>
          <p className="text-2xl font-bold text-sdg-green font-heading">{stats.committed}</p>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm border-t-4 border-t-brand-blue">
          <p className="text-xs font-bold text-blue-700/80 uppercase tracking-widest mb-1">Deadline</p>
          <p className="text-2xl font-bold text-brand-blue">6 Months</p>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="flex-1 flex flex-col mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">My Pipeline</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <LifeBuoy size={16} />
              <span className="hidden sm:inline">Request Support</span>
            </button>
            <button 
              onClick={() => setIsAddingLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>New Lead</span>
            </button>
          </div>
        </div>
        <KanbanBoard sponsors={countrySponsors} onSponsorClick={setSelectedSponsorId} />
      </section>

      {isAddingLead && (
        <AddLeadModal onClose={() => setIsAddingLead(false)} />
      )}

      {selectedSponsorId && (
        <SponsorDetailModal 
          sponsorId={selectedSponsorId} 
          onClose={() => setSelectedSponsorId(null)} 
        />
      )}

      {isSupportModalOpen && (
        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />
      )}
    </div>
  );
};
