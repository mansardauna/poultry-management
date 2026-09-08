import React from 'react';
import { Search } from 'lucide-react';

interface TableControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
}

export function TableControls({ searchTerm, setSearchTerm, placeholder = "Search...", actions }: TableControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-b border-slate-100 bg-white">
      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50"
        />
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
