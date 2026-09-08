'use strict';
'use client';

import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does the AI prediction model work for egg yields?",
    answer: "Our AI algorithm analyzes historical flock data, daily feed consumption, water intake, temperature, and breed-specific laying curves to accurately forecast egg production 7–14 days in advance, alerting you to low-performance batches before yields drop."
  },
  {
    question: "Can I integrate this with my current CCTV cameras?",
    answer: "Yes! PFMS supports standard RTSP, ONVIF, and IP camera feeds. Our AI surveillance engine connects directly to your existing CCTV streams to detect nighttime predators, flock distress, and unauthorized human motion."
  },
  {
    question: "What kind of support do you offer?",
    answer: "Commercial Pro users receive 24/7 dedicated WhatsApp support, priority technician hotline, and automated daily AI report summaries delivered straight to management."
  },
  {
    question: "Is there a free trial or free tier available?",
    answer: "Yes! You can start on our Free Starter Plan immediately with zero credit card required. Free tier includes up to 1 branch, 2 staff members, full flock tracking, and inventory logs."
  },
  {
    question: "How do customer invoices and online payments work?",
    answer: "PFMS automatically generates professional customer invoices with built-in Paystack & Stripe payment links. Once a customer pays online or you mark it as paid offline, the invoice automatically updates your financial ledger and logs a verified sale."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            Everything you need to know about managing your poultry farm with PFMS AI.
          </p>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden shadow-sm ${
                  isOpen ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 focus:outline-none"
                >
                  <span className="font-bold text-slate-800 text-base sm:text-lg">{faq.question}</span>
                  <div className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                    isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
