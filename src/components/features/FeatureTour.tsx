'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X, CheckCircle2, Search, Egg, Mic, Printer, Building2 } from 'lucide-react';

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
    description: 'Access daily egg lay logs, track good vs cracked eggs, and convert laying counts into crates (30 eggs/crate).',
    highlightIcon: Egg,
    targetQuery: '[data-tour="eggs-nav"]',
    position: 'right'
  },
  {
    title: 'Voice & Quick Text Logger',
    subtitle: 'Hands-Free Record Entry',
    description: 'Speak or type raw operational notes like "We sold 12 crates today for 50k" and the system parses and records your entries instantly.',
    highlightIcon: Mic,
    targetQuery: '[data-tour="ai-logger-btn"]',
    position: 'top'
  },
  {
    title: 'Print & Export Reports',
    subtitle: 'Financial & Inventory Document Export',
    description: 'Export comprehensive farm reports. Print dashboard analytics, revenue summaries, and expense ledgers.',
    highlightIcon: Printer,
    targetQuery: '[data-tour="print-report-btn"]',
    position: 'bottom'
  },
  {
    title: 'Global Search & Module Access',
    subtitle: 'Quick Navigation & Record Search',
    description: 'Use the top search bar to jump to any farm module (Batches, Feed, Staff, Invoices) or search active branch records.',
    highlightIcon: Search,
    targetQuery: '[data-tour="search-bar"]',
    position: 'bottom'
  },
  {
    title: 'Enterprise Hub & Operations Gateway',
    subtitle: 'Multi-Farm Matrix & Security Oversight',
    description: 'Access multi-farm branch management, cooperative branding, priority vet hotline, and WebRTC CCTV live security streams.',
    highlightIcon: Building2,
    targetQuery: '[data-tour="enterprise-nav"]',
    position: 'right'
  }
];

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Check localStorage on load (Only trigger if onboarding is not active)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('pfms_guided_tour_completed');
      const searchParams = new URLSearchParams(window.location.search);
      const isOnboardingUrl = searchParams.get('onboarding') === 'true';
      const hasDismissedOnboarding = localStorage.getItem('pfms_onboarded_dismissed') === 'true' || localStorage.getItem('pfms_branch_setup_completed') === 'true';

      if (tourCompleted !== 'true' && !isOnboardingUrl && hasDismissedOnboarding) {
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

  // Calculate safe styles to ensure popover buttons are NEVER cut off on mobile
  const popoverStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: '20px',
        left: '16px',
        right: '16px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '85vh',
        zIndex: 102
      }
    : targetRect ? {
        position: 'fixed',
        top: currentStep.position === 'top' 
          ? `${Math.max(20, targetRect.top - 240)}px` 
          : currentStep.position === 'bottom'
          ? `${Math.min(window.innerHeight - 280, targetRect.bottom + 16)}px`
          : `${Math.max(20, Math.min(window.innerHeight - 280, targetRect.top))}px`,
        left: currentStep.position === 'right' 
          ? `${Math.min(window.innerWidth - 420, targetRect.right + 16)}px` 
          : currentStep.position === 'left'
          ? `${Math.max(20, targetRect.left - 420)}px`
          : `${Math.max(20, Math.min(window.innerWidth - 420, targetRect.left))}px`,
        zIndex: 102
      } : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 102
      };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto font-sans animate-in fade-in duration-200">
      {/* Dynamic 4-Panel Cutout Spotlight Overlay (Clean 35% Opacity Backdrop, Target Area is 100% Transparent) */}
      {targetRect ? (
        <>
          {/* Top Panel */}
          <div 
            onClick={handleComplete}
            className="fixed bg-slate-950/35 backdrop-blur-[1px] transition-all duration-300 z-[100] cursor-pointer"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${Math.max(0, targetRect.top - 6)}px`,
            }}
          />
          {/* Bottom Panel */}
          <div 
            onClick={handleComplete}
            className="fixed bg-slate-950/35 backdrop-blur-[1px] transition-all duration-300 z-[100] cursor-pointer"
            style={{
              top: `${Math.min(window.innerHeight, targetRect.bottom + 6)}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left Panel */}
          <div 
            onClick={handleComplete}
            className="fixed bg-slate-950/35 backdrop-blur-[1px] transition-all duration-300 z-[100] cursor-pointer"
            style={{
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left - 6)}px`,
              height: `${targetRect.height + 12}px`,
            }}
          />
          {/* Right Panel */}
          <div 
            onClick={handleComplete}
            className="fixed bg-slate-950/35 backdrop-blur-[1px] transition-all duration-300 z-[100] cursor-pointer"
            style={{
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: `${Math.min(window.innerWidth, targetRect.right + 6)}px`,
              right: 0,
              height: `${targetRect.height + 12}px`,
            }}
          />

          {/* Highlight Ring around Target (Non-Obscuring) */}
          <div 
            className="fixed border-2 border-indigo-500 ring-4 ring-indigo-500/30 rounded-xl transition-all duration-300 pointer-events-none z-[101]"
            style={{
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: `${Math.max(0, targetRect.left - 6)}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
            }}
          />
        </>
      ) : (
        <div 
          onClick={handleComplete}
          className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px] transition-opacity z-[100] cursor-pointer" 
        />
      )}

      {/* Tour Popover Card */}
      <div 
        className="max-w-sm sm:max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col justify-between"
        style={popoverStyle}
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
