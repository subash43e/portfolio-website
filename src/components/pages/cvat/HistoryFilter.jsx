import React from 'react';
import { Search, Filter } from 'lucide-react';

const HistoryFilter = ({ 
  searchQuery, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  dateFilter, 
  onDateFilterChange, 
  dateOptions = [],
  fileFilter,
  onFileFilterChange,
  fileOptions = [],
  className = ""
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-2 w-full ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        {dateOptions.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 flex-1 md:flex-none">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer w-full min-w-[120px]"
            >
              <option value="All Time">All Time</option>
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {fileOptions.length > 0 && onFileFilterChange && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 flex-1 md:flex-none">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={fileFilter}
              onChange={(e) => onFileFilterChange(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-700 focus:outline-none cursor-pointer w-full min-w-[120px]"
            >
              <option value="All">All Files</option>
              {fileOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryFilter;
