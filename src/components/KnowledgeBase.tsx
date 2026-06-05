import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Download, Lock, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const KnowledgeBase: React.FC = () => {
  const { knowledgeBaseFiles, addKnowledgeBaseFile, role } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'CFT2025') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
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
                    <button className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors">
                      <Download size={20} />
                    </button>
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
            {!isAuthenticated ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Lock size={16} />
                  <span className="text-sm font-medium">Administrator Upload</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Please enter the PIN to unlock file uploading.</p>
                
                <div>
                  <input
                    type="password"
                    placeholder="Enter PIN"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:border-brand-orange"
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-orange text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors hover:bg-orange-700"
                >
                  Verify
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-brand-green mb-2">
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    <span className="text-sm font-medium">Unlocked</span>
                  </div>
                </div>
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
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
