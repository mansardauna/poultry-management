'use strict';
'use client';

import React, { useState } from 'react';
import { Box, User, Clipboard, GraduationCap, ChevronRight, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../WorkspaceContext';

interface OnboardingWizardProps {
  onClose: () => void;
  initialStep?: number;
}

export function OnboardingWizard({ onClose, initialStep = 1 }: OnboardingWizardProps) {
  const { addWorkspace, updateWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  const [step, setStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Workspace/Branch & Farm Profile Details
  const [branchName, setBranchName] = useState('');
  const [branchType, setBranchType] = useState('Layer Farm');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [estimatedCapacity, setEstimatedCapacity] = useState('5000');
  const [createdBranchId, setCreatedBranchId] = useState<string | null>(null);

  // Step 2: First Flock Details
  const [breed, setBreed] = useState('');
  const [flockQty, setFlockQty] = useState('');
  const [flockType, setFlockType] = useState('Layers');
  const [flockAge, setFlockAge] = useState('');

  // Step 3: First Staff Member
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Attendant');
  const [staffSalary, setStaffSalary] = useState('45000');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Pre-populate Step 1 from active workspace if available
  React.useEffect(() => {
    if (!branchName && workspaces.length > 0) {
      setBranchName(workspaces[0].name || '');
      setBranchType(workspaces[0].type || 'Layer Farm');
      setCreatedBranchId(workspaces[0].id);
    }
  }, [workspaces]);

  // Pre-populate Step 2 & Step 3 from database & localStorage draft
  React.useEffect(() => {
    try {
      const draftStr = localStorage.getItem('pfms_onboarding_draft');
      if (draftStr) {
        const d = JSON.parse(draftStr);
        if (d.branchName && !branchName) setBranchName(d.branchName);
        if (d.branchType && !branchType) setBranchType(d.branchType);
        if (d.ownerName && !ownerName) setOwnerName(d.ownerName);
        if (d.ownerPhone && !ownerPhone) setOwnerPhone(d.ownerPhone);
        if (d.farmLocation && !farmLocation) setFarmLocation(d.farmLocation);
        if (d.estimatedCapacity && !estimatedCapacity) setEstimatedCapacity(d.estimatedCapacity);
        if (d.breed && !breed) setBreed(d.breed);
        if (d.flockQty && !flockQty) setFlockQty(d.flockQty);
        if (d.flockType && !flockType) setFlockType(d.flockType);
        if (d.flockAge && !flockAge) setFlockAge(d.flockAge);
        if (d.staffName && !staffName) setStaffName(d.staffName);
        if (d.staffRole && !staffRole) setStaffRole(d.staffRole);
        if (d.staffSalary && !staffSalary) setStaffSalary(d.staffSalary);
        if (d.staffUsername && !staffUsername) setStaffUsername(d.staffUsername);
        if (d.staffPassword && !staffPassword) setStaffPassword(d.staffPassword);
      }
    } catch (_e) {}

    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const b = data[0];
          setBreed(prev => prev || b.breed || '');
          setFlockQty(prev => prev || String(b.quantity || ''));
          setFlockType(prev => prev || b.type || 'Layers');
          setFlockAge(prev => prev || String(b.ageInWeeks || ''));
        }
      })
      .catch(() => {});

    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const s = data[0];
          setStaffName(prev => prev || s.name || '');
          setStaffRole(prev => prev || s.role || 'Attendant');
          setStaffSalary(prev => prev || String(s.salary || '45000'));
          setStaffUsername(prev => prev || s.username || '');
        }
      })
      .catch(() => {});
  }, []);

  // Save form drafts to localStorage continuously
  React.useEffect(() => {
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
    }
    onClose();
  };

  const handleSkipAll = async () => {
    setIsSaving(true);
    try {
      const defaultId = `farm-${Date.now()}`;
      await addWorkspace({
        id: defaultId,
        name: 'Main Farm',
        type: 'Mixed Use',
        createdAt: new Date().toISOString(),
      });
      toast.success('Default farm initialized! Welcome to Poultry Farm Management.');
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Initialization failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep1 = async () => {
    if (!branchName.trim()) {
      toast.error('Please enter a farm branch name');
      return;
    }
    setIsSaving(true);
    try {
      if (workspaces.length > 0) {
        const primaryWs = workspaces[0];
        await updateWorkspace(primaryWs.id, branchName.trim(), branchType);
        setActiveWorkspace({ ...primaryWs, name: branchName.trim(), type: branchType });
        setCreatedBranchId(primaryWs.id);
      } else {
        const workspaceId = `farm-${Date.now()}`;
        await addWorkspace({
          id: workspaceId,
          name: branchName.trim(),
          type: branchType,
          createdAt: new Date().toISOString(),
        });
        setCreatedBranchId(workspaceId);
      }

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmName: branchName.trim(),
          adminName: ownerName.trim(),
          adminPhone: ownerPhone.trim(),
        }),
      }).catch(() => {});

      toast.success('Farm branch profile saved!');
      setStep(2);
    } catch (_e) {
      toast.error('Failed to save branch details');
    } finally { setIsSaving(false); }
  };

  const handleNextStep2 = async () => {
    if (!breed.trim() || !flockQty) {
      setStep(3);
      return;
    }
    setIsSaving(true);
    try {
      await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed: breed.trim(),
          quantity: Number(flockQty),
          type: flockType,
          farmSection: 'Section A',
          vaccinationStatus: 'Up to Date',
          ageInWeeks: Number(flockAge) || 1,
        }),
      });
      toast.success('Flock batch saved!');
      setStep(3);
    } catch (_e) {
      toast.error('Failed to save flock batch');
    } finally { setIsSaving(false); }
  };

  const handleNextStep3 = async () => {
    if (!staffName.trim() || !staffUsername.trim() || !staffPassword.trim()) {
      setStep(4);
      return;
    }
    setIsSaving(true);
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName.trim(),
          role: staffRole,
          salary: Number(staffSalary) || 45000,
          contact: '',
          assignedBranches: createdBranchId ? [createdBranchId] : [],
          username: staffUsername.trim(),
          password: staffPassword.trim(),
        }),
      });
      toast.success('Staff credentials saved!');
      setStep(4);
    } catch (_e) {
      toast.error('Failed to save staff credentials');
    } finally { setIsSaving(false); }
  };

  const handleSubmitAll = async () => {
    setIsSaving(true);
    try {
      let targetWsId = createdBranchId;

      // 1. Save Branch Workspace & Farm Profile
      if (branchName.trim()) {
        if (workspaces.length > 0) {
          const primaryWs = workspaces[0];
          await updateWorkspace(primaryWs.id, branchName.trim(), branchType);
          setActiveWorkspace({ ...primaryWs, name: branchName.trim(), type: branchType });
          targetWsId = primaryWs.id;
        } else {
          const workspaceId = `farm-${Date.now()}`;
          await addWorkspace({
            id: workspaceId,
            name: branchName.trim(),
            type: branchType,
            createdAt: new Date().toISOString(),
          });
          targetWsId = workspaceId;
        }

        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmName: branchName.trim(),
            adminName: ownerName.trim(),
            adminPhone: ownerPhone.trim(),
          }),
        }).catch(() => {});
      }

      // 2. Save Flock Batch (if provided)
      if (breed.trim() && flockQty) {
        await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            breed: breed.trim(),
            quantity: Number(flockQty),
            type: flockType,
            farmSection: 'Section A',
            vaccinationStatus: 'Up to Date',
            ageInWeeks: Number(flockAge) || 1,
          }),
        }).catch(() => {});
      }

      // 3. Save Staff Member (if provided)
      if (staffName.trim() && staffUsername.trim() && staffPassword.trim()) {
        await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: staffName.trim(),
            role: staffRole,
            salary: Number(staffSalary) || 45000,
            contact: '',
            assignedBranches: targetWsId ? [targetWsId] : [],
            username: staffUsername.trim(),
            password: staffPassword.trim(),
          }),
        }).catch(() => {});
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('pfms_onboarding_draft');
        localStorage.setItem('pfms_onboarded_dismissed', 'true');
        localStorage.setItem('pfms_starter_guide_read', 'true');
      }

      toast.success('Farm onboarding setup submitted successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error submitting onboarding setup');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-100 flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors z-30 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Sidebar Steps Progress */}
        <div className="md:w-1/3 bg-slate-900 text-slate-100 p-5 sm:p-6 flex flex-col justify-between shrink-0 max-h-[25vh] md:max-h-full overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">P</div>
              <span className="font-bold tracking-wider uppercase text-xs text-indigo-300">Farm Onboarding</span>
            </div>
            <ul className="flex md:flex-col gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {[
                { s: 1, label: 'Farm Profile & Branch', icon: Box },
                { s: 2, label: 'Flock Setup', icon: Clipboard },
                { s: 3, label: 'Staff Member', icon: User },
                { s: 4, label: 'Starter Guide', icon: GraduationCap },
              ].map((item) => (
                <li 
                  key={item.s} 
                  onClick={() => setStep(item.s)}
                  className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  title={`Jump to Step ${item.s}`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${
                    step === item.s 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : step > item.s 
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' 
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-extrabold ${
                      step === item.s ? 'text-indigo-400' : 'text-slate-500'
                    }`}>Step {item.s}</p>
                    <p className={`text-xs font-semibold hidden md:block ${
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
              className="mt-4 md:mt-6 text-xs font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer flex items-center gap-1 shrink-0"
            >
              ⚡ Skip Setup & Start
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
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Farm / Organization Name</label>
                    <input 
                      type="text" 
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Grand Poultry Farm - Main Branch"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
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

              {/* Always Visible Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end bg-white shrink-0 z-10">
                <button 
                  onClick={handleNextStep1}
                  disabled={!branchName.trim() || isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all w-full sm:w-auto justify-center"
                >
                  {isSaving ? 'Saving...' : 'Save Branch & Continue'} <ChevronRight size={16} />
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

              {/* Always Visible Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
                <button 
                  onClick={() => setStep(3)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleNextStep2}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  {isSaving ? 'Saving...' : 'Save Flock & Continue'} <ChevronRight size={16} />
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

              {/* Always Visible Fixed Bottom Action Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
                <button 
                  onClick={() => setStep(4)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleNextStep3}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  {isSaving ? 'Saving...' : 'Save Staff & Continue'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Starter Pack */}
          {step === 4 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={24} /> Farm Setup Complete!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Quick operational breakdown of your poultry management workspace.</p>
                </div>
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">🥚 Daily Egg Yield & Mortality Logs</p>
                    <p className="text-slate-600 leading-relaxed">
                      Log egg production and broken eggs under the **Eggs** dashboard. Automated alerts warn you if breakage or mortality spikes.
                    </p>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="font-bold text-slate-900">🌾 Feed Stock Thresholds</p>
                    <p className="text-slate-600 leading-relaxed">
                      Track feed bags and daily consumption under **Feed**. Critical alerts notify management whenever feed falls below safety thresholds.
                    </p>
                  </div>
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="font-bold text-slate-900">💳 Financial Ledger & Invoicing</p>
                    <p className="text-slate-600 leading-relaxed">
                      Customer invoices automatically convert to confirmed revenue upon payment. Track feed buys and operational costs under **Finance**.
                    </p>
                  </div>
                </div>
              </div>

              {/* Always Visible Fixed Final Launch Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 bg-white shrink-0 z-10">
                <button 
                  onClick={handleSubmitAll}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm uppercase tracking-wider w-full py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer transition-all"
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
