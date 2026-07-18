'use strict';
'use client';

import React, { useState } from 'react';
import { Box, User, Clipboard, GraduationCap, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
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
      toast.success('Default farm initialized! Welcome to Gaa Saka.');
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Steps Progress */}
        <div className="md:w-1/3 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Box className="text-indigo-400" size={24} />
              <span className="font-bold tracking-wider uppercase text-xs">Gaa Saka Onboarding</span>
            </div>
            <ul className="space-y-6">
              {[
                { s: 1, label: 'Farm Branch', icon: Box },
                { s: 2, label: 'Flock Setup', icon: Clipboard },
                { s: 3, label: 'Staff Registration', icon: User },
                { s: 4, label: 'Starter Pack', icon: GraduationCap },
              ].map((item) => (
                <li key={item.s} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    step === item.s 
                      ? 'bg-indigo-600 text-white' 
                      : step > item.s 
                        ? 'bg-indigo-900/50 text-indigo-400' 
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wider font-semibold ${
                      step === item.s ? 'text-white' : 'text-slate-400'
                    }`}>Step {item.s}</p>
                    <p className={`text-sm font-medium ${
                      step === item.s ? 'text-indigo-300' : 'text-slate-500'
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
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors text-left"
            >
              Skip All Setup & Start
            </button>
          )}
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-8 flex flex-col justify-between bg-white">
          {/* Step 1: Farm Branch */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-850 uppercase tracking-wide">Create your first Farm Branch</h2>
                <p className="text-sm text-slate-500 mt-1">Branches help you segregate data across different physical farms or locations.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Branch Name</label>
                  <input 
                    type="text" 
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Gaa Saka East Branch"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Branch Type</label>
                  <select 
                    value={branchType}
                    onChange={(e) => setBranchType(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  >
                    <option value="Layer Farm">Layer Farm</option>
                    <option value="Broiler Farm">Broiler Farm</option>
                    <option value="Hatchery">Hatchery</option>
                    <option value="Mixed Use">Mixed Use</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={handleCreateBranch}
                  disabled={isSaving || !branchName}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-100 disabled:bg-indigo-400"
                >
                  Create Branch <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Flock */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-850 uppercase tracking-wide">Register your first flock</h2>
                <p className="text-sm text-slate-500 mt-1">Add initial chicken batches to monitor mortality rates, vaccination routines, and yield metrics.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Breed / Hybrid</label>
                  <input 
                    type="text" 
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Isa Brown"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Quantity</label>
                  <input 
                    type="number" 
                    value={flockQty}
                    onChange={(e) => setFlockQty(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Age (Weeks)</label>
                  <input 
                    type="number" 
                    value={flockAge}
                    onChange={(e) => setFlockAge(e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Bird Type</label>
                  <select 
                    value={flockType}
                    onChange={(e) => setFlockType(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  >
                    <option value="Layers">Layers (Egg Production)</option>
                    <option value="Broilers">Broilers (Meat Production)</option>
                    <option value="Cockerels">Cockerels</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-between items-center">
                <button 
                  onClick={() => setStep(3)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleSaveFlock}
                  disabled={isSaving || !breed || !flockQty}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-100 disabled:bg-indigo-400"
                >
                  Register Flock <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Staff */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-850 uppercase tracking-wide">Register your first staff member</h2>
                <p className="text-sm text-slate-500 mt-1">Create login credentials for a staff member or farm attendant to begin logging work.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Staff Name</label>
                  <input 
                    type="text" 
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. John Attendant"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Role</label>
                  <select 
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  >
                    <option value="Staff">Attendant (Staff)</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Monthly Salary (₦)</label>
                  <input 
                    type="number" 
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Login Username</label>
                  <input 
                    type="text" 
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    placeholder="john_attendant"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Login Password</label>
                  <input 
                    type="password" 
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Set a password"
                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-between items-center">
                <button 
                  onClick={() => setStep(4)}
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Skip Step
                </button>
                <button 
                  onClick={handleSaveStaff}
                  disabled={isSaving || !staffName || !staffUsername || !staffPassword}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-100 disabled:bg-indigo-400"
                >
                  Save Staff <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Starter Pack */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-850 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={28} /> Starter Pack Guide
                </h2>
                <p className="text-sm text-slate-500 mt-1">Quick operational breakdown of your poultry management workspace.</p>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto bg-slate-50 p-4 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">🥚 Egg Yield & broken tracking</p>
                  <p className="text-slate-600 leading-relaxed">
                    Log egg yields daily under the **Eggs** dashboard. Keep an eye on Broken eggs. If egg breakage is high, the system automatically creates tasks to audit nesting cushioning padding.
                  </p>
                </div>
                <div className="space-y-1 border-t border-slate-200 pt-3">
                  <p className="font-bold text-slate-800">🌾 Feed Logistics & safety thresholds</p>
                  <p className="text-slate-600 leading-relaxed">
                    Under the **Feed** page, log restocks and daily usage. When feed stocks drop below your threshold (default 50kg), critical alerts are logged, and restock tasks are automatically assigned.
                  </p>
                </div>
                <div className="space-y-1 border-t border-slate-200 pt-3">
                  <p className="font-bold text-slate-800">💳 Finance break-even tracking</p>
                  <p className="text-slate-600 leading-relaxed">
                    Egg sales automatically generate invoices and record revenue. Expenses (like feed buys) are logged under the **Finance** page. The main dashboard uses this to calculate real-time break-even percentages and profit projections.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider w-full py-4 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
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
