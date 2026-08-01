'use client';

import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, CheckCircle, Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AiLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  // Define SpeechRecognition dynamically to avoid SSR issues
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
        toast.success('Data logged successfully!');
        setText('');
      } else {
        toast.error(data.error || 'Failed to parse data');
      }
    } catch (err) {
      toast.error('An error occurred while communicating with the AI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white"
        title="AI Auto Log"
      >
        <Sparkles size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={20} />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">AI Auto Logger</h3>
              </div>
              <button 
                onClick={() => {
                  if (isListening) stopListening();
                  setIsOpen(false);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {!result ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Type or speak your daily logs. For example: <br/>
                    <span className="italic text-gray-700 dark:text-gray-300">"We sold 12 crates today for 50k, bought feed for 20k, and collected 4 crates."</span>
                  </p>
                  
                  <div className="relative">
                    <textarea
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter your farm logs here..."
                      className="w-full h-32 p-4 pb-12 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all outline-none"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute bottom-3 left-3 p-2 rounded-full transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Log Data
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle size={28} />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Successfully Logged</h4>
                    <p className="text-sm text-gray-500">The AI has parsed and saved your data.</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3 text-sm">
                    {result.sales && result.sales.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">🛒 Sales Logged:</span>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                          {result.sales.map((s: any, i: number) => (
                            <li key={i}>{s.quantity} {s.type} for ₦{s.totalAmount?.toLocaleString()} on {s.date}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.expenses && result.expenses.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">💸 Expenses Logged:</span>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                          {result.expenses.map((e: any, i: number) => (
                            <li key={i}>{e.category}: ₦{e.amount?.toLocaleString()} on {e.date}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.eggs && result.eggs.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">🥚 Eggs Logged:</span>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
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
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all"
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
