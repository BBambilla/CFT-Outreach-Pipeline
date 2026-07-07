import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import { SponsorStatus, Sponsor } from '../types';

interface AddLeadModalProps {
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { addSponsor, addBulkSponsors, currentUser, role, authEmail } = useAppContext();
  
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [classification, setClassification] = useState<'Registry' | 'CFT Training' | 'Sponsorships' | 'Scholarships' | ''>('');
  const [notes, setNotes] = useState('');
  
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState<{name: string, email: string}[]>([{name: '', email: ''}]);
  const [scholarshipCountry, setScholarshipCountry] = useState('');
  
  const getLoggedInName = () => {
    if (role === 'coordinator') {
      if (authEmail === 'pratishtha@cft-app.local' || authEmail === 'pratishtha@thesunprogram.com') return 'Pratishtha Parajuli';
      return 'Olly Wheatcroft';
    }
    return currentUser?.name || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (classification === 'CFT Training' || classification === 'Scholarships') {
      if (participants.some(p => !p.name.trim() || !p.email.trim())) {
        alert("All participants must have a Name and Email.");
        return;
      }
      
      if (classification === 'Scholarships' && !scholarshipCountry.trim()) {
        alert("Scholarships require a target Country.");
        return;
      }
      
      const newSponsors = participants.map(p => ({
        id: uuidv4(),
        assignedStudentId: currentUser?.id || 'unassigned',
        organization: p.name.trim(), // Use name as organization/title
        website: '',
        contactName: p.name.trim(),
        email: p.email.trim(),
        role: '',
        phone: '',
        rationale: '',
        sourceNotes: '',
        researchNotes: '',
        classification: classification as any,
        status: 'To Research' as SponsorStatus,
        priority: 'Medium' as any,
        createdAt: new Date().toISOString(),
        submissionDate: submissionDate,
        country: classification === 'Scholarships' ? scholarshipCountry.trim() : (currentUser?.country || ''),
        chapter_leader_name: getLoggedInName(),
      }));
      
      addBulkSponsors(newSponsors);
      onClose();
      return;
    }
    
    if (!organization || !contactName || !email || !classification) {
      alert("Organization, Contact Name, Email, and Classification are required.");
      return;
    }
    
    const newSponsor: Sponsor = {
      id: uuidv4(),
      assignedStudentId: role === 'coordinator' ? 'student-admin' : (currentUser?.id || 'unassigned'),
      organization,
      website,
      contactName,
      email,
      role: '', // Could be inferred or captured
      phone: '',
      rationale: '',
      sourceNotes: '',
      researchNotes: notes,
      classification: classification as any,
      status: 'To Research', // Default status for new leads
      priority: 'Medium',
      createdAt: new Date().toISOString(),
      chapter_leader_name: getLoggedInName(),
    };
    
    addSponsor(newSponsor);
    onClose();
  };

  const addParticipant = () => {
    setParticipants([...participants, {name: '', email: ''}]);
  };
  
  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };
  
  const updateParticipant = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-xl font-bold font-heading text-slate-800">Add New Lead</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto w-full">
          <form id="add-lead-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Classification <span className="text-red-500">*</span></label>
              <select 
                value={classification}
                onChange={(e) => setClassification(e.target.value as any)}
                required
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange bg-white"
              >
                <option value="" disabled>Select a classification</option>
                <option value="Registry">Registry</option>
                <option value="CFT Training">CFT Training</option>
                <option value="Sponsorships" disabled={role !== 'coordinator'}>
                  Sponsorships {role !== 'coordinator' && '(admin only)'}
                </option>
                {(authEmail === 'olly@cft-app.local' || authEmail === 'chapters@thesunprogram.com' || authEmail === 'pratishtha@cft-app.local' || authEmail === 'pratishtha@thesunprogram.com') && (
                  <option value="Scholarships">Scholarships</option>
                )}
              </select>
            </div>
            
            {classification === 'CFT Training' || classification === 'Scholarships' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chapter Leader Name</label>
                    <input 
                      type="text" 
                      value={getLoggedInName()}
                      readOnly
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Submission Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                    />
                  </div>
                  {classification === 'Scholarships' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Country <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={scholarshipCountry}
                        onChange={(e) => setScholarshipCountry(e.target.value)}
                        required={classification === 'Scholarships'}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                        placeholder="Target country for the scholarship"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Participants</label>
                    <button 
                      type="button" 
                      onClick={addParticipant}
                      className="text-xs text-brand-orange font-semibold hover:text-orange-700 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> Add another participant
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {participants.map((p, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex-1 space-y-3">
                          <div>
                            <input 
                              type="text" 
                              value={p.name}
                              onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                              placeholder="Name of the Participant"
                              required
                              className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:border-brand-orange"
                            />
                          </div>
                          <div>
                            <input 
                              type="email" 
                              value={p.email}
                              onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                              placeholder="Email address"
                              required
                              className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:border-brand-orange"
                            />
                          </div>
                        </div>
                        {participants.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeParticipant(index)}
                            className="p-1.5 mt-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Organization <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                    placeholder="Company or Organization Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                    placeholder="https://"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange resize-none"
                    placeholder="Any additional information..."
                  ></textarea>
                </div>
              </>
            )}
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-lead-form"
            className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
          >
            Save Lead
          </button>
        </div>
      </div>
    </div>
  );
};
