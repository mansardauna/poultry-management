'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Box, User, Clipboard, GraduationCap, ChevronRight, CheckCircle2, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../WorkspaceContext';

interface OnboardingWizardProps {
  onClose: () => void;
  initialStep?: number;
}

export function OnboardingWizard({ onClose, initialStep }: OnboardingWizardProps) {
  const { addWorkspace, updateWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  
  // Step State with localStorage Persistence
  const [step, setStepState] = useState<number>(initialStep || 1);
  const [isSaving, setIsSaving] = useState(false);

  // Form Field States
  const [branchName, setBranchName] = useState('');
  const [branchType, setBranchType] = useState('Layer Farm');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [estimatedCapacity, setEstimatedCapacity] = useState('5000');
  const [createdBranchId, setCreatedBranchId] = useState<string | null>(null);

  const [breed, setBreed] = useState('');
  const [flockQty, setFlockQty] = useState('');
  const [flockType, setFlockType] = useState('Layers');
  const [flockAge, setFlockAge] = useState('');

  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Attendant');
  const [staffSalary, setStaffSalary] = useState('45000');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const setStep = (newStep: number) => {
    setStepState(newStep);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pfms_onboarding_current_step', String(newStep));
    }
  };

  // Restore saved step & pre-populate from localStorage or database
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('pfms_onboarding_current_step');
      if (!initialStep && savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (parsed >= 1 && parsed <= 4) setStepState(parsed);
      } else if (initialStep) {
        setStepState(initialStep);
      }

      try {
        const draftStr = localStorage.getItem('pfms_onboarding_draft');
        if (draftStr) {
          const d = JSON.parse(draftStr);
          if (d.branchName) setBranchName(d.branchName);
          if (d.branchType) setBranchType(d.branchType);
          if (d.ownerName) setOwnerName(d.ownerName);
          if (d.ownerPhone) setOwnerPhone(d.ownerPhone);
          if (d.farmLocation) setFarmLocation(d.farmLocation);
          if (d.estimatedCapacity) setEstimatedCapacity(d.estimatedCapacity);
          if (d.breed) setBreed(d.breed);
          if (d.flockQty) setFlockQty(d.flockQty);
          if (d.flockType) setFlockType(d.flockType);
          if (d.flockAge) setFlockAge(d.flockAge);
          if (d.staffName) setStaffName(d.staffName);
          if (d.staffRole) setStaffRole(d.staffRole);
          if (d.staffSalary) setStaffSalary(d.staffSalary);
          if (d.staffUsername) setStaffUsername(d.staffUsername);
          if (d.staffPassword) setStaffPassword(d.staffPassword);
        }
      } catch (_e) {}
    }

    if (workspaces.length > 0) {
      setBranchName(prev => prev || workspaces[0].name || '');
      setBranchType(prev => prev || workspaces[0].type || 'Layer Farm');
      setCreatedBranchId(workspaces[0].id);
    }

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.systemSettings) {
          const sys = data.systemSettings;
          setBranchName(prev => prev || sys.farmName || '');
          setOwnerName(prev => prev || sys.adminName || '');
          setOwnerPhone(prev => prev || sys.adminPhone || '');
        }
      })
      .catch(() => {});

    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const b = data[0];
          setBreed(prev => prev || b.breed || '');
          setFlockQty(prev => prev || String(b.quantity || ''));
          setFlockType(prev => prev || b.type || 'Layers');
          setFlockAge(prev => prev || String(b.ageInWeeks || '1'));
        }
      })
      .catch(() => {});

    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        if (data?.staff && Array.isArray(data.staff) && data.staff.length > 0) {
          const s = data.staff[0];
          setStaffName(prev => prev || s.name || '');
          setStaffRole(prev => prev || s.role || 'Attendant');
          setStaffSalary(prev => prev || String(s.salary || '45000'));
          setStaffUsername(prev => prev || s.username || '');
        }
      })
      .catch(() => {});
  }, [workspaces, initialStep]);

  // Continuously persist form state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pfms_onboarding_draft', JSON.stringify({
        branchName,
        branchType,
        ownerName,
        ownerPhone,
        farmLocation,
        estimatedCapacity,
        breed,
        flockQty,
        flockType,
        flockAge,
        staffName,
        staffRole,
        staffSalary,
        staffUsername,
        staffPassword
      }));
    } catch (_e) {}
  }, [branchName, branchType, ownerName, ownerPhone, farmLocation, estimatedCapacity, breed, flockQty, flockType, flockAge, staffName, staffRole, staffSalary, staffUsername, staffPassword]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pfms_onboarded_dismissed', 'true');
      localStorage.setItem('pfms_starter_guide_read', 'true');
      
      const url = new URL(window.location.href);
      if (url.searchParams.has('onboarding')) {
        url.searchParams.delete('onboarding');
        window.history.replaceState({}, '', url.toString());
      }

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pfms_trigger_tour'));
      }, 300);
    }
    onClose();
  };

  const handleSkipAll = async () => {
    setIsSaving(true);
    try {
      if (workspaces.length === 0) {
        const defaultId = `farm-${Date.now()}`;
        await addWorkspace({
          id: defaultId,
          name: 'Main Farm',
          type: 'Mixed Use',
          createdAt: new Date().toISOString(),
        }, false);
      }
      toast.success('Setup initialized. Welcome to Poultry Management System.');
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Initialization failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep1 = () => {
    if (!branchName.trim()) {
      toast.error('Please enter a farm branch name');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleSubmitAll = async () => {
    setIsSaving(true);
    try {
      let targetWsId = createdBranchId;
      const effectiveBranchName = branchName.trim() || 'Main Farm';

      // 1. Commit Workspace & Settings (pass shouldReload=false to prevent aborting submission)
      if (workspaces.length > 0) {
        const primaryWs = workspaces[0];
        await updateWorkspace(primaryWs.id, effectiveBranchName, branchType);
        setActiveWorkspace({ ...primaryWs, name: effectiveBranchName, type: branchType }, false);
        targetWsId = primaryWs.id;
      } else {
        const workspaceId = `farm-${Date.now()}`;
        await addWorkspace({
          id: workspaceId,
          name: effectiveBranchName,
          type: branchType,
          createdAt: new Date().toISOString(),
        }, false);
        targetWsId = workspaceId;
      }

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'system',
          farmName: effectiveBranchName,
          adminName: ownerName.trim(),
          adminPhone: ownerPhone.trim(),
        }),
      }).catch(() => {});

      // 2. Commit Flock Batch (Always save if flockQty or breed is specified)
      const quantityNum = Number(flockQty) || 0;
      const effectiveBreed = breed.trim() || (flockType === 'Broilers' ? 'Cobb 500 Broiler' : 'Isa Brown Layer');

      if (quantityNum > 0 || breed.trim()) {
        await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isOnboarding: true,
            breed: effectiveBreed,
            quantity: quantityNum || 500,
            type: flockType,
            farmSection: 'Section A',
            vaccinationStatus: 'Up to Date',
            ageInWeeks: Number(flockAge) || 1,
          }),
        }).catch(() => {});
      }

      // 3. Commit Staff Member (Always save if staffName or staffUsername is specified)
      const effectiveStaffName = staffName.trim() || 'Farm Attendant';
      const effectiveUsername = staffUsername.trim() || effectiveStaffName.toLowerCase().replace(/\s+/g, '');
      const effectivePassword = staffPassword.trim() || 'staff123';

      if (staffName.trim() || staffUsername.trim()) {
        await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isOnboarding: true,
            name: effectiveStaffName,
            role: staffRole,
            salary: Number(staffSalary) || 45000,
            contact: '',
            assignedBranches: targetWsId ? [targetWsId] : [],
            username: effectiveUsername,
            password: effectivePassword,
          }),
        }).catch(() => {});
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('pfms_branch_setup_completed', 'true');
        localStorage.setItem('pfms_onboarded_dismissed', 'true');
      }

      toast.success('Farm onboarding setup submitted successfully.');
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Error submitting onboarding setup');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[90] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-200 flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors z-30 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Sidebar Steps Progress */}
        <div className="md:w-1/3 bg-slate-900 text-slate-100 p-4 sm:p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">P</div>
              <span className="font-bold tracking-wider uppercase text-xs text-indigo-300">Farm Onboarding</span>
            </div>
            <ul className="grid grid-cols-4 md:flex md:flex-col gap-2 md:gap-5">
              {[
                { s: 1, label: 'Farm Branch', icon: Box },
                { s: 2, label: 'Flock Setup', icon: Clipboard },
                { s: 3, label: 'Staff Member', icon: User },
                { s: 4, label: 'Starter Guide', icon: GraduationCap },
              ].map((item) => (
                <li 
                  key={item.s} 
                  onClick={() => setStep(item.s)}
                  className={`flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-3 p-2 md:p-0 rounded-xl cursor-pointer hover:opacity-90 transition-all ${
                    step === item.s 
                      ? 'bg-indigo-600/20 md:bg-transparent border border-indigo-500/30 md:border-none' 
                      : ''
                  }`}
                  title={`Jump to Step ${item.s}`}
                >
                  <div className={`p-2 rounded-xl transition-colors shrink-0 ${
                    step === item.s 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : step > item.s 
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    <item.icon size={16} />
                  </div>
                  <div className="text-center md:text-left min-w-0">
                    <p className={`text-[10px] uppercase tracking-wider font-extrabold truncate ${
                      step === item.s ? 'text-indigo-400' : 'text-slate-400'
                    }`}>Step {item.s}</p>
                    <p className={`text-xs font-semibold hidden md:block truncate ${
                      step === item.s ? 'text-white' : 'text-slate-400'
                    }`}>{item.label}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {step < 4 && (
            <button 
              onClick={handleSkipAll}
              disabled={isSaving}
              className="mt-3 md:mt-6 text-xs font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer flex items-center gap-1 shrink-0"
            >
              Skip Setup & Start
            </button>
          )}
        </div>

        {/* Scrollable Content Panel */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between bg-white overflow-hidden max-h-[67vh] md:max-h-full">
          
          {/* Step 1: Farm Profile & Branch */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">Configure Farm Profile & Primary Branch</h2>
                  <p className="text-xs text-slate-500 mt-1">Set up your farm profile, owner details, location, and operational capacity.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Farm / Organization Name *</label>
                    <input 
                      type="text" 
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Grand Poultry Farm - Main Branch"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Owner / Manager Full Name</label>
                    <input 
                      type="text" 
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Mansur Dauna"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Phone / WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="e.g. +234 801 234 5678"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Location Address / State</label>
                    <input 
                      type="text" 
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Abuja, Nigeria"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Est. Total Capacity (Birds)</label>
                    <input 
                      type="number" 
                      value={estimatedCapacity}
                      onChange={(e) => setEstimatedCapacity(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Branch Operational Type</label>
                    <select 
                      value={branchType}
                      onChange={(e) => setBranchType(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium cursor-pointer"
                    >
                      <option value="Layer Farm">Layer Farm (Egg Production)</option>
                      <option value="Broiler Farm">Broiler Farm (Meat Production)</option>
                      <option value="Hatchery">Hatchery & Breeding</option>
                      <option value="Mixed Use">Mixed Commercial Farm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end bg-white shrink-0 z-10">
                <button 
                  onClick={handleNextStep1}
                  disabled={!branchName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all w-full sm:w-auto justify-center"
                >
                  <span>Continue to Flock Setup</span> <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Flock */}
          {step === 2 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">Register your first flock batch</h2>
                  <p className="text-xs text-slate-500 mt-1">Add initial chicken batches to monitor mortality rates, vaccination routines, and yield metrics.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Breed / Hybrid</label>
                    <input 
                      type="text" 
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g. Isa Brown / Cobb 500"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Bird Count (Qty)</label>
                    <input 
                      type="number" 
                      value={flockQty}
                      onChange={(e) => setFlockQty(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Age (Weeks)</label>
                    <input 
                      type="number" 
                      value={flockAge}
                      onChange={(e) => setFlockAge(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Bird Category</label>
                    <select 
                      value={flockType}
                      onChange={(e) => setFlockType(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium cursor-pointer"
                    >
                      <option value="Layers">Layers (Egg Production)</option>
                      <option value="Broilers">Broilers (Meat Production)</option>
                      <option value="Cockerels">Cockerels</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
                <button 
                  onClick={() => setStep(1)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button 
                  onClick={handleNextStep2}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <span>Continue to Staff Setup</span> <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Staff */}
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide">Register your first staff member</h2>
                  <p className="text-xs text-slate-500 mt-1">Create staff login credentials to begin delegating daily tasks and logging work.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. John Attendant"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Access Role</label>
                    <select 
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium cursor-pointer"
                    >
                      <option value="Staff">Attendant (Staff)</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Monthly Salary (₦)</label>
                    <input 
                      type="number" 
                      value={staffSalary}
                      onChange={(e) => setStaffSalary(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="john_attendant"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Password</label>
                    <input 
                      type="password" 
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Set password"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
                <button 
                  onClick={() => setStep(2)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button 
                  onClick={handleNextStep3}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <span>Continue to Final Review</span> <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Starter Pack & Final Commit */}
          {step === 4 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={24} /> Review & Complete Setup
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Operational breakdown of your poultry management workspace.</p>
                </div>
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Farm Branch: <span className="text-indigo-600">{branchName || 'Main Farm'}</span> ({branchType})</p>
                    <p className="text-slate-600 font-medium">Owner: {ownerName || 'Not specified'} | Location: {farmLocation || 'Default'} | Capacity: {estimatedCapacity || '5000'} birds</p>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="font-bold text-slate-900">First Flock: <span className="text-indigo-600">{breed || 'Commercial Layer'}</span> ({flockQty || '500'} birds, {flockAge || '1'} weeks old)</p>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="font-bold text-slate-900">First Staff: <span className="text-indigo-600">{staffName || 'Farm Attendant'}</span> ({staffRole}, Username: {staffUsername || 'staff1'})</p>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="font-bold text-slate-900">Daily Logs & Operational Rules</p>
                    <p className="text-slate-600 leading-relaxed">
                      Egg collections, mortality alerts, feed thresholds, and staff task rosters are ready for immediate logging.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Final Launch Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
                <button 
                  onClick={() => setStep(3)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button 
                  onClick={handleSubmitAll}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {isSaving ? 'Submitting Setup...' : 'Submit & Complete Setup'} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
