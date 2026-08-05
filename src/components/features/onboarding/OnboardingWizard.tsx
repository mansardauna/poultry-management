'use strict';
'use client';

import React, { useState } from 'react';
import { Box, User, Clipboard, GraduationCap, ChevronRight, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../WorkspaceContext';

interface OnboardingWizardProps {
  onClose: () => void;
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const { addWorkspace } = useWorkspace();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Workspace/Branch Details
  const [branchName, setBranchName] = useState('');
  const [branchType, setBranchType] = useState('Layer Farm');
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

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pfms_onboarded_dismissed', 'true');
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

  const handleCreateBranch = async () => {
    if (!branchName.trim()) {
      toast.error('Please enter a farm branch name');
      return;
    }
    setIsSaving(true);
    try {
      const workspaceId = `farm-${Date.now()}`;
      await addWorkspace({
        id: workspaceId,
        name: branchName.trim(),
        type: branchType,
        createdAt: new Date().toISOString(),
      });
      setCreatedBranchId(workspaceId);
      toast.success('Branch created successfully!');
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create branch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFlock = async () => {
    if (!breed || !flockQty) {
      toast.error('Breed and quantity are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed,
          quantity: Number(flockQty),
          type: flockType,
          farmSection: 'Section A',
          vaccinationStatus: 'Up to Date',
          ageInWeeks: Number(flockAge) || 1,
        }),
      });

      if (res.ok) {
        toast.success('Initial flock registered!');
        setStep(3);
      } else {
        toast.error('Failed to register flock');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaff = async () => {
    if (!staffName || !staffUsername || !staffPassword) {
      toast.error('Name, username and password are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          role: staffRole,
          salary: Number(staffSalary),
          contact: '',
          assignedBranches: createdBranchId ? [createdBranchId] : [],
          username: staffUsername,
          password: staffPassword,
        }),
      });

      if (res.ok) {
        toast.success('First staff member registered!');
        setStep(4);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to register staff member');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative border border-slate-200">
        
        {/* Close Button Top Right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          title="Close Setup Wizard"
        >
          <X size={18} />
        </button>

        {/* Sidebar Steps Progress */}
        <div className="md:w-1/3 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">P</div>
              <span className="font-bold tracking-wider uppercase text-xs text-indigo-300">Farm Onboarding</span>
            </div>
            <ul className="space-y-4 md:space-y-6">
              {[
                { s: 1, label: 'Farm Branch', icon: Box },
                { s: 2, label: 'Flock Setup', icon: Clipboard },
                { s: 3, label: 'Staff Member', icon: User },
                { s: 4, label: 'Starter Guide', icon: GraduationCap },
              ].map((item) => (
                <li key={item.s} className="flex items-center gap-3">
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
                    <p className={`text-xs font-semibold ${
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
              className="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors text-left cursor-pointer flex items-center gap-1"
            >
              ⚡ Skip Setup & Start
            </button>
          )}
        </div>

        {/* Scrollable Content Panel */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white overflow-y-auto max-h-[80vh]">
          
          {/* Step 1: Farm Branch */}
          {step === 1 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">Create your first Farm Branch</h2>
                  <p className="text-xs text-slate-500 mt-1">Branches help you segregate inventory, financial logs, and staff across physical farm locations.</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Branch Name</label>
                    <input 
                      type="text" 
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Main Farm - Abuja Branch"
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Branch Farm Type</label>
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

              {/* Action Bar */}
              <div className="pt-6 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white z-10">
                <button 
                  onClick={handleCreateBranch}
                  disabled={isSaving || !branchName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Create Branch <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Flock */}
          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">Register your first flock batch</h2>
                  <p className="text-xs text-slate-500 mt-1">Add initial chicken batches to monitor mortality rates, vaccination routines, and yield metrics.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
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

              {/* Action Bar */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center sticky bottom-0 bg-white z-10">
                <button 
                  onClick={() => setStep(3)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleSaveFlock}
                  disabled={isSaving || !breed || !flockQty}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Register Flock <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Staff */}
          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">Register your first staff member</h2>
                  <p className="text-xs text-slate-500 mt-1">Create staff login credentials to begin delegating daily tasks and logging work.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
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

              {/* Action Bar */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center sticky bottom-0 bg-white z-10">
                <button 
                  onClick={() => setStep(4)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleSaveStaff}
                  disabled={isSaving || !staffName || !staffUsername || !staffPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Save Staff <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Starter Pack */}
          {step === 4 && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={24} /> Farm Setup Complete!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Quick operational breakdown of your poultry management workspace.</p>
                </div>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
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

              {/* Final Launch Button */}
              <div className="pt-6 border-t border-slate-100 sticky bottom-0 bg-white z-10">
                <button 
                  onClick={handleClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm uppercase tracking-wider w-full py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all"
                >
                  Launch My Dashboard <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
