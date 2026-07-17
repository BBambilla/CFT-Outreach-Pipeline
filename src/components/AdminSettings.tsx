import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users2, Plus, Trash2, FileText, Save } from 'lucide-react';

// ---------- Section 1: Team & Quick Cc ----------
const TeamSection: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('team_contacts').select('*').order('sort_order');
    setContacts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const n = name.trim(), e = email.trim();
    if (!n || !e) { setMsg('Enter both a name and an email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setMsg('That email doesn’t look valid.'); return; }
    setSaving(true); setMsg('');
    const nextOrder = contacts.reduce((m, c) => Math.max(m, c.sort_order || 0), 0) + 10;
    const { error } = await supabase.from('team_contacts').insert({ name: n, email: e, sort_order: nextOrder });
    setSaving(false);
    if (error) { setMsg('Could not add: ' + error.message); return; }
    setName(''); setEmail(''); setMsg(`Added ${n}.`); load();
  };

  const remove = async (c: any) => {
    if (!window.confirm(`Remove ${c.name} (${c.email}) from Quick Cc?`)) return;
    const { error } = await supabase.from('team_contacts').delete().eq('id', c.id);
    if (error) { setMsg('Could not remove: ' + error.message); return; }
    setMsg(`Removed ${c.name}.`); load();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
          <Users2 className="w-5 h-5 mr-2 text-slate-500" /> Team &amp; Quick Cc list
        </h2>
        <p className="text-xs text-slate-500 mt-1">These people appear as one-click <b>Quick Cc</b> buttons when composing or bulk-emailing. Add or remove anyone here — no code needed.</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sam" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="sam@thesunprogram.com" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
          </div>
          <button onClick={add} disabled={saving} className="text-sm font-bold text-white bg-brand-orange hover:opacity-90 px-4 py-2 rounded-md flex items-center gap-1.5 disabled:opacity-50"><Plus size={15} /> Add</button>
        </div>
        {msg && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">{msg}</p>}
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 text-sm text-slate-500 text-center">Loading…</div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">No team contacts yet.</div>
          ) : contacts.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                <span className="text-sm text-slate-500 ml-2 truncate">{c.email}</span>
              </div>
              <button onClick={() => remove(c)} title="Remove" className="text-slate-400 hover:text-white hover:bg-red-500 rounded-md p-1.5 transition-colors"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- Section 2: Email Templates ----------
const TemplatesSection: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('templates').select('*').order('title');
    setTemplates(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (t: any) => { setOpenId(t.id); setDraft({ ...t }); setMsg(''); };
  const close = () => { setOpenId(null); setDraft(null); };

  const save = async () => {
    if (!draft.title?.trim()) { setMsg('Give the template a title.'); return; }
    setSaving(true); setMsg('');
    const { error } = await supabase.from('templates').update({
      title: draft.title, category: draft.category || 'General', subject: draft.subject || '',
      body: draft.body || '', active: draft.active !== false
    }).eq('id', draft.id);
    setSaving(false);
    if (error) { setMsg('Could not save: ' + error.message); return; }
    setMsg('Saved.'); close(); load();
  };

  const addNew = async () => {
    const id = 'tpl-' + Date.now();
    const row = { id, title: 'New template', category: 'General', subject: '', body: '', active: true };
    const { error } = await supabase.from('templates').insert(row);
    if (error) { setMsg('Could not create: ' + error.message); return; }
    await load(); openEdit(row);
  };

  const remove = async (t: any) => {
    if (!window.confirm(`Delete template "${t.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('templates').delete().eq('id', t.id);
    if (error) { setMsg('Could not delete: ' + error.message); return; }
    setMsg('Deleted.'); close(); load();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-slate-500" /> Email Templates
          </h2>
          <p className="text-xs text-slate-500 mt-1">Edit the subject and wording of your outreach templates. Use <code className="bg-slate-100 px-1 rounded">[link text](https://…)</code> to add a link.</p>
        </div>
        <button onClick={addNew} className="text-sm font-bold text-white bg-brand-orange hover:opacity-90 px-3 py-1.5 rounded-md flex items-center gap-1.5"><Plus size={15} /> New template</button>
      </div>
      <div className="p-4 space-y-2">
        {msg && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">{msg}</p>}
        {loading ? (
          <div className="p-4 text-sm text-slate-500 text-center">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">No templates yet.</div>
        ) : templates.map(t => (
          <div key={t.id} className="border border-slate-200 rounded-lg">
            {openId !== t.id ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-800">{t.title}</span>
                  {t.category && <span className="text-[11px] text-slate-500 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">{t.category}</span>}
                  {t.active === false && <span className="text-[11px] text-amber-600 ml-2">(hidden)</span>}
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{t.subject || '(no subject)'}</p>
                </div>
                <button onClick={() => openEdit(t)} className="text-xs font-bold text-brand-orange hover:underline shrink-0">Edit</button>
              </div>
            ) : (
              <div className="p-4 space-y-2 bg-orange-50/30">
                <div><label className="text-[11px] font-bold text-slate-500 uppercase">Title (internal name)</label>
                  <input value={draft.title || ''} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange font-medium" /></div>
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[140px]"><label className="text-[11px] font-bold text-slate-500 uppercase">Category</label>
                    <input value={draft.category || ''} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="e.g. Registry" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" /></div>
                  <label className="flex items-center gap-2 text-sm text-slate-600 pb-2"><input type="checkbox" checked={draft.active !== false} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Show in the template list</label>
                </div>
                <div><label className="text-[11px] font-bold text-slate-500 uppercase">Subject</label>
                  <input value={draft.subject || ''} onChange={e => setDraft({ ...draft, subject: e.target.value })} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" /></div>
                <div><label className="text-[11px] font-bold text-slate-500 uppercase">Message body</label>
                  <textarea value={draft.body || ''} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={12} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange font-mono leading-relaxed" />
                  <p className="text-[11px] text-slate-400 mt-1">Tip: <code className="bg-slate-100 px-1 rounded">[CFT Registry](https://climatefriendly.travel/register)</code> becomes a clickable link.</p></div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={save} disabled={saving} className="text-xs font-bold text-white bg-brand-orange hover:opacity-90 px-4 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50"><Save size={13} /> {saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={close} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5">Cancel</button>
                  <button onClick={() => remove(t)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 ml-auto flex items-center gap-1"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminSettings: React.FC = () => {
  return (
    <div className="mt-8 flex-1 w-full max-w-3xl space-y-6">
      <TeamSection />
      <TemplatesSection />
    </div>
  );
};
