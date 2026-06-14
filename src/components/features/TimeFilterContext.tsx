'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'all';

interface TimeFilterContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filterByTimeRange: <T extends Record<string, any>>(items: T[], dateFieldOverride?: string) => T[];
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

export function TimeFilterProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRangeState] = useState<TimeRange>('all');

  useEffect(() => {
    const savedRange = Cookies.get('pfms_time_range') as TimeRange;
    if (savedRange && ['weekly', 'monthly', 'yearly', 'all'].includes(savedRange)) {
      setTimeRangeState(savedRange);
    } else {
      Cookies.set('pfms_time_range', 'all', { path: '/' });
    }
  }, []);

  const setTimeRange = (range: TimeRange) => {
    setTimeRangeState(range);
    Cookies.set('pfms_time_range', range, { path: '/' });
  };

  const filterByTimeRange = <T extends Record<string, any>>(items: T[], dateFieldOverride?: string): T[] => {
    if (timeRange === 'all' || !Array.isArray(items)) return items;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (timeRange === 'weekly') {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === 'monthly') {
      cutoff.setDate(now.getDate() - 30);
    } else if (timeRange === 'yearly') {
      cutoff.setDate(now.getDate() - 365);
    }

    // Set cutoff to start of the day
    cutoff.setHours(0, 0, 0, 0);

    return items.filter((item) => {
      // Find the date field on the object
      const val = 
        item[dateFieldOverride || ''] ||
        item['date'] || 
        item['purchaseDate'] || 
        item['lastRestock'] || 
        item['scheduledDate'] || 
        item['createdAt'];

      if (!val) return true; // If no date field exists, preserve the record
      
      const itemDate = new Date(val);
      // If invalid date, preserve
      if (isNaN(itemDate.getTime())) return true;
      
      return itemDate >= cutoff;
    });
  };

  return (
    <TimeFilterContext.Provider value={{ timeRange, setTimeRange, filterByTimeRange }}>
      {children}
    </TimeFilterContext.Provider>
  );
}

export function useTimeFilter() {
  const context = useContext(TimeFilterContext);
  if (context === undefined) {
    throw new Error('useTimeFilter must be used within a TimeFilterProvider');
  }
  return context;
}
