'use client';

import React, { useState } from 'react';
import { Box, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from './WorkspaceContext';

export function WorkspaceOnboarding({ onClose }: { onClose: () => void }) {
  const { addWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [type, setType] = useState('Layer Farm');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a branch name.');
      return;
    }

    setIsSaving(true);

    try {
      await addWorkspace({
        id: `farm-${Date.now()}`,
        name: name.trim(),
        type,
        createdAt: new Date().toISOString(),
      });

      toast.success('Branch created successfully.');
      onClose();
    } catch (error) {
      console.error('Workspace creation failed', error);
      toast.error('Failed to create branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Box className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-slate-800">Add New Branch / Farm</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Farm Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. North Side Broilers"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Farm Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Layer Farm</option>
              <option>Broiler Farm</option>
              <option>Hatchery</option>
              <option>Mixed Use</option>
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Create Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
