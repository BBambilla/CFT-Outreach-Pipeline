import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

export const KnowledgeBase: React.FC = () => {
  const { knowledgeBaseFiles, addKnowledgeBaseFile, removeKnowledgeBaseFile, role } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteFile = (file: { id: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this file? This can't be undone.")) return;
    
    if (supabase) {
      // Optimistic UI update
      removeKnowledgeBaseFile(file.id);
      
      // Background DB update
      supabase.from('knowledge_base_files').delete().eq('id', file.id).then(({ error }) => {
        if (error) {
          console.error('Failed to delete file', error);
          alert('Delete failed on the server.');
        }
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload delay
    setIsUploading(true);
    setTimeout(() => {
      addKnowledgeBaseFile({
        id: uuidv4(),
        title: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1000);
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-800">Knowledge Base</h1>
          <p className="text-slate-500 mt-1">Access central resources, guidelines, and PDF files.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`${role === 'coordinator' ? 'md:col-span-2' : 'md:col-span-3'} space-y-4`}>
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">Files & Documents</h2>
          
          {knowledgeBaseFiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {knowledgeBaseFiles.map(file => (
                  <li key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 cursor-pointer">
                      <div className="w-10 h-10 bg-brand-yellow/10 text-brand-yellow rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{file.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(file.uploadedAt).toLocaleDateString()} • {file.size ? Math.round(file.size / 1024) + ' KB' : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors">
                        <Download size={20} />
                      </button>
                      {role === 'coordinator' && (
                        <button 
                          onClick={(e) => handleDeleteFile(file, e)}
                          className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {role === 'coordinator' && (
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">Upload</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="space-y-4">
                <p className="text-xs text-slate-500 mb-4">You can now upload files to the knowledge base.</p>
                
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-brand-orange hover:bg-orange-50/10 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">
                      {isUploading ? 'Uploading...' : 'Click to select file'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PDF, DOCX, PNG, etc.</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
