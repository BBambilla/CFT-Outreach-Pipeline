import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Interaction, SponsorStatus, InboundMessage } from '../types';
import { supabase } from '../lib/supabase';
import { X, Search, Sparkles, Send, FileText, ChevronRight, PenSquare, ArrowRight, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SponsorDetailModal: React.FC<{ sponsorId: string, onClose: () => void }> = ({ sponsorId, onClose }) => {
  const { sponsors, updateSponsor, deleteSponsor, addInteraction, interactions, templates, resources, currentUser, students, role } = useAppContext();
  const sponsor = sponsors.find(s => s.id === sponsorId);
  const sponsorInteractions = interactions.filter(i => i.sponsorId === sponsorId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Outreach' | 'Activity log' | 'Files' | 'Conversation'>('Overview');
  const [inboundMessages, setInboundMessages] = useState<InboundMessage[]>([]);
  
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
  const [draftAttachments, setDraftAttachments] = useState<{filename: string, url: string}[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSuccess, setEmailSuccess] = useState<string>('');
  
  const [newActivityType, setNewActivityType] = useState('Call');
  const [newActivityDetails, setNewActivityDetails] = useState('');

  const [newFileType, setNewFileType] = useState('File sent');
  const [newFileName, setNewFileName] = useState('');

  if (!sponsor) return null;

  const isOwner = sponsor.assignedStudentId === currentUser?.id || role === 'coordinator';
  const owner = students.find(s => s.id === sponsor.assignedStudentId);

  const relevantResources = resources.filter(r => r.tags.includes(sponsor.status));

  const handlePersonalize = () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let text = template.body;
    let subjectText = template.subject || '';

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

    setDraftEmail(text);
    setDraftSubject(subjectText);

    if (template.title === 'Sponsorship Outreach') {
      setDraftAttachments([{
        filename: "Supporting National Climate Resilience.pdf",
        url: "https://jpftaqubuokdthecsmmx.supabase.co/storage/v1/object/public/attachments/Supporting_National_Climate_Resilience.pdf"
      }]);
    } else {
      setDraftAttachments([]);
    }
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></div>
                  New Response
                </span>
              )}
              {!isOwner && owner && (
                 <span className="text-xs text-slate-500 font-medium">Owned by: {owner.name}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{sponsor.contactName} • {sponsor.role}</p>
          </div>
          <div className="flex items-center gap-2">
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
                        ) : !draftEmail ? (
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
                            {draftAttachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                                <span className="font-semibold text-slate-700">Attachments:</span>
                                {draftAttachments.map((att, i) => (
                                  <span key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5">
                                    <FileText className="w-3.5 h-3.5 text-brand-orange" /> {att.filename}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-end gap-2 items-center flex-wrap">
                              {emailError && (
                                <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded border border-red-100 flex items-center gap-2 mr-auto mb-2 w-full">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span className="break-all">{emailError}</span>
                                </div>
                              )}
                              <button onClick={() => { setDraftEmail(''); setDraftSubject(''); setDraftAttachments([]); setEmailError(''); }} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700" disabled={isSendingEmail}>Discard</button>
                              <button 
                                disabled={isSendingEmail}
                                onClick={async () => {
                                  setIsSendingEmail(true);
                                  setEmailError('');
                                  try {
                                    const response = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        from: currentUser?.email || 'noreply@climatefriendlytravel.com',
                                        fromName: currentUser?.name || 'Climate Friendly Travel',
                                        to: sponsor.email || '',
                                        subject: draftSubject,
                                        body: draftEmail,
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
