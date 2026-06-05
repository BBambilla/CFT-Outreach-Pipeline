import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Interaction, SponsorStatus } from '../types';
import { X, Search, Sparkles, Send, FileText, ChevronRight, PenSquare, ArrowRight, Trash2 } from 'lucide-react';

export const SponsorDetailModal: React.FC<{ sponsorId: string, onClose: () => void }> = ({ sponsorId, onClose }) => {
  const { sponsors, updateSponsor, deleteSponsor, addInteraction, interactions, templates, resources, currentUser, students } = useAppContext();
  const sponsor = sponsors.find(s => s.id === sponsorId);
  const sponsorInteractions = interactions.filter(i => i.sponsorId === sponsorId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [activeTab, setActiveTab] = useState<'Overview' | 'Outreach' | 'Activity log' | 'Files'>('Overview');
  
  // States for AI interactions
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [draftEmail, setDraftEmail] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySummary, setReplySummary] = useState<any>(null);
  
  const [researchSteps, setResearchSteps] = useState<string[]>([]);
  const [isResearching, setIsResearching] = useState(false);

  const [newActivityType, setNewActivityType] = useState('Call');
  const [newActivityDetails, setNewActivityDetails] = useState('');

  const [newFileType, setNewFileType] = useState('File sent');
  const [newFileName, setNewFileName] = useState('');

  if (!sponsor) return null;

  const isOwner = sponsor.assignedStudentId === currentUser?.id;
  const owner = students.find(s => s.id === sponsor.assignedStudentId);

  const relevantResources = resources.filter(r => r.tags.includes(sponsor.status));

  const handlePersonalize = async () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: template.body,
          rationale: sponsor.rationale,
          organization: sponsor.organization,
          recentActivity: sponsorInteractions[0]?.summary
        })
      });
      const data = await response.json();
      setDraftEmail(data.result);
    } catch (e) {
      console.error(e);
      // Fallback if no backend
      setDraftEmail(`Hi ${sponsor.contactName || '[Name]'},\n\nI am reaching out because... \n\n[Fallback: Server not connected]\n\nBest,`);
    }
    setIsGenerating(false);
  };

  const handleSummarizeReply = async () => {
    if (!replyText) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText: replyText })
      });
      const data = await response.json();
      setReplySummary(data);
    } catch (e) {
      console.error(e);
      setReplySummary({ summary: "Fallback: AI server offline.", suggestedStatus: "In Conversation", suggestedAction: "Reply manually" });
    }
    setIsGenerating(false);
  };

  const handleResearchHelper = async () => {
    setIsResearching(true);
    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization: sponsor.organization })
      });
      const data = await response.json();
      setResearchSteps(data || []);
    } catch (e) {
      console.error(e);
      setResearchSteps(['Check website /about page', 'Search LinkedIn for CSR manager', 'Look for their sustainability report']);
    }
    setIsResearching(false);
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
                {(['Overview', 'Outreach', 'Activity log', 'Files'] as const).map(tab => (
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
                  {isOwner && sponsor.status === 'To Research' && (
                    <div className="bg-brand-canary/10 border border-brand-canary/30 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold font-heading text-slate-800 flex items-center"><Search className="w-4 h-4 mr-1.5" /> Missing Information</h4>
                          <p className="text-sm text-slate-600 mt-1">Add contact name and email to move this to "Ready to Contact".</p>
                        </div>
                        <button 
                          onClick={handleResearchHelper}
                          disabled={isResearching}
                          className="bg-white border border-brand-canary/50 text-slate-800 px-3 py-1.5 rounded text-sm font-semibold hover:bg-brand-canary/5 transition-colors flex items-center"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-orange" />
                          {isResearching ? 'Searching...' : 'Suggest research steps'}
                        </button>
                      </div>
                      
                      {researchSteps.length > 0 && (
                        <div className="mt-4 bg-white rounded border border-blue-100 p-3">
                          <ul className="space-y-2">
                            {researchSteps.map((step, i) => (
                              <li key={i} className="flex items-start text-sm text-gray-700">
                                <div className="w-4 h-4 border border-gray-300 rounded-sm mr-2.5 mt-0.5 flex-shrink-0"></div>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

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
                        <option value="Sponsorships">Sponsorships</option>
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
                        
                        {!draftEmail ? (
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
                              disabled={!selectedTemplateId || isGenerating}
                              className="bg-brand-yellow/10 border border-brand-yellow/30 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold font-heading hover:bg-brand-yellow/20 transition-colors disabled:opacity-50 flex items-center"
                            >
                              {isGenerating ? 'Generating...' : <><Sparkles className="w-4 h-4 mr-2 text-brand-orange" /> Personalize</>}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in duration-300">
                            <textarea 
                              value={draftEmail}
                              onChange={(e) => setDraftEmail(e.target.value)}
                              rows={10}
                              className="w-full text-sm text-slate-900 border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:border-brand-orange leading-relaxed"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setDraftEmail('')} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">Discard</button>
                              <button 
                                onClick={() => {
                                  addInteraction({ sponsorId, type: 'Email sent', date: new Date().toISOString(), summary: "Sent personalized cold email." });
                                  updateSponsor(sponsorId, { status: 'Contacted', lastContactedAt: new Date().toISOString() });
                                  setDraftEmail('');
                                }}
                                className="bg-brand-orange text-white px-4 py-1.5 rounded text-sm font-semibold font-heading hover:bg-orange-700 flex items-center"
                              >
                                <Send className="w-3.5 h-3.5 mr-1.5" /> Send via email client
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold font-heading text-slate-900 mb-3 flex items-center">
                          <Sparkles className="w-4 h-4 mr-2 text-brand-orange" />
                          Summarize Reply
                        </h3>
                        <p className="text-slate-500 mb-3">Paste a long reply from the sponsor to get a summary and recommended next steps.</p>
                        <textarea 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Paste sponsor's email text here..."
                          rows={4}
                          className="w-full border border-slate-200 rounded-md p-2.5 mb-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                        />
                        <div className="flex justify-start">
                          <button 
                            onClick={handleSummarizeReply}
                            disabled={!replyText || isGenerating}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            {isGenerating ? 'Analyzing...' : 'Summarize'}
                          </button>
                        </div>

                        {replySummary && (
                          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in">
                            <div className="mb-3">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</span>
                              <p className="text-slate-800 mt-1">{replySummary.summary}</p>
                            </div>
                            <div className="flex items-center gap-4 border-t border-slate-200 pt-3 text-sm">
                              <div><span className="text-slate-500">Next status:</span> <span className="font-medium text-slate-900">{replySummary.suggestedStatus}</span></div>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <div><span className="text-slate-500">Action:</span> <span className="font-medium text-slate-900">{replySummary.suggestedAction}</span></div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button 
                                onClick={() => {
                                  updateSponsor(sponsorId, { status: replySummary.suggestedStatus as SponsorStatus });
                                  addInteraction({ sponsorId, type: 'Email received', date: new Date().toISOString(), summary: replySummary.summary });
                                  setReplySummary(null);
                                  setReplyText('');
                                }}
                                className="bg-brand-orange text-white px-3 py-1.5 text-xs font-semibold rounded shadow-sm hover:bg-orange-700"
                              >
                                Log & Update Status
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {!isOwner && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                      <p>You can only draft emails or summarize replies for leads assigned to you.</p>
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
