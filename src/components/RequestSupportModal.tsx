import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface RequestSupportModalProps {
  onClose: () => void;
}

export const RequestSupportModal: React.FC<RequestSupportModalProps> = ({ onClose }) => {
  const { currentUser } = useAppContext();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    // Generate mailto link
    const to = "pratishtha@thesunprogram.com,bonnabambilla@gmail.com";
    const subjectLine = encodeURIComponent(`Support request: ${subject}`);
    const body = encodeURIComponent(`Name: ${currentUser?.name || 'Unknown'}\nCountry: ${currentUser?.country || 'Unknown'}\n\n${message}`);
    
    // Open email client
    window.location.href = `mailto:${to}?subject=${subjectLine}&body=${body}`;
    
    // Show confirmation temporarily, then close
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 4500);
  };

  if (isSent) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-green-100 text-sdg-green rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Almost there!</h3>
          <p className="text-slate-600 text-sm">
            Your email draft is ready — please press send in your email app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col h-[500px] max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-heading text-slate-800">Request Support</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                autoFocus
                placeholder="Briefly describe your request"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none text-sm"
              />
            </div>
            <div className="h-full flex flex-col pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide details about your support request..."
                className="flex-1 min-h-[200px] w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!subject.trim() || !message.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
