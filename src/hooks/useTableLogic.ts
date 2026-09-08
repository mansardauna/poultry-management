import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface UseTableLogicProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialPageSize?: number;
}

export function useTableLogic<T>({ data, searchFields = [], initialPageSize = 20 }: UseTableLogicProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: SortDirection } | null>(null);

  const handleSort = (key: keyof T) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    const lowerSearch = searchTerm.toLowerCase();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const val = item[field];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, searchFields]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aString > bString ? 1 : -1;
      } else {
        return aString < bString ? 1 : -1;
      }
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  return {
    data: paginatedData,
    totalItems: sortedData.length,
    currentPage: safeCurrentPage,
    totalPages,
    pageSize,
    searchTerm,
    sortConfig,
    setSearchTerm,
    setCurrentPage,
    setPageSize,
    handleSort
  };
}
