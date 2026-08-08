'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Box, Clipboard, User, GraduationCap, X } from 'lucide-react';

interface OnboardingWidgetProps {
  workspacesCount: number;
  batchesCount: number;
  staffCount: number;
  onOpenStep: (stepNumber: number) => void;
}

export function OnboardingWidget({
  workspacesCount,
  batchesCount,
  staffCount,
  onOpenStep
}: OnboardingWidgetProps) {
  const [guideRead, setGuideRead] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGuideRead(localStorage.getItem('pfms_starter_guide_read') === 'true');
      setIsDismissed(localStorage.getItem('pfms_widget_dismissed') === 'true');
    }
  }, []);

  const step1Done = workspacesCount > 0;
  const step2Done = batchesCount > 0;
  const step3Done = staffCount > 0;
  const step4Done = guideRead || (step1Done && step2Done && step3Done);

  const steps = [
    {
      id: 1,
      title: 'Farm Branch Setup',
      desc: 'Configure your primary farm location & branch type',
      isDone: step1Done,
      icon: Box,
      actionText: 'Configure Branch'
    },
    {
      id: 2,
      title: 'First Flock Registration',
      desc: 'Register initial chicken batch, breed & bird count',
      isDone: step2Done,
      icon: Clipboard,
      actionText: 'Register Flock'
    },
    {
      id: 3,
      title: 'Staff & Access Credentials',
      desc: 'Add farm attendant or manager login account',
      isDone: step3Done,
      icon: User,
      actionText: 'Add Staff'
    },
    {
      id: 4,
      title: 'Operational Starter Guide',
      desc: 'Review egg yield tracking & feed threshold rules',
      isDone: step4Done,
      icon: GraduationCap,
      actionText: 'View Guide'
    }
  ];

  const completedCount = steps.filter(s => s.isDone).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  // Determine next pending step
  const nextPendingStep = steps.find(s => !s.isDone) || steps[3];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pfms_widget_dismissed', 'true');
    }
  };

  if (isDismissed && completedCount === 4) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/50 mb-8 relative overflow-hidden font-sans">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-indigo-900/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Farm Setup & Onboarding Progress</h3>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {completedCount} of 4 Completed ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete initial setup steps to unlock automated AI logs, mortality alerts, and feed thresholds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => onOpenStep(nextPendingStep.id)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <span>Resume Step {nextPendingStep.id}: {nextPendingStep.actionText}</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss widget"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar Segment */}
      <div className="py-4 border-b border-indigo-900/40 relative z-10">
        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
          <span>Overall Setup Progress</span>
          <span className="text-indigo-400 font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
          <div 
            className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Interactive Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 relative z-10">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => onOpenStep(step.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              step.isDone
                ? 'bg-slate-900/60 border-emerald-500/40 text-slate-300 hover:border-emerald-500'
                : step.id === nextPendingStep.id
                ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white ring-2 ring-indigo-500/30'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${
                  step.isDone 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : step.id === nextPendingStep.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <step.icon size={16} />
                </div>
                {step.isDone ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={12} /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    <Circle size={12} /> Step {step.id}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-white tracking-wide">{step.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{step.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-900/40 flex items-center justify-between text-[11px] font-bold">
              <span className={step.isDone ? 'text-emerald-400' : 'text-indigo-400'}>
                {step.isDone ? 'Completed' : step.actionText}
              </span>
              <ArrowRight size={14} className={step.isDone ? 'text-emerald-400' : 'text-indigo-400'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
