import React, { useState, useEffect, useRef } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { IoClose, IoBugSharp, IoSend } from 'react-icons/io5';
import { toast } from 'react-toastify';

const BugReportModal = ({ isOpen, onClose }) => {
  const [formSpreeState, handleSubmitToFormspree] = useForm("mgvkgqaq");
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const prevSubmittingRef = useRef(formSpreeState.submitting);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setMessage('');
      prevSubmittingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (prevSubmittingRef.current && !formSpreeState.submitting) {
      if (formSpreeState.succeeded) {
        toast.success("Bug report submitted! Thanks for your feedback.");
        onClose();
      } else if (formSpreeState.errors && formSpreeState.errors.length > 0) {
        formSpreeState.errors.forEach(error => {
          if (error.message) {
            toast.error(String(error.message));
          }
        });
        if (!formSpreeState.errors.some(e => e.field && e.message) && formSpreeState.errors.length > 0) {
          toast.error("Failed to submit. Please check the fields and try again.");
        }
      }
    }
    prevSubmittingRef.current = formSpreeState.submitting;
  }, [formSpreeState.submitting, formSpreeState.succeeded, formSpreeState.errors, onClose]);

  if (!isOpen) return null;

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('message', message);
    handleSubmitToFormspree(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl border border-orange-500/20 shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-orange-400 flex items-center">
            <IoBugSharp className="mr-2 text-xl" /> Report a Bug / Feedback
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-white/60 hover:text-white text-xl sm:text-2xl transition-colors p-1 hover:bg-white/10 rounded-full flex-shrink-0 ml-2"
            aria-label="Close bug report modal"
          >
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleLocalSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="bug-email" className="text-white font-semibold block mb-2 text-sm sm:text-base">
                Your Email <span className="text-orange-400">*</span>
              </label>
              <input
                id="bug-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                placeholder="you@example.com"
                required
                disabled={formSpreeState.submitting}
              />
              <ValidationError
                prefix="Email"
                field="email"
                errors={formSpreeState.errors}
                className="text-red-400 text-xs mt-1"
              />
            </div>

            <div>
              <label htmlFor="bug-message" className="text-white font-semibold block mb-2 text-sm sm:text-base">
                Bug Description / Feedback <span className="text-orange-400">*</span>
              </label>
              <textarea
                id="bug-message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="5"
                placeholder="Please describe the issue or your feedback in detail..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base resize-none"
                required
                disabled={formSpreeState.submitting}
              />
              <ValidationError
                prefix="Message"
                field="message"
                errors={formSpreeState.errors}
                className="text-red-400 text-xs mt-1"
              />
            </div>
            <p className="text-xs text-white/60">
              Please be as specific as possible. If it's a bug, steps to reproduce are very helpful!
            </p>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={formSpreeState.submitting || !email.trim() || !message.trim()}
                    className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2
                    ${formSpreeState.submitting || !email.trim() || !message.trim()
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'cursor-pointer btn-primary'
                    }`}
                >
                    <IoSend />
                    <span>{formSpreeState.submitting ? 'Submitting...' : 'Send Report'}</span>
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default BugReportModal;
