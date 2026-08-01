import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange
}: TablePaginationProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="font-medium text-slate-700">{totalItems === 0 ? 0 : startIndex}</span> to{' '}
          <span className="font-medium text-slate-700">{endIndex}</span> of{' '}
          <span className="font-medium text-slate-700">{totalItems}</span> results
        </span>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <span>Rows per page:</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
