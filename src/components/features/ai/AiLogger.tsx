'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle, Mic, MicOff, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function AiLogger() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [tier, setTier] = useState('free');

  React.useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setTier(match[1]);
  }, [isOpen]);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    
    recognition.start();
    (window as any).activeSpeechRecognition = recognition;
  };

  const stopListening = () => {
    if ((window as any).activeSpeechRecognition) {
      (window as any).activeSpeechRecognition.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (isListening) stopListening();

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.parsed);
        toast.success('Data logged successfully');
        setText('');
      } else {
        toast.error(data.error || 'Failed to parse data');
      }
    } catch (err) {
      toast.error('An error occurred while logging record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        data-tour="ai-logger-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white cursor-pointer"
        title="Voice & Text Logger"
      >
        <Mic size={22} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText size={20} />
                <h3 className="font-extrabold text-base text-slate-900">Voice & Quick Text Logger</h3>
              </div>
              <button 
                onClick={() => {
                  if (isListening) stopListening();
                  setIsOpen(false);
                }}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {tier === 'free' ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
                    <Mic size={28} />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">Voice & Quick Text Logger</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Automatically parse voice recordings and raw notes into farm logs, sales, and feed records with Commercial Pro.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/dashboard/settings?tab=subscription');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Upgrade to Commercial Pro (₦15,000/mo)
                    </button>
                  </div>
                </div>
              ) : !result ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">
                    Type or speak your daily logs. For example: <br/>
                    <span className="italic text-slate-700 font-semibold">&quot;We sold 12 crates today for 50k, bought feed for 20k, and collected 4 crates.&quot;</span>
                  </p>
                  
                  <div className="relative">
                    <textarea
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter your farm operational logs here..."
                      className="w-full h-32 p-4 pb-12 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all outline-none font-medium text-sm"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute bottom-3 left-3 p-2 rounded-xl transition-colors cursor-pointer ${
                        isListening 
                          ? 'bg-red-100 text-red-600 animate-pulse' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={isListening ? "Stop listening" : "Start speaking"}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!text.trim() || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Log Data
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle size={28} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Successfully Logged</h4>
                    <p className="text-xs text-slate-500">System parsed and recorded your operational data.</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs border border-slate-200">
                    {result.sales && result.sales.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">Sales Logged:</span>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {result.sales.map((s: any, i: number) => (
                            <li key={i}>{s.quantity} {s.type} for ₦{s.totalAmount?.toLocaleString()} on {s.date}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.expenses && result.expenses.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">Expenses Logged:</span>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {result.expenses.map((e: any, i: number) => (
                            <li key={i}>{e.category}: ₦{e.amount?.toLocaleString()} on {e.date}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.eggs && result.eggs.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">Eggs Logged:</span>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {result.eggs.map((e: any, i: number) => (
                            <li key={i}>{e.goodEggs} good, {e.crackedEggs || 0} cracked on {e.date}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setResult(null);
                        setIsOpen(false);
                      }}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
