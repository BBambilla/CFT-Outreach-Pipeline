import React from 'react';
import { Sponsor, SponsorStatus, PILELINE_STATUSES } from '../types';
import { useAppContext } from '../context/AppContext';

export const KanbanBoard: React.FC<{ sponsors: Sponsor[], archivedSponsors?: Sponsor[], onSponsorClick: (id: string) => void }> = ({ sponsors, archivedSponsors, onSponsorClick }) => {
  const { updateSponsor, currentUser, students, role } = useAppContext();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('sponsorId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: SponsorStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('sponsorId');
    const sponsor = sponsors.find(s => s.id === id);
    if (id && sponsor && (role === 'coordinator' || sponsor.assignedStudentId === currentUser?.id)) {
      updateSponsor(id, { status });
    }
  };

  const getClassificationStyles = (classification?: string) => {
    switch (classification) {
      case 'Registry':
        return { badge: 'bg-blue-100 text-blue-800', border: 'border-l-[3px] border-l-blue-500' };
      case 'CFT Training':
        return { badge: 'bg-green-100 text-green-800', border: 'border-l-[3px] border-l-green-500' };
      case 'Sponsorships':
        return { badge: 'bg-purple-100 text-purple-800', border: 'border-l-[3px] border-l-purple-500' };
      case 'Scholarships':
        return { badge: 'bg-amber-100 text-amber-800', border: 'border-l-[3px] border-l-amber-500' };
      default:
        return { badge: 'bg-slate-100 text-slate-800', border: 'border-l-[3px] border-l-slate-300' };
    }
  };

  const statusBorderColors: Record<SponsorStatus, string> = {
    'To Research': 'border-t-slate-400',
    'Ready to Contact': 'border-t-brand-canary',
    'Contacted': 'border-t-brand-yellow',
    'In Conversation': 'border-t-brand-orange shadow-brand-orange/20 shadow-md',
    'Committed': 'border-t-sdg-green',
    'Registered / Enrolled': 'border-t-teal-500',
    'Declined': 'grayscale border-t-slate-200'
  };

  const columnTheme: Record<SponsorStatus, { colBg: string, headerText: string, badge: string }> = {
    'To Research': { 
      colBg: 'bg-slate-100 border-slate-200', 
      headerText: 'text-slate-700', 
      badge: 'bg-slate-200 text-slate-700' 
    },
    'Ready to Contact': { 
      colBg: 'bg-[#FFF9E6] border-[#FCEBA2]', 
      headerText: 'text-yellow-800', 
      badge: 'bg-yellow-200 text-yellow-800' 
    },
    'Contacted': { 
      colBg: 'bg-amber-50 border-amber-200', 
      headerText: 'text-amber-800', 
      badge: 'bg-amber-200 text-amber-900' 
    },
    'In Conversation': { 
      colBg: 'bg-orange-50 border-orange-200', 
      headerText: 'text-orange-900', 
      badge: 'bg-orange-200 text-orange-900' 
    },
    'Committed': { 
      colBg: 'bg-emerald-50 border-emerald-200', 
      headerText: 'text-emerald-800', 
      badge: 'bg-emerald-200 text-emerald-900' 
    },
    'Registered / Enrolled': { 
      colBg: 'bg-teal-50 border-teal-200', 
      headerText: 'text-teal-800', 
      badge: 'bg-teal-200 text-teal-900' 
    },
    'Declined': { 
      colBg: 'bg-gray-100 border-gray-200', 
      headerText: 'text-gray-500', 
      badge: 'bg-gray-200 text-gray-600' 
    }
  };

  return (
    <div className="flex flex-1 space-x-4 sm:space-x-6 overflow-x-auto pb-4 scrollbar-hide min-h-[400px]">
      {PILELINE_STATUSES.map(status => {
        if (status === 'Committed' && role !== 'coordinator') return null;
        
        const columnSponsors = sponsors.filter(s => s.status === status);
        const isDeclined = status === 'Declined';
        const theme = columnTheme[status];
        
        return (
          <div 
            key={status}
            className={`min-w-[85vw] sm:min-w-[280px] w-[85vw] sm:w-[320px] flex flex-col p-3 rounded-xl border ${theme.colBg} ${isDeclined ? 'opacity-60' : ''} shrink-0`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <span className={`text-[13px] font-bold uppercase tracking-wider ${theme.headerText}`}>{status.replace(' / No Response', '')}</span>
              <span className={`${theme.badge} text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm`}>
                {columnSponsors.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {columnSponsors.map(sponsor => {
                const isOwner = role === 'coordinator' || sponsor.assignedStudentId === currentUser?.id;
                const owner = students.find(s => s.id === sponsor.assignedStudentId);
                
                return (
                  <div
                    key={sponsor.id}
                    draggable={isOwner}
                    onDragStart={(e) => {
                      if (isOwner) handleDragStart(e, sponsor.id);
                    }}
                    onClick={() => onSponsorClick(sponsor.id)}
                    className={`p-3.5 rounded-xl block border shadow-sm border-t-4 cursor-pointer transition-all ${statusBorderColors[status]} ${getClassificationStyles(sponsor.classification).border} ${isOwner ? 'bg-white hover:border-brand-orange hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-80'}`}
                  >
                    <div className="mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getClassificationStyles(sponsor.classification).badge}`}>
                        {sponsor.classification || 'Unclassified'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 text-slate-800 leading-tight">{sponsor.organization}</h3>
                    <p className="text-xs text-slate-500 mb-3 truncate">{sponsor.contactName || 'No contact specified'}</p>
                    <div className="flex items-center justify-between mt-auto gap-2">
                       <div className="flex gap-1.5 flex-wrap">
                         {sponsor.has_new_reply && (
                           <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wide flex items-center shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></div>
                             New Response
                           </span>
                         )}
                         {sponsor.priority === 'High' ? (
                           <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md uppercase tracking-wide">Code Red</span>
                         ) : null}
                       </div>
                       {owner ? (
                         <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[120px] border border-slate-200 ml-auto shrink-0">
                            {owner.name}
                         </span>
                       ) : <span />}
                    </div>
                  </div>
                );
              })}
              {columnSponsors.length === 0 && (
                <div className={`text-sm text-center font-medium my-2 py-8 border-2 border-dashed rounded-xl opacity-60 ${theme.headerText} border-current`}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {archivedSponsors && (
        <div 
          className="min-w-[85vw] sm:min-w-[280px] w-[85vw] sm:w-[320px] flex flex-col p-3 rounded-xl border bg-slate-50 border-slate-200 opacity-60 shrink-0"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Sponsorship</span>
            <span className="bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm">
              {archivedSponsors.length}
            </span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {archivedSponsors.map(sponsor => {
              const owner = students.find(s => s.id === sponsor.assignedStudentId);
              return (
                <div
                  key={sponsor.id}
                  draggable={false}
                  onClick={() => onSponsorClick(sponsor.id)}
                  className={`p-3.5 rounded-xl block border shadow-sm border-t-4 border-t-slate-300 cursor-pointer transition-all bg-slate-100 hover:border-slate-400 ${getClassificationStyles(sponsor.classification).border}`}
                >
                  <div className="mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getClassificationStyles(sponsor.classification).badge}`}>
                      {sponsor.classification || 'Unclassified'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-1.5 text-slate-800 leading-tight">{sponsor.organization}</h3>
                  <p className="text-xs text-slate-500 mb-3 truncate">{sponsor.contactName || 'No contact specified'}</p>
                  <div className="flex items-center justify-between mt-auto gap-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {sponsor.has_new_reply && (
                          <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wide flex items-center shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></div>
                            New Response
                          </span>
                        )}
                        {sponsor.priority === 'High' ? (
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded-md uppercase tracking-wide">Code Red</span>
                        ) : null}
                      </div>
                      {owner ? (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-md truncate max-w-[120px] border border-slate-300 ml-auto shrink-0">
                          {owner.name}
                        </span>
                      ) : <span />}
                  </div>
                </div>
              );
            })}
            {archivedSponsors.length === 0 && (
              <div className="text-sm text-center font-medium my-2 py-8 border-2 border-dashed rounded-xl opacity-60 text-slate-500 border-slate-300">
                No archived leads
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
