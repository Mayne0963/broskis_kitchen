'use client';

import { useState } from 'react';
import type { CateringStatus, CateringFilters } from '@/types/catering';

interface CateringFiltersProps {
  filters: CateringFilters;
  onFiltersChange: (filters: CateringFilters) => void;
  onExport: () => void;
  isExporting: boolean;
}

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
  { value: 'paid', label: 'Paid' },
];

const datePresetOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'next30Days', label: 'Next 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

// Helper functions for date calculations
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

const getWeekEnd = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? 0 : 7); // Sunday
  const sunday = new Date(now.setDate(diff));
  sunday.setHours(23, 59, 59, 999);
  return sunday.getTime();
};

const getNext30Days = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = now.getTime();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);
  return { start, end: end.getTime() };
};

export default function CateringFilters({
  filters,
  onFiltersChange,
  onExport,
  isExporting
}: CateringFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [customStartDate, setCustomStartDate] = useState(
    filters.dateStart ? new Date(parseInt(filters.dateStart)).toISOString().split('T')[0] : ''
  );
  const [customEndDate, setCustomEndDate] = useState(
    filters.dateEnd ? new Date(parseInt(filters.dateEnd)).toISOString().split('T')[0] : ''
  );

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters };
    if (status === 'all') {
      delete newFilters.status;
    } else {
      newFilters.status = status;
    }
    onFiltersChange(newFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters };
    if (searchInput) {
      newFilters.q = searchInput;
    } else {
      delete newFilters.q;
    }
    onFiltersChange(newFilters);
  };

  const handleDatePresetChange = (preset: string) => {
    let newFilters = { ...filters };

    if (preset === 'all') {
      // Clear all date filters
      delete newFilters.dateStart;
      delete newFilters.dateEnd;
      delete newFilters.datePreset;
    } else if (preset === 'thisWeek') {
      const start = getWeekStart();
      const end = getWeekEnd();
      newFilters.datePreset = preset;
      newFilters.dateStart = start.toString();
      newFilters.dateEnd = end.toString();
    } else if (preset === 'next30Days') {
      const { start, end } = getNext30Days();
      newFilters.datePreset = preset;
      newFilters.dateStart = start.toString();
      newFilters.dateEnd = end.toString();
    } else if (preset === 'custom') {
      newFilters.datePreset = preset;
      if (customStartDate) {
        newFilters.dateStart = new Date(customStartDate).getTime().toString();
      } else {
        delete newFilters.dateStart;
      }
      if (customEndDate) {
        newFilters.dateEnd = new Date(customEndDate + 'T23:59:59').getTime().toString();
      } else {
        delete newFilters.dateEnd;
      }
    }

    onFiltersChange(newFilters);
  };

  const handleCustomDateChange = () => {
    const newFilters = { ...filters };
    newFilters.datePreset = 'custom';
    
    if (customStartDate) {
      newFilters.dateStart = new Date(customStartDate).getTime().toString();
    } else {
      delete newFilters.dateStart;
    }
    
    if (customEndDate) {
      newFilters.dateEnd = new Date(customEndDate + 'T23:59:59').getTime().toString();
    } else {
      delete newFilters.dateEnd;
    }
    
    onFiltersChange(newFilters);
  };

  const clearDateFilters = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    const newFilters = { ...filters };
    delete newFilters.dateStart;
    delete newFilters.dateEnd;
    delete newFilters.datePreset;
    onFiltersChange(newFilters);
  };

  const currentPreset = filters.datePreset || 'all';
  const hasDateFilters = filters.dateStart || filters.dateEnd;

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6 mb-6">
      <div className="flex flex-col gap-4">
        {/* First Row: Status and Date Preset */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gold mb-2">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-black/80 border border-gold/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Preset Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gold mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <select
                value={currentPreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="flex-1 bg-black/80 border border-gold/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
              >
                {datePresetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasDateFilters && (
                <button
                  onClick={clearDateFilters}
                  className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  title="Clear date filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onExport}
              disabled={isExporting}
              className="bg-gold/20 text-gold border border-gold/30 px-4 py-2 rounded-lg font-medium hover:bg-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs (shown when Custom Range is selected) */}
        {currentPreset === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gold mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                onBlur={handleCustomDateChange}
                className="w-full bg-black/80 border border-gold/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gold mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                onBlur={handleCustomDateChange}
                className="w-full bg-black/80 border border-gold/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
        )}

        {/* Search Row */}
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-sm font-medium text-gold mb-2">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or address..."
                className="flex-1 bg-black/80 border border-gold/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                className="bg-gold text-black px-4 py-2 rounded-lg font-medium hover:bg-gold/90 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Active Filters Display */}
        {hasDateFilters && (
          <div className="text-sm text-gold/70">
            <span className="font-medium">Active date filter: </span>
            {filters.dateStart && (
              <span>From {new Date(parseInt(filters.dateStart)).toLocaleDateString()}</span>
            )}
            {filters.dateStart && filters.dateEnd && <span> - </span>}
            {filters.dateEnd && (
              <span>To {new Date(parseInt(filters.dateEnd)).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
