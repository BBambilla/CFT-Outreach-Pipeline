import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Interaction, SponsorStatus, InboundMessage } from '../types';
import { supabase } from '../lib/supabase';
import { X, Search, Sparkles, Send, FileText, ChevronRight, PenSquare, ArrowRight, Trash2, AlertCircle, CheckCircle2, Paperclip } from 'lucide-react';

export const SponsorDetailModal: React.FC<{ sponsorId: string, onClose: () => void }> = ({ sponsorId, onClose }) => {
  const { sponsors, updateSponsor, deleteSponsor, addInteraction, interactions, templates, resources, currentUser, students, role } = useAppContext();
  const sponsor = sponsors.find(s => s.id === sponsorId);
  const sponsorInteractions = interactions.filter(i => i.sponsorId === sponsorId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Outreach' | 'Activity log' | 'Files' | 'Conversation'>('Overview');
  const [inboundMessages, setInboundMessages] = useState<InboundMessage[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  
  useEffect(() => {
    if (activeTab === 'Conversation') {
      const fetchMessages = async () => {
        const { data } = await supabase.from('inbound_messages').select('*').eq('sponsor_id', sponsorId).order('received_at', { ascending: true });
        if (data) {
          setInboundMessages(data);
        }
        
        // Mark read
        if (sponsor?.has_new_reply) {
          await supabase.from('inbound_messages').update({ read: true }).eq('sponsor_id', sponsorId).eq('read', false);
          // Wait, doesn't has_new_reply clear automatically or via rpc?
          // The prompt says: "When the Conversation tab is opened for a lead, set read = true on that lead's inbound_messages rows so the unread indicator clears."
          // But it also says: "call the database function clear_new_reply with that lead's id (supabase.rpc('clear_new_reply', { p_sponsor_id: <lead id> })). That clears has_new_reply" (for the send flow)
        }
      };
      fetchMessages();
    }
  }, [activeTab, sponsorId, sponsor?.has_new_reply]);
  
  // States for interactions
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [draftEmail, setDraftEmail] = useState<string>('');
  const [draftSubject, setDraftSubject] = useState<string>('');
  const [draftAttachments, setDraftAttachments] = useState<{filename: string, url?: string, content?: string}[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSuccess, setEmailSuccess] = useState<string>('');
  const [isComposing, setIsComposing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newActivityType, setNewActivityType] = useState('Call');
  const [newActivityDetails, setNewActivityDetails] = useState('');

  const [newFileType, setNewFileType] = useState('File sent');
  const [newFileName, setNewFileName] = useState('');

  if (!sponsor) return null;

  const isOwner = role === 'coordinator' ? true : (sponsor.assignedStudentId === currentUser?.id && !sponsor.archived);
  const owner = students.find(s => s.id === sponsor.assignedStudentId);

  const relevantResources = resources.filter(r => r.tags.includes(sponsor.status));

  const handlePersonalize = () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let text = template.body;
    let subjectText = template.subject || '';

    if (template.title === 'Sponsorship Outreach') {
      const c = owner?.country?.trim() || currentUser?.country?.trim();
      subjectText = `Supporting National Tourism Climate Resilience in ${c ? c : 'your country'}`;
      text = `Dear [First name],

I would like to discuss how SUNx can support your work on Sustainable Tourism through our Climate Friendly Travel (CFT) framework.

I attach details of a high-impact initiative focused on CFT and Sustainable Tourism education, as I hope it will be of interest. We are looking for local sponsors to:

- Support our kids' education programme, Dodo4Kids, by creating sponsored books that highlight local destinations.
- Build Climate Friendly Travel Chapters which support aspiring Climate Champions through access to training.
- Create CFT Action Plans for Tourism businesses.

If this is of interest, please let me know, or you can book a 30-minute call here: https://calendly.com/olly-climatefriendlytravelservices/30min

Best wishes,`;
    }

    if (sponsor.lastContactedAt) {
      const dateStr = new Date(sponsor.lastContactedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      text = text.replace(/\(sent on \[Last contacted date\]\)/gi, `(sent on ${dateStr})`);
      text = text.replace(/\[Last contacted date\]/gi, dateStr);
      subjectText = subjectText.replace(/\[Last contacted date\]/gi, dateStr);
    } else {
      text = text.replace(/\s*\(sent on \[Last contacted date\]\)/gi, '');
      text = text.replace(/\[Last contacted date\]/gi, '');
      subjectText = subjectText.replace(/\[Last contacted date\]/gi, '');
    }

    let firstName = 'Sir or Madam';
    if (sponsor.contactName && sponsor.contactName.trim() !== '') {
      firstName = sponsor.contactName.trim().split(' ')[0];
    } else if (sponsor.organization && sponsor.organization.trim() !== '') {
      firstName = `${sponsor.organization} team`;
    }

    const replacements: Record<string, string> = {
      '\\[First name\\]': firstName,
      '\\[Organization\\]': sponsor.organization || '',
      '\\[MyName\\]': currentUser?.name || '',
      '\\[MyCountry\\]': currentUser?.country || ''
    };

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(key, 'gi');
      text = text.replace(regex, value);
      subjectText = subjectText.replace(regex, value);
    }

    const company = sponsor.organization?.trim();
    if (company && template.title !== 'Sponsorship Outreach') {
      const cleanSubject = subjectText.trim();
      if (cleanSubject.toLowerCase() === 'an invitation to join the climate friendly travel registry') {
        subjectText = `An invitation for ${company} to join the Climate Friendly Travel Registry`;
      } else {
        const followUpRegex = /^following up/i;
        if (followUpRegex.test(cleanSubject)) {
          subjectText = cleanSubject.replace(/^following up( on| regarding)?/i, (match, p1) => {
            return `Following up with ${company}${p1 || ''}`;
          });
        } else {
          subjectText = `${company} — ${cleanSubject}`;
        }
      }
    }

    const match = text.match(/\n+(Best(?: regards)?|Warm regards|Sincerely|Best wishes),[\s\S]*$/i);
    if (match) {
      text = text.replace(match[0], `\n\n${match[1]},`);
    }

    setDraftEmail(text);
    setDraftSubject(subjectText);
    setIsComposing(true);

    if (template.title === 'Sponsorship Outreach') {
      setDraftAttachments([{
        filename: "Supporting National Climate Resilience.pdf",
        url: "https://jpftaqubuokdthecsmmx.supabase.co/storage/v1/object/public/attachments/Supporting_National_Climate_Resilience.pdf"
      }]);
    } else if ((template.title === 'Registry Outreach' || template.title === 'An invitation to join the Climate Friendly Travel Registry' || template.subject === 'An invitation to join the Climate Friendly Travel Registry') && currentUser?.name) {
      setDraftAttachments([{
        filename: `${currentUser.name.trim()} - CFT Registry.pdf`,
        url: `https://jpftaqubuokdthecsmmx.supabase.co/storage/v1/object/public/attachments/registry/${encodeURIComponent(currentUser.name.trim())}.pdf`
      }]);
    } else {
      setDraftAttachments([]);
    }
  };

  const getSignature = () => {
    const isRep = role !== 'coordinator';
    if (isRep) {
      return {
        html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>${currentUser?.name || ''}</div>
  <div><strong>SUN<sup>x</sup> ${currentUser?.country || ''}</strong></div>
  <div>${currentUser?.country || ''} Chapter Lead</div>
  <div><a href="https://www.thesunprogram.com" style="color:#1155cc;">https://www.thesunprogram.com</a></div>
  <div style="margin-top:10px;"><a href="https://youtu.be/QW3byaVLrZM" style="color:#1155cc;">Short Video About SUNx &amp; Climate Friendly Travel</a></div>
</div>`,
        plain: `${currentUser?.name || ''}\nSUNx ${currentUser?.country || ''}\n${currentUser?.country || ''} Chapter Lead\nhttps://www.thesunprogram.com\nShort Video About SUNx & Climate Friendly Travel: https://youtu.be/QW3byaVLrZM`
      };
    } else {
      return {
        html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>Olly Wheatcroft</div>
  <div><strong>SUN<sup>x</sup> Malta</strong></div>
  <div>Programme Manager</div>
  <div>m: +44 7765 132408</div>
  <div><a href="https://www.thesunprogram.com" style="color:#1155cc;">https://www.thesunprogram.com</a></div>
  <div style="margin-top:10px;"><a href="https://youtu.be/QW3byaVLrZM" style="color:#1155cc;">Short Video About SUNx &amp; Climate Friendly Travel</a></div>
</div>`,
        plain: `Olly Wheatcroft\nSUNx Malta\nProgramme Manager\nm: +44 7765 132408\nhttps://www.thesunprogram.com\nShort Video About SUNx & Climate Friendly Travel: https://youtu.be/QW3byaVLrZM`
      };
    }
  };

  const handleNewEmail = () => {
    setDraftEmail('\n\nBest regards,');
    setDraftSubject('');
    setDraftAttachments([]);
    setEmailError('');
    setIsComposing(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const path = `outreach/${Date.now()}-${safeName}`;
      
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      
      if (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      
      const { data } = supabase.storage.from('attachments').getPublicUrl(path);
      
      setDraftAttachments(prev => [...prev, { filename: file.name, url: data.publicUrl }]);
    }

    setIsUploading(false);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-gray-900/50 backdrop-blur-sm">
      <div className="ml-auto w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-heading text-slate-900">{sponsor.organization}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {sponsor.status}
              </span>
              {sponsor.has_new_reply && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></div>
                    New Response
                  </span>
                  <button
                    onClick={async () => {
                      setIsClearing(true);
                      try {
                        await supabase.rpc('clear_new_reply', { p_sponsor_id: sponsorId });
                      } finally {
                        setIsClearing(false);
                      }
                    }}
                    disabled={isClearing}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-1 flex items-center gap-1 rounded border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={12} />
                    Mark Read
                  </button>
                </div>
              )}
              {!isOwner && owner && (
                 <span className="text-xs text-slate-500 font-medium">Owned by: {owner.name}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{sponsor.contactName} • {sponsor.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {role === 'coordinator' && (
              sponsor.archived ? (
                <button
                  onClick={() => {
                    updateSponsor(sponsor.id, { 
                      archived: false, 
                      status: (sponsor.archivedFromStatus as SponsorStatus) || sponsor.status 
                    });
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Restore to pipeline
                </button>
              ) : (
                <button
                  onClick={() => {
                    updateSponsor(sponsor.id, { 
                      archived: true, 
                      archivedFromStatus: sponsor.status 
                    });
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Move to Sponsorship
                </button>
              )
            )}
            {isOwner && (
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this lead?')) {
                    deleteSponsor(sponsorId);
                    onClose();
                  }
                }}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
                title="Delete Lead"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* content body */}
        <div className="flex flex-1 overflow-hidden">
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="px-6 border-b border-gray-200">
              <div className="flex space-x-6">
                {(['Overview', 'Outreach', 'Activity log', 'Files', 'Conversation'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === tab 
                        ? 'border-brand-orange text-brand-orange font-heading' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {sponsor.classification === 'CFT Training' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Chapter Leader Name</label>
                          <input 
                            type="text" 
                            value={owner?.name || ''} 
                            readOnly
                            className="w-full text-sm font-medium text-gray-500 border-none p-0 focus:ring-0 opacity-70 cursor-not-allowed" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Submission Date</label>
                          <input 
                            type="date" 
                            value={sponsor.submissionDate || ''} 
                            readOnly={!isOwner}
                            onChange={(e) => updateSponsor(sponsorId, { submissionDate: e.target.value })}
                            className={`w-full text-sm text-gray-900 border-none p-0 focus:ring-0 ${!isOwner ? 'opacity-70 text-gray-500' : ''}`} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Enrolment Date</label>
                          <input 
                            type="date" 
                            value={sponsor.enrolmentDate || ''} 
                            readOnly={!isOwner}
                            onChange={(e) => updateSponsor(sponsorId, { enrolmentDate: e.target.value })}
                            className={`w-full text-sm text-gray-900 border-none p-0 focus:ring-0 ${!isOwner ? 'opacity-70 text-gray-500' : ''}`} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Training Completed</label>
                          <div className="flex items-center h-[38px]">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={sponsor.trainingCompleted || false}
                                disabled={!isOwner}
                                onChange={(e) => updateSponsor(sponsorId, { trainingCompleted: e.target.checked })}
                              />
                              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange ${!isOwner ? 'opacity-70' : ''}`}></div>
                              <span className="ml-3 text-sm font-medium text-gray-900">{sponsor.trainingCompleted ? 'Yes' : 'No'}</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Certificate of Participation (Date)</label>
                          <input 
                            type="date" 
                            value={sponsor.certificateDate || ''} 
                            readOnly={!isOwner}
                            onChange={(e) => updateSponsor(sponsorId, { certificateDate: e.target.value })}
                            className={`w-full text-sm text-gray-900 border-none p-0 focus:ring-0 ${!isOwner ? 'opacity-70 text-gray-500' : ''}`} 
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Organization</label>
                      <input 
                        type="text" 
                        value={sponsor.organization} 
                        readOnly={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { organization: e.target.value })}
                        className={`w-full text-sm font-medium text-gray-900 border-none p-0 focus:ring-0 ${!isOwner ? 'opacity-70' : ''}`} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Website</label>
                      <input 
                        type="text" 
                        value={sponsor.website} 
                        readOnly={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { website: e.target.value })}
                        className={`w-full text-sm text-sdg-blue hover:text-blue-800 border-none p-0 focus:ring-0 ${!isOwner ? 'opacity-70 text-gray-500' : ''}`} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Contact Name</label>
                      <input 
                        type="text" 
                        value={sponsor.contactName}
                        placeholder="e.g. Jane Doe"
                        readOnly={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { contactName: e.target.value })}
                        className={`w-full text-sm text-slate-900 pb-1 focus:border-brand-orange focus:outline-none ${!isOwner ? 'border-none opacity-70' : 'border-b border-dashed border-slate-300'}`} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                      <input 
                        type="email" 
                        value={sponsor.email} 
                        placeholder="jane@example.com"
                        readOnly={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { email: e.target.value })}
                        className={`w-full text-sm text-slate-900 pb-1 focus:border-brand-orange focus:outline-none ${!isOwner ? 'border-none opacity-70' : 'border-b border-dashed border-slate-300'}`} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Classification</label>
                      <select 
                        value={sponsor.classification || ''} 
                        disabled={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { classification: e.target.value as any })}
                        className={`w-full text-sm text-slate-900 border rounded-md p-2.5 bg-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange ${!isOwner ? 'border-transparent bg-slate-50 opacity-70 appearance-none' : 'border-slate-200'}`}
                      >
                        <option value="" disabled>Select a classification</option>
                        <option value="Registry">Registry</option>
                        <option value="CFT Training">CFT Training</option>
                        <option value="Sponsorships" disabled={role !== 'coordinator'}>
                          Sponsorships {role !== 'coordinator' && '(admin only)'}
                        </option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Why Good Fit (Rationale)</label>
                      <textarea 
                        value={sponsor.rationale} 
                        readOnly={!isOwner}
                        onChange={(e) => updateSponsor(sponsorId, { rationale: e.target.value })}
                        rows={3}
                        className={`w-full text-sm text-slate-900 border rounded-md p-2.5 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange ${!isOwner ? 'border-transparent bg-slate-50 opacity-70' : 'border-slate-200'}`} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Outreach' && (
                <div className="space-y-6">
                  {isOwner && (
                    <>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <PenSquare className="w-4 h-4 mr-2 text-gray-500" />
                          Draft new message
                        </h3>
                        
                        {emailSuccess ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center animate-in fade-in duration-300">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-green-800 font-semibold mb-1">Message Sent</h3>
                            <p className="text-sm text-green-700 mb-4">{emailSuccess}</p>
                            <button 
                              onClick={() => { setEmailSuccess(''); setSelectedTemplateId(''); }}
                              className="px-4 py-2 bg-white border border-green-300 text-sm font-medium text-green-700 rounded-md shadow-sm hover:bg-green-50 inline-flex items-center"
                            >
                              Write another email
                            </button>
                          </div>
                        ) : !draftEmail && !isComposing ? (
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Select Template</label>
                              <select 
                                className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:border-brand-orange"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                              >
                                <option value="">Choose a template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                              </select>
                            </div>
                            <button 
                              onClick={handlePersonalize}
                              disabled={!selectedTemplateId}
                              className="bg-brand-yellow/10 border border-brand-yellow/30 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold font-heading hover:bg-brand-yellow/20 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <Sparkles className="w-4 h-4 mr-2 text-brand-orange" /> Personalize
                            </button>
                            <button 
                              onClick={handleNewEmail}
                              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center shadow-sm"
                            >
                              <PenSquare className="w-4 h-4 mr-2 text-slate-500" /> Write a new email
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in duration-300">
                            <input 
                              type="text"
                              value={draftSubject}
                              onChange={(e) => setDraftSubject(e.target.value)}
                              placeholder="Subject"
                              className="w-full text-sm text-slate-900 border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:border-brand-orange font-medium"
                            />
                            <textarea 
                              value={draftEmail}
                              onChange={(e) => setDraftEmail(e.target.value)}
                              rows={10}
                              className="w-full text-sm text-slate-900 border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:border-brand-orange leading-relaxed"
                            />
                            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 font-sans" dangerouslySetInnerHTML={{ __html: getSignature().html }} />
                            {draftAttachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                                <span className="font-semibold text-slate-700 mt-0.5">Attachments:</span>
                                {draftAttachments.map((att, i) => (
                                  <span key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 shadow-sm">
                                    <FileText className="w-3.5 h-3.5 text-brand-orange" /> 
                                    <span className="truncate max-w-[150px]" title={att.filename}>{att.filename}</span>
                                    <button
                                      onClick={() => setDraftAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                      className="text-slate-400 hover:text-red-500 ml-1 rounded-full hover:bg-slate-100 p-0.5 transition-colors"
                                      title="Remove attachment"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-between gap-2 items-start flex-wrap">
                              <div className="flex-shrink-0">
                                <input 
                                  type="file" 
                                  multiple 
                                  ref={fileInputRef} 
                                  style={{ display: 'none' }} 
                                  onChange={handleFileSelect}
                                />
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-sm font-medium text-slate-600 hover:text-brand-orange flex items-center bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-md transition-colors border border-slate-200 shadow-sm"
                                  disabled={isSendingEmail || isUploading}
                                >
                                  <Paperclip className="w-4 h-4 mr-1.5" /> {isUploading ? 'Uploading...' : 'Attach document'}
                                </button>
                              </div>
                              
                              <div className="flex justify-end gap-2 items-center flex-wrap flex-1">
                                {emailError && (
                                  <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded border border-red-100 flex items-center gap-2 mb-2 w-full">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="break-all">{emailError}</span>
                                  </div>
                                )}
                                <button onClick={() => { setDraftEmail(''); setDraftSubject(''); setDraftAttachments([]); setEmailError(''); setIsComposing(false); }} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700" disabled={isSendingEmail}>Discard</button>
                                <button 
                                  disabled={isSendingEmail || !draftSubject.trim() || !draftEmail.trim() || !sponsor.email}
                                onClick={async () => {
                                  setIsSendingEmail(true);
                                  setEmailError('');
                                  try {
                                    let htmlContent = draftEmail
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')
                                      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1155cc;">$1</a>')
                                      .replace(/\n/g, '<br>');
                                    
                                    htmlContent = htmlContent.replace(/(?:<br>- (.*?))+(?=<br>|$)/g, (match) => {
                                      const items = match.split('<br>- ').filter(Boolean).map(item => `<li>${item}</li>`).join('');
                                      return `<br><ul style="margin-top:8px;margin-bottom:8px;padding-left:24px;list-style-type:disc;">${items}</ul>`;
                                    });

                                    const sig = getSignature();
                                    const formattedHtml = `<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;color:#222;">${htmlContent}</div>${sig.html}`;
                                    const plainText = `${draftEmail}\n\n${sig.plain}`;

                                    const response = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        from: currentUser?.email || 'noreply@climatefriendlytravel.com',
                                        fromName: currentUser?.name || 'Climate Friendly Travel',
                                        to: sponsor.email || '',
                                        subject: draftSubject,
                                        body: plainText,
                                        html: formattedHtml,
                                        attachments: draftAttachments.length > 0 ? draftAttachments : undefined
                                      })
                                    });

                                    if (response.ok) {
                                      const respData = await response.json();
                                      const notes = respData.notes ? ` (Notes: ${respData.notes.join(', ')})` : '';
                                      const emailTo = sponsor.email || 'unknown';
                                      addInteraction({ 
                                        sponsorId, 
                                        type: 'Email sent', 
                                        date: new Date().toISOString(), 
                                        summary: `Email sent to ${emailTo} | Subject: ${draftSubject}${notes}` 
                                      });
                                      updateSponsor(sponsorId, { status: 'Contacted', lastContactedAt: new Date().toISOString() });
                                      await supabase.rpc('clear_new_reply', { p_sponsor_id: sponsorId });
                                      setEmailSuccess(`Email sent successfully to ${emailTo}${notes}`);
                                      setDraftEmail('');
                                      setDraftSubject('');
                                      setDraftAttachments([]);
                                      setIsComposing(false);
                                    } else {
                                      const errorData = await response.json().catch(() => ({}));
                                      setEmailError(errorData.error?.message || errorData.error || `Failed to send email (${response.status} ${response.statusText})`);
                                    }
                                  } catch (error: any) {
                                    setEmailError(error.message || 'Error sending email. Please check your connection and try again.');
                                  } finally {
                                    setIsSendingEmail(false);
                                  }
                                }}
                                className="bg-brand-orange text-white px-4 py-1.5 rounded text-sm font-semibold font-heading hover:bg-orange-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-3.5 h-3.5 mr-1.5" /> {isSendingEmail ? 'Sending...' : 'Send email'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                  )}
                  {!isOwner && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                      <p>You can only draft emails for leads assigned to you.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Activity log' && (
                <div className="space-y-6">
                  {isOwner && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-800 font-heading mb-3">Log New Activity</h3>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Activity Type</label>
                          <select 
                            value={newActivityType}
                            onChange={(e) => setNewActivityType(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:border-brand-orange"
                          >
                            <option value="Call">Call</option>
                            <option value="Text">Text</option>
                            <option value="Email sent">Email sent</option>
                            <option value="Email received">Email received</option>
                            <option value="Online Meeting">Online Meeting</option>
                            <option value="Face-to-Face Meeting">Face-to-Face Meeting</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Note">Other Note</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Details (Summary)</label>
                          <textarea
                            placeholder="What was discussed or done?"
                            value={newActivityDetails}
                            onChange={(e) => setNewActivityDetails(e.target.value)}
                            rows={2}
                            className="w-full text-sm text-slate-900 border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:border-brand-orange"
                          ></textarea>
                        </div>
                        <div className="flex justify-end">
                          <button
                            disabled={!newActivityDetails}
                            onClick={() => {
                              addInteraction({
                                sponsorId,
                                type: newActivityType as any,
                                date: new Date().toISOString(),
                                summary: newActivityDetails
                              });
                              setNewActivityDetails('');
                              setNewActivityType('Call');
                            }}
                            className="bg-brand-orange text-white px-4 py-1.5 rounded text-sm font-semibold font-heading hover:bg-orange-700 disabled:opacity-50 transition-colors"
                          >
                            Add Activity
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative border-l border-slate-200 ml-4 py-2">
                    {sponsorInteractions.length === 0 ? (
                      <div className="text-sm text-slate-500 italic ml-4">No interactions yet.</div>
                    ) : (
                      sponsorInteractions.map(interaction => (
                        <div key={interaction.id} className="relative pl-6 pb-6 last:pb-2">
                          <div className="absolute w-2.5 h-2.5 bg-brand-orange rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                          <div className="text-xs font-bold text-slate-500 mb-0.5 tracking-wide">{new Date(interaction.date).toLocaleDateString()} • {interaction.type}</div>
                          <div className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 mt-1.5 shadow-sm">
                            {interaction.summary}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Files' && (
                <div className="space-y-6">
                  {isOwner && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-800 font-heading mb-3">Log File Sent or Received</h3>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
                          <select 
                            value={newFileType}
                            onChange={(e) => setNewFileType(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:border-brand-orange"
                          >
                            <option value="File sent">File sent</option>
                            <option value="File received">File received</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">File Name or Details</label>
                          <input
                            type="text"
                            placeholder="e.g., Sponsorship Package.pdf"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            className="w-full text-sm text-slate-900 border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:border-brand-orange"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            disabled={!newFileName}
                            onClick={() => {
                              addInteraction({
                                sponsorId,
                                type: newFileType as any,
                                date: new Date().toISOString(),
                                summary: newFileName
                              });
                              setNewFileName('');
                            }}
                            className="bg-brand-orange text-white px-4 py-1.5 rounded text-sm font-semibold font-heading hover:bg-orange-700 disabled:opacity-50 transition-colors"
                          >
                            Log File
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative border-l border-slate-200 ml-4 py-2">
                    {sponsorInteractions.filter(i => i.type === 'File sent' || i.type === 'File received').length === 0 ? (
                      <div className="text-sm text-slate-500 italic ml-4">No files logged yet.</div>
                    ) : (
                      sponsorInteractions.filter(i => i.type === 'File sent' || i.type === 'File received').map(interaction => (
                        <div key={interaction.id} className="relative pl-6 pb-6 last:pb-2">
                          <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                          <div className="text-xs font-bold text-slate-500 mb-0.5 tracking-wide">{new Date(interaction.date).toLocaleDateString()} • {interaction.type}</div>
                          <div className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 mt-1.5 shadow-sm">
                            {interaction.summary}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Conversation' && (
                <div className="p-6">
                  <h3 className="font-heading font-semibold text-lg text-slate-800 mb-6">Conversation History</h3>
                  <div className="space-y-6">
                    {(() => {
                      const sentEmails = sponsorInteractions
                        .filter(i => i.type === 'Email sent')
                        .map(i => ({
                          id: i.id,
                          date: new Date(i.date),
                          type: 'sent',
                          summary: i.summary
                        }));
                        
                      const receivedEmails = inboundMessages
                        .map(m => ({
                          id: m.id,
                          date: new Date(m.received_at),
                          type: 'received',
                          subject: m.subject,
                          body: m.body_text,
                          senderName: m.sender_name,
                          senderEmail: m.sender_email,
                          read: m.read
                        }));
                        
                      const allMessages = [...sentEmails, ...receivedEmails].sort((a, b) => a.date.getTime() - b.date.getTime());
                      
                      if (allMessages.length === 0) {
                        return <div className="text-sm text-slate-500 italic">No conversation history yet.</div>;
                      }

                      return allMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl p-4 shadow-sm ${msg.type === 'sent' ? 'bg-brand-orange/10 border border-brand-orange/20 text-slate-800' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}>
                            {msg.type === 'sent' ? (
                              <>
                                <div className="text-xs text-brand-orange font-bold tracking-wide uppercase mb-1 flex items-center justify-end">You • {msg.date.toLocaleString()}</div>
                                <div className="text-sm whitespace-pre-wrap">{msg.summary}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-blue-600 font-bold tracking-wide uppercase mb-1 flex items-center">
                                  {msg.senderName || msg.senderEmail} • {msg.date.toLocaleString()}
                                  {!msg.read && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" title="Unread"></span>}
                                </div>
                                <div className="text-sm font-semibold mb-2">Subject: {msg.subject}</div>
                                <div className="text-sm whitespace-pre-wrap bg-white/50 p-2 rounded border border-slate-100">{msg.body}</div>
                              </>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - Knowledge Base */}
          <div className="w-64 bg-gray-50 border-l border-gray-200 p-5 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Helpful for this stage</h3>
            {relevantResources.length === 0 ? (
              <p className="text-sm text-gray-400">No specific resources for "{sponsor.status}".</p>
            ) : (
              <div className="space-y-3">
                {relevantResources.map(r => (
                  <a key={r.id} href="#" className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all group">
                    <div className="flex items-start">
                      <FileText className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{r.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{r.category}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
