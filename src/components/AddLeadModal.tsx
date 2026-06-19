import React, { useState } from 'react';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import { SponsorStatus, Sponsor } from '../types';

interface AddLeadModalProps {
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { addSponsor, currentUser, role } = useAppContext();
  
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [classification, setClassification] = useState<'Registry' | 'CFT Training' | 'Sponsorships' | ''>('');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    };
    
    addSponsor(newSponsor);
    onClose();
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
              </select>
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
