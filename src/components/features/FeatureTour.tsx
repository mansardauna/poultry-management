'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, Search, Egg, Mic, Printer, Building2 } from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  highlightIcon: any;
  targetQuery: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Egg Production & Collection Logs',
    subtitle: 'Daily Crate Audits & Laying Records',
    description: 'This is the Eggs module navigation! Access daily egg lay logs, track good vs cracked eggs, and auto-convert laying counts into crates (30 eggs/crate).',
    highlightIcon: Egg,
    targetQuery: '[data-tour="eggs-nav"]',
    position: 'right'
  },
  {
    title: 'AI Voice & Text Auto-Logger',
    subtitle: 'Hands-Free Voice Log Entry',
    description: 'This is the AI Auto-Log button! Speak or type raw notes like "We sold 12 crates today for 50k" and AI automatically parses & saves your records in 1 click.',
    highlightIcon: Mic,
    targetQuery: '[data-tour="ai-logger-btn"]',
    position: 'top'
  },
  {
    title: 'Print & Export Financial Reports',
    subtitle: 'One-Click Financial & Stock PDF Export',
    description: 'You can print or export comprehensive farm reports here! Click to print your dashboard analytics, revenue summaries, and expense ledgers instantly.',
    highlightIcon: Printer,
    targetQuery: '[data-tour="print-report-btn"]',
    position: 'bottom'
  },
  {
    title: 'Global Search & Branch Switcher',
    subtitle: 'Quick Module Search & Coop Access',
    description: 'Use this top search bar to jump to any farm module instantly (Batches, Feed, Staff, Invoices) or switch active regional farm branches.',
    highlightIcon: Search,
    targetQuery: '[data-tour="search-bar"]',
    position: 'bottom'
  },
  {
    title: 'Enterprise Hub & CCTV Surveillance',
    subtitle: 'Multi-Farm Matrix & Security Gateway',
    description: 'Access your multi-farm branch matrix, white-label cooperative branding, 24/7 priority vet hotline, and WebRTC CCTV live security streams here.',
    highlightIcon: Building2,
    targetQuery: '[data-tour="enterprise-nav"]',
    position: 'right'
  }
];

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // 1. Strict localStorage check on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('pfms_guided_tour_completed');
      // ONLY auto-open if explicitly not completed
      if (tourCompleted !== 'true') {
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Listen for manual re-trigger event
  useEffect(() => {
    const handleReTrigger = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener('pfms_trigger_tour', handleReTrigger);
    return () => window.removeEventListener('pfms_trigger_tour', handleReTrigger);
  }, []);

  // Update target element highlight bounds on step change
  useEffect(() => {
    if (!isOpen) return;

    const updateTargetBounds = () => {
      const step = TOUR_STEPS[currentStepIndex];
      if (step?.targetQuery) {
        const el = document.querySelector(step.targetQuery);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          setTargetRect(null);
        }
      }
    };

    updateTargetBounds();
    window.addEventListener('resize', updateTargetBounds);
    return () => window.removeEventListener('resize', updateTargetBounds);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pfms_guided_tour_completed', 'true');
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const Icon = currentStep.highlightIcon;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto font-sans animate-in fade-in duration-200">
      {/* Dynamic Cutout Spotlight Overlay: Box shadow 9999px creates dark backdrop around target without covering target itself */}
      {targetRect ? (
        <div 
          onClick={handleComplete}
          className="absolute border-2 border-indigo-500 ring-4 ring-indigo-500/50 rounded-xl transition-all duration-300 pointer-events-auto z-[101] cursor-pointer"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
          }}
        />
      ) : (
        <div 
          onClick={handleComplete}
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] transition-opacity" 
        />
      )}

      {/* Tour Popover Card */}
      <div 
        className="absolute z-[102] max-w-sm sm:max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300"
        style={
          targetRect ? {
            top: currentStep.position === 'top' 
              ? `${Math.max(20, targetRect.top - 240)}px` 
              : currentStep.position === 'bottom'
              ? `${Math.min(window.innerHeight - 260, targetRect.bottom + 16)}px`
              : `${Math.max(20, Math.min(window.innerHeight - 260, targetRect.top))}px`,
            left: currentStep.position === 'right' 
              ? `${Math.min(window.innerWidth - 380, targetRect.right + 16)}px` 
              : currentStep.position === 'left'
              ? `${Math.max(20, targetRect.left - 380)}px`
              : `${Math.max(20, Math.min(window.innerWidth - 380, targetRect.left))}px`,
          } : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }
        }
      >
        {/* Card Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Skip Tour"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5 leading-tight">{currentStep.title}</h3>
              <p className="text-[11px] text-indigo-300 font-medium">{currentStep.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {currentStep.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex 
                    ? 'w-6 bg-indigo-600' 
                    : idx < currentStepIndex 
                    ? 'w-1.5 bg-emerald-500' 
                    : 'w-1.5 bg-slate-200'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              onClick={handleComplete}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer px-2"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStepIndex === TOUR_STEPS.length - 1 ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
