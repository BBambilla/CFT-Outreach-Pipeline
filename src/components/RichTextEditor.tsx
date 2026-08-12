import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Link2, Type, List } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLORS = ['#111827', '#e65124', '#0f5b89', '#16a34a', '#dc2626', '#7c3aed'];

// Convert plain text / markdown (from templates & drafts) into HTML on load
const mdToHtml = (t: string) => (t || '')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1155cc;">$1</a>')
  .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  .replace(/(?<!["'>])(https?:\/\/[^\s"'<]+)/g, '<a href="$1" style="color:#1155cc;">$1</a>')
  .replace(/\n/g, '<br>');

export const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return;
    const html = /<[a-z][\s\S]*>/i.test(value || '') ? (value || '') : mdToHtml(value || '');
    if (ref.current.innerHTML !== html) ref.current.innerHTML = html;
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const addLink = () => {
    const url = window.prompt('Paste the link (https://...)');
    if (url) exec('createLink', url.trim());
  };

  const tbBtn = 'px-2 py-1 rounded hover:bg-slate-200 text-slate-700 flex items-center';

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <style>{`[data-rte]:empty:before{content:attr(data-ph);color:#94a3b8;} [data-rte] ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; } [data-rte] ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }`}</style>
      <div className="flex items-center gap-1 flex-wrap border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className={tbBtn} title="Bold"><Bold size={15} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className={tbBtn} title="Italic"><Italic size={15} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addLink} className={tbBtn} title="Add link"><Link2 size={15} /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className={tbBtn} title="Bullet List"><List size={15} /></button>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <Type size={15} className="text-slate-400" />
        {COLORS.map((c) => (
          <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('foreColor', c)} title={c} className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div
        ref={ref}
        data-rte
        data-ph={placeholder || 'Write your message…'}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="min-h-[220px] p-3 text-sm text-slate-900 focus:outline-none leading-relaxed"
      />
    </div>
  );
};
