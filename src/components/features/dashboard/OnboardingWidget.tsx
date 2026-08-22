'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Box, Clipboard, User, GraduationCap, X } from 'lucide-react';

interface OnboardingWidgetProps {
  workspacesCount: number;
  batchesCount: number;
  staffCount: number;
  onOpenStep: (stepNumber: number) => void;
  userRole?: string;
}

export function OnboardingWidget({
  workspacesCount,
  batchesCount,
  staffCount,
  onOpenStep,
  userRole = 'Admin'
}: OnboardingWidgetProps) {
  const [guideRead, setGuideRead] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGuideRead(localStorage.getItem('pfms_starter_guide_read') === 'true');
      setIsDismissed(localStorage.getItem('pfms_widget_dismissed') === 'true');
    }
  }, []);

  if (userRole !== 'Admin') return null;

  const branchSetupCompleted = typeof window !== 'undefined' && localStorage.getItem('pfms_branch_setup_completed') === 'true';
  const step1Done = branchSetupCompleted || batchesCount > 0;
  const step2Done = batchesCount > 0;
  const step3Done = staffCount > 0;
  const step4Done = guideRead;

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
    <div className="bg-slate-900 text-white rounded-sm p-6 border border-slate-800 mb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Farm Setup & Onboarding Progress</h3>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Resume Step {nextPendingStep.id}: {nextPendingStep.actionText}</span>
            <ArrowRight size={15} />
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white text-xs p-1.5 rounded-sm hover:bg-slate-800 transition-colors"
            title="Dismiss widget"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar Segment */}
      <div className="pt-4">
        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
          <span>Overall Setup Progress</span>
          <span className="text-indigo-400 font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-sm h-2 overflow-hidden p-0.5 border border-slate-700">
          <div 
            className="bg-indigo-500 h-full rounded-sm transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
