'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, Search, Egg, Wheat, Video, Building2, ShieldCheck } from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  highlightIcon: any;
  targetQuery?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Poultry Farm Management System!',
    subtitle: 'Interactive Product Guided Tour',
    description: 'Welcome aboard! Let’s take a quick 1-minute guided tour of your farm dashboard and key management modules.',
    highlightIcon: Sparkles,
  },
  {
    title: 'Global Search & Branch Switcher',
    subtitle: 'Navigation & Multi-Farm Access',
    description: 'Use the top search bar to jump to any farm module instantly. Access your multi-farm branches and change active coops from the top-left dropdown.',
    highlightIcon: Search,
    targetQuery: '[data-tour="search-bar"]'
  },
  {
    title: 'Real-Time Telemetry KPI Cards',
    subtitle: 'Flock Size, Egg Yield & Revenue',
    description: 'Monitor your total active birds, daily egg crates collected, remaining feed stock in kilograms, and net revenue in real-time.',
    highlightIcon: Egg,
    targetQuery: '[data-tour="kpi-cards"]'
  },
  {
    title: 'Daily Farm Operations',
    subtitle: 'Flocks, Feed & Vaccination Schedules',
    description: 'Log daily egg production, track feed consumption, manage broiler/layer batches, and view vaccination booster schedules from the left sidebar.',
    highlightIcon: Wheat,
    targetQuery: '[data-tour="sidebar-menu"]'
  },
  {
    title: 'Enterprise Suite & WebRTC CCTV',
    subtitle: 'Multi-Branch Matrix & CCTV Cameras',
    description: 'Monitor coops live with WebRTC CCTV cameras, generate digital invoices with Paystack/Stripe links, and transfer stock between regional branches.',
    highlightIcon: Building2,
    targetQuery: '[data-tour="enterprise-link"]'
  }
];

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('pfms_guided_tour_completed') === 'true';
      if (!tourCompleted) {
        // Auto-open tour for new users on first dashboard load
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Listen for custom trigger event (e.g. user clicks "Guided Tour" button in header/sidebar)
  useEffect(() => {
    const handleReTrigger = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener('pfms_trigger_tour', handleReTrigger);
    return () => window.removeEventListener('pfms_trigger_tour', handleReTrigger);
  }, []);

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
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-950/20 max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={handleComplete}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Skip Tour"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <Icon size={24} />
            </div>
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <h3 className="text-lg font-extrabold text-white mt-1 leading-tight">{currentStep.title}</h3>
              <p className="text-xs text-indigo-300 font-medium">{currentStep.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {currentStep.description}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex 
                    ? 'w-8 bg-indigo-600' 
                    : idx < currentStepIndex 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-slate-200'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <button
              onClick={handleComplete}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer px-2"
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStepIndex === TOUR_STEPS.length - 1 ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
