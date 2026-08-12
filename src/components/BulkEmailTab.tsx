import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Mail, CheckSquare, Square, Paperclip, X, AlertCircle, Play, Send } from 'lucide-react';
import { CcField } from './CcField';
import { RichTextEditor } from './RichTextEditor';

interface Recipient {
  id: string;
  name: string;
  email: string;
  country: string;
  selected: boolean;
  status: 'pending' | 'sending' | 'success' | 'error';
  errorMessage?: string;
}

export const BulkEmailTab: React.FC = () => {
  const { authEmail, role, currentUser } = useAppContext();
  const [pasteData, setPasteData] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newGroup, setNewGroup] = useState('CFT 2026');
  const [groupFilter, setGroupFilter] = useState('all');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('');
  const [cc, setCc] = useState('');
  const [sendAs, setSendAs] = useState<'self' | 'geoffrey'>('self');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{filename: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
  const [sendComplete, setSendComplete] = useState(false);
  const [isAddExtraOpen, setIsAddExtraOpen] = useState(false);

  useEffect(() => {
    const loadRecipients = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('bulk_recipients')
        .select('*')
        .order('country');
        
      if (error) {
        console.error('Error loading bulk recipients:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const mapped: any[] = data.map((row: any) => ({
          id: row.id || row.email,
          name: row.name || '',
          email: row.email,
          country: row.country || '',
          group: row.group_name || 'CFT 2025',
          selected: false,
          status: 'pending'
        }));
        setRecipients(mapped);
      }
    };
    loadRecipients();
  }, []);

  // Admin identity logic
  const getAdminIdentity = () => {
    let finalFrom = currentUser?.email || 'noreply@climatefriendlytravel.com';
    let finalFromName = currentUser?.name || 'Climate Friendly Travel';
    
    if (role === 'coordinator') {
      if (authEmail === 'pratishtha@cft-app.local') {
        finalFrom = 'pratishtha@thesunprogram.com';
        finalFromName = 'Pratishtha Parajuli';
      } else {
        finalFrom = 'olly@thesunprogram.com';
        finalFromName = 'Olly Wheatcroft';
      }
    }
    if (sendAs === 'geoffrey') {
      finalFrom = 'glipman@thesunprogram.com';
      finalFromName = 'Professor Geoffrey Lipman';
    }
    return { finalFrom, finalFromName };
  };

  const getSignature = () => {
    if (sendAs === 'geoffrey') {
      return {
        html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>Professor Geoffrey Lipman</div>
  <div>Creative Disruption Architect,</div>
  <div><strong>The SUN<sup>x</sup> Program</strong></div>
  <div><a href="mailto:glipman@thesunprogram.com" style="color:#1155cc;">glipman@thesunprogram.com</a></div>
  <div>+32495250789</div>
  <div style="margin-top:10px;"><a href="https://youtu.be/QW3byaVLrZM" style="color:#1155cc;">3 min Video About SUNx</a></div>
</div>`,
        plain: `Professor Geoffrey Lipman\nCreative Disruption Architect,\nThe SUNx Program\nglipman@thesunprogram.com\n+32495250789\n3 min Video About SUNx: https://youtu.be/QW3byaVLrZM`
      };
    }
    if (role === 'student' || role === 'rep') {
      return {
        html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>${currentUser?.name || ''}</div>
  <div>${currentUser?.country || ''} Chapter Lead</div>
  <div><strong>SUN<sup>x</sup> Malta</strong></div>
  <div><a href="https://www.thesunprogram.com" style="color:#1155cc;">https://www.thesunprogram.com</a></div>
  <div><a href="https://youtu.be/QW3byaVLrZM" style="color:#1155cc;">"Short Video About SUNx &amp; Climate Friendly Travel"</a></div>
</div>`,
        plain: `${currentUser?.name || ''}\n${currentUser?.country || ''} Chapter Lead\nSUNx Malta\nhttps://www.thesunprogram.com\n"Short Video About SUNx & Climate Friendly Travel": https://youtu.be/QW3byaVLrZM`
      };
    } else {
      if (authEmail === 'pratishtha@cft-app.local' || authEmail === 'pratishtha@thesunprogram.com') {
        return {
          html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>Pratishtha Parajuli</div>
  <div>Education Manager</div>
  <div><strong>SUN<sup>x</sup> Malta</strong></div>
  <div><a href="https://www.thesunprogram.com" style="color:#1155cc;">https://www.thesunprogram.com</a></div>
</div>`,
          plain: `Pratishtha Parajuli\nEducation Manager\nSUNx Malta\nhttps://www.thesunprogram.com`
        };
      }
      return {
        html: `<div style="font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.2;color:#808080;margin-top:16px;">
  <div>Olly Wheatcroft</div>
  <div><strong>SUN<sup>x</sup> Malta</strong></div>
  <div>Programme Manager</div>
  <div>m: +44 7765 132408</div>
  <div><a href="https://www.thesunprogram.com" style="color:#1155cc;">https://www.thesunprogram.com</a></div>
  <div><a href="https://youtu.be/QW3byaVLrZM" style="color:#1155cc;">"Short Video About SUNx &amp; Climate Friendly Travel"</a></div>
</div>`,
        plain: `Olly Wheatcroft\nSUNx Malta\nProgramme Manager\nm: +44 7765 132408\nhttps://www.thesunprogram.com\n"Short Video About SUNx & Climate Friendly Travel": https://youtu.be/QW3byaVLrZM`
      };
    }
  };

  const addRecipients = async (list: { name: string; email: string; country: string }[]) => {
    const clean = list.filter(x => x.email.includes('@') && !recipients.some(r => r.email.toLowerCase() === x.email.toLowerCase()));
    if (clean.length === 0) return;
    const { data, error } = await supabase.from('bulk_recipients').insert(clean.map(x => ({ name: x.name, email: x.email, country: x.country || '', group_name: newGroup }))).select();
    if (error) { alert('Could not save recipient(s): ' + error.message); return; }
    setRecipients(prev => [...prev, ...(data || []).map((row: any) => ({ id: row.id, name: row.name, email: row.email, country: row.country || '', group: row.group_name || newGroup, selected: true, status: 'pending' }))]);
  };

  const handleParse = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.split(/\r?\n/);
    const parsed: Recipient[] = [];
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const separator = line.includes('\t') ? '\t' : ',';
      const cols = line.split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
      
      const emailColIdx = cols.findIndex(c => c.includes('@'));
      if (emailColIdx === -1) return; // Skip if no email
      
      const email = cols[emailColIdx];
      let name = '';
      let country = '';
      
      if (emailColIdx > 0) {
        name = cols[emailColIdx - 1];
      }
      if (emailColIdx > 1) {
        country = cols[emailColIdx - 2];
      }
      
      // Only add if not already in the list
      if (!recipients.some(r => r.email.toLowerCase() === email.toLowerCase()) && !parsed.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        parsed.push({
          id: `recip-${index}-${Date.now()}`,
          name,
          email,
          country,
          selected: true,
          status: 'pending'
        });
      }
    });
    
    addRecipients(parsed); setPasteData('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `outreach/${Date.now()}-${safeName}`;
      
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      
      if (error) {
        console.error("Upload error:", error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      
      const { data } = supabase.storage.from('attachments').getPublicUrl(path);
      setAttachments(prev => [...prev, { filename: file.name, url: data.publicUrl }]);
    }
    
    setIsUploading(false);
    e.target.value = '';
  };

  const toggleRecipient = (id: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };
  
  const selectAll = (select: boolean) => {
    setRecipients(prev => prev.map(r => ((groupFilter === 'all' || (r as any).group === groupFilter) ? { ...r, selected: select } : r)));
  };

  const getPersonalizedContent = (recipient: Recipient, content: string) => {
    let myRole = 'Chapter Lead';
    if (role === 'coordinator') {
      myRole = authEmail === 'pratishtha@cft-app.local' ? 'Education Manager' : 'Programme Manager';
    }

    return content
      .replace(/\[Name\]/gi, recipient.name)
      .replace(/\[First name\]/gi, recipient.name)
      .replace(/\[Country\]/gi, recipient.country)
      .replace(/<Insert Country Name Here>/gi, recipient.country)
      .replace(/<your country>/gi, recipient.country)
      .replace(/\{country\}/gi, recipient.country)
      .replace(/\[Role\]/gi, myRole);
  };

  const generateHtml = (text: string) => {
    let htmlContent = text;

    const sig = getSignature();
    return `<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;color:#222;">${htmlContent}</div>${sig.html}`;
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSend = async () => {
    const toSend = recipients.filter(r => r.selected);
    if (toSend.length === 0 || !subject || !body) return;
    
    setIsSending(true);
    setSendComplete(false);
    setSendProgress({ current: 0, total: toSend.length, successes: 0, failures: 0 });
    
    const { finalFrom, finalFromName } = getAdminIdentity();
    const sig = getSignature();
    
    let successes = 0;
    let failures = 0;
    
    const updatedRecipients = [...recipients];

    for (let i = 0; i < toSend.length; i++) {
      const recipient = toSend[i];
      const recipIdx = updatedRecipients.findIndex(r => r.id === recipient.id);
      
      updatedRecipients[recipIdx].status = 'sending';
      setRecipients([...updatedRecipients]);
      setSendProgress(prev => ({ ...prev, current: i + 1 }));

      const pSubject = getPersonalizedContent(recipient, subject);
      const pBody = getPersonalizedContent(recipient, body);
      const pHtml = generateHtml(pBody);
      const plainText = `${pBody}\n\n${sig.plain}`;

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: finalFrom,
            fromName: finalFromName,
            to: recipient.email,
            cc: cc || undefined,
            subject: pSubject.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'),
            body: plainText,
            html: pHtml,
            attachments: attachments.length > 0 ? attachments : undefined
          })
        });

        if (response.ok) {
          successes++;
          updatedRecipients[recipIdx].status = 'success';
          supabase.rpc('log_sent_email', { p_to_email: recipient.email, p_to_name: recipient.name, p_cc: cc || null, p_subject: pSubject, p_body_html: pHtml, p_body_text: plainText, p_sent_by_email: finalFrom, p_sent_by_name: finalFromName, p_sponsor_id: null }).then(() => {}, () => {});
        } else {
          failures++;
          const respData = await response.json();
          updatedRecipients[recipIdx].status = 'error';
          updatedRecipients[recipIdx].errorMessage = respData.error || 'Unknown error';
        }
      } catch (err: any) {
        failures++;
        updatedRecipients[recipIdx].status = 'error';
        updatedRecipients[recipIdx].errorMessage = err.message;
      }
      
      setRecipients([...updatedRecipients]);
      if (i < toSend.length - 1) {
        await sleep(500); // Rate limit pause
      }
    }
    
    setSendProgress(prev => ({ ...prev, successes, failures }));
    setIsSending(false);
    setSendComplete(true);
  };

  const selectedCount = recipients.filter(r => r.selected).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-brand-orange" />
        <h1 className="text-2xl font-bold font-heading text-slate-800">Bulk Email</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        
        {/* Recipient Checklist */}
        {recipients.length > 0 && !isSending && !sendComplete && (
          <div className="space-y-4 border-b border-slate-200 pb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">1. Select Recipients</h2>
              <span className="text-sm font-medium text-brand-orange bg-orange-50 px-3 py-1 rounded-full">
                Sending to {selectedCount} of {recipients.length}
              </span>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => selectAll(true)} className="text-sm text-brand-orange hover:underline font-medium">Select All</button>
              <button onClick={() => selectAll(false)} className="text-sm text-slate-500 hover:underline font-medium">Deselect All</button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-semibold text-slate-500 uppercase">Show group:</label>
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="text-sm text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:border-brand-orange">
                <option value="all">All groups</option>
                {Array.from(new Set(recipients.map((r: any) => r.group).filter(Boolean))).map(g => (<option key={g as string} value={g as string}>{g as string}</option>))}
              </select>
              <span className="text-xs text-slate-400">({recipients.filter((r: any) => groupFilter === 'all' || r.group === groupFilter).length} shown)</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-500 uppercase">Add recipients (saved permanently)</p>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-500">Add to group:</label>
                <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)} className="text-sm text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:border-brand-orange">
                  <option value="CFT 2026">CFT 2026</option>
                  <option value="CFT 2025">CFT 2025</option>
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" className="flex-1 min-w-[130px] border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" />
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@domain.com" className="flex-1 min-w-[160px] border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" />
                <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Country (optional)" className="flex-1 min-w-[110px] border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" />
                <button onClick={() => { addRecipients([{ name: newName.trim(), email: newEmail.trim(), country: newCountry.trim() }]); setNewName(''); setNewEmail(''); setNewCountry(''); }} className="bg-brand-orange text-white px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 whitespace-nowrap">+ Add person</button>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Or paste a list — one per line, <code className="bg-slate-100 px-1 rounded">Country, Full Name, Email</code>:</p>
                <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} placeholder="India, Priya Sharma, priya@email.com" className="w-full h-24 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" />
                <button onClick={handleParse} className="mt-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-colors">Add pasted list</button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {recipients.filter((r: any) => groupFilter === 'all' || r.group === groupFilter).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                  <button onClick={() => toggleRecipient(r.id)} className="text-slate-400 hover:text-brand-orange">
                    {r.selected ? <CheckSquare className="w-5 h-5 text-brand-orange" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {r.name || 'No name'} <span className="text-slate-500 font-normal">({r.email})</span>
                    </p>
                    {r.country && <p className="text-xs text-slate-500">{r.country}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Composition */}
        {!isSending && !sendComplete && (
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">2. Compose Message</h2>
            <p className="text-sm text-slate-500 mb-2">
              Use <code className="bg-slate-100 px-1 py-0.5 rounded">[Name]</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">[Country]</code> to personalize.
            </p>
            
            {role === 'coordinator' && (
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Send as:</label>
                <select value={sendAs} onChange={(e) => setSendAs(e.target.value as 'self' | 'geoffrey')} className="text-sm text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:border-brand-orange">
                  <option value="self">Myself</option>
                  <option value="geoffrey">Professor Geoffrey Lipman</option>
                </select>
              </div>
            )}
            <input 
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-medium"
            />
            <CcField value={cc} onChange={setCc} />
            
            <RichTextEditor value={body} onChange={setBody} placeholder="Message body..." />
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Signature (added automatically to every email):</p>
              <div dangerouslySetInnerHTML={{ __html: getSignature().html }} />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-slate-600 hover:text-brand-orange flex items-center bg-slate-100 hover:bg-orange-50 px-4 py-2 rounded-md transition-colors border border-slate-200 shadow-sm"
                  disabled={isUploading}
                >
                  <Paperclip className="w-4 h-4 mr-1.5" /> {isUploading ? 'Uploading...' : 'Attach document'}
                </button>
                
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    {attachments.map((att, i) => (
                      <span key={i} className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-2 py-1 shadow-sm">
                        <Paperclip className="w-3.5 h-3.5" /> 
                        <span className="truncate max-w-[150px]">{att.filename}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500 ml-1 rounded-full hover:bg-slate-200 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Add Extra Recipients (moved into Select Recipients above) */}
        {false && !isSending && !sendComplete && (
          <div className="space-y-4 pt-4 border-b border-slate-200 pb-6">
            <button 
              onClick={() => setIsAddExtraOpen(!isAddExtraOpen)}
              className="flex items-center text-sm font-medium text-brand-orange hover:text-orange-600 transition-colors"
            >
              {isAddExtraOpen ? '-' : '+'} Add extra recipients (Paste from Excel/CSV)
            </button>
            
            {isAddExtraOpen && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-slate-500">
                  Paste rows from Excel or Sheets. Format should be <code className="bg-slate-100 px-1 py-0.5 rounded">Name, email@domain.com</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">Country, Name, email@domain.com</code> (comma or tab separated).
                </p>
                <textarea
                  className="w-full h-32 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                  placeholder="Malta, John Doe, john@example.com..."
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                />
                <button 
                  onClick={handleParse}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  Parse Recipients
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Preview */}
        {!isSending && !sendComplete && recipients.length > 0 && selectedCount > 0 && subject && body && (
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-800">3. Preview (First Recipient)</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="mb-4 pb-4 border-b border-slate-200">
                <p className="text-sm text-slate-600"><span className="font-semibold">To:</span> {recipients.find(r => r.selected)?.name} &lt;{recipients.find(r => r.selected)?.email}&gt;</p>
                <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Subject:</span> {getPersonalizedContent(recipients.find(r => r.selected)!, subject)}</p>
              </div>
              <div 
                className="text-sm text-slate-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: generateHtml(getPersonalizedContent(recipients.find(r => r.selected)!, body))
                }} 
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSend}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2 transition-colors"
              >
                <Send className="w-5 h-5" />
                Send to {selectedCount} recipients
              </button>
            </div>
          </div>
        )}

        {/* Sending State */}
        {isSending && (
          <div className="space-y-6 py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Sending Emails...</h2>
              <p className="text-slate-500 mt-2">Please do not close this tab.</p>
              <p className="text-brand-orange font-semibold mt-4 text-lg">
                {sendProgress.current} of {sendProgress.total} sent
              </p>
            </div>
          </div>
        )}

        {/* Complete State */}
        {sendComplete && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Bulk Send Complete</h2>
              <p className="text-green-700">Successfully sent {sendProgress.successes} emails.</p>
              {sendProgress.failures > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {sendProgress.failures} Failed Deliveries
                  </p>
                  <ul className="mt-2 text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {recipients.filter(r => r.status === 'error').map(r => (
                      <li key={r.id}>&bull; {r.email}: {r.errorMessage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSendComplete(false);
                    setRecipients(prev => prev.map(r => ({ ...r, selected: false })));
                    setSendProgress({ current: 0, total: 0, successes: 0, failures: 0 });
                  }}
                  className="bg-brand-orange text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:opacity-90 transition-colors"
                >
                  Send to more recipients
                </button>
                <button
                  onClick={() => {
                    setSendComplete(false);
                    setRecipients(prev => prev.map(r => ({ ...r, selected: false, status: undefined, errorMessage: undefined })));
                    setSubject('');
                    setBody('');
                    setAttachments([]);
                    setPasteData('');
                    setSendProgress({ current: 0, total: 0, successes: 0, failures: 0 });
                  }}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Start fresh (clear message)
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};
