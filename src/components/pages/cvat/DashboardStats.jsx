import React from "react";
import { BarChart2, ListOrdered, Calendar, Eye, Clock } from "lucide-react";

const DashboardStats = ({ dateFilter, finalDisplayEntries, activeTab, setActiveTab }) => {
  // --- OVERVIEW & SLOT CALCULATION LOGIC ---
  const slotNames = ["11:00 AM", "1:00 PM", "2:00 PM", "5:00 PM", "6:00 PM", "Overtime"];
  const slotData = slotNames.reduce((acc, slot) => ({ ...acc, [slot]: [] }), {});
  const entriesForSlots = finalDisplayEntries;
  
  const totalFramesCompleted = entriesForSlots.length;
  const totalFacesCompleted = entriesForSlots.reduce((sum, entry) => sum + entry.facesCompleted, 0);
  const totalTimeSpent = entriesForSlots.reduce((sum, entry) => sum + entry.durationMinutes, 0);

  entriesForSlots.forEach(entry => {
    let hours = 0, minutes = 0;
    try {
      const entryTime = new Date(`${entry.date} ${entry.timestamp}`);
      hours = entryTime.getHours();
      minutes = entryTime.getMinutes();
      if (isNaN(hours)) {
        const [time, modifier] = entry.timestamp.split(' ');
        let [h, m] = time.split(':');
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      }
    } catch (e) {
      console.error("Time parsing error", e);
    }

    const timeFloat = hours + (minutes / 60);
    if (timeFloat <= 11) slotData["11:00 AM"].push(entry);
    else if (timeFloat <= 13) slotData["1:00 PM"].push(entry);
    else if (timeFloat <= 14) slotData["2:00 PM"].push(entry);
    else if (timeFloat <= 17) slotData["5:00 PM"].push(entry);
    else if (timeFloat <= 18) slotData["6:00 PM"].push(entry);
    else slotData["Overtime"].push(entry);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      {/* Tab Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {dateFilter === "All Time" ? "All Time Performance" : `${dateFilter} Performance`}
        </h2>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 size={14} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('slots')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'slots' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListOrdered size={14} /> Slots
          </button>
        </div>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-200">
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-between h-24">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Calendar size={16} className="text-blue-500" />
              <span>Frames</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{totalFramesCompleted}</span>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 flex flex-col justify-between h-24">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Eye size={16} className="text-purple-500" />
              <span>Faces</span>
            </div>
            <span className="text-2xl font-bold text-purple-600">{totalFacesCompleted}</span>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 flex flex-col justify-between h-24">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock size={16} className="text-orange-500" />
              <span>Time</span>
            </div>
            <span className="text-2xl font-bold text-orange-600">{totalTimeSpent}m</span>
          </div>
        </div>
      )}

      {/* Tab Content 2: Slot Report */}
      {activeTab === 'slots' && (
        <div className="overflow-hidden rounded-lg border border-slate-200 animate-in fade-in duration-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Time Slot</th>
                <th className="px-4 py-3 font-medium text-slate-600">Start - End</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">Faces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slotNames.map(slot => {
                const slotEntries = slotData[slot];
                if (slotEntries.length === 0) {
                  return (
                    <tr key={slot} className="text-slate-400 bg-white">
                      <td className="px-4 py-3">{slot}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3 text-right">0</td>
                    </tr>
                  );
                }
                const sorted = [...slotEntries].sort((a, b) => a.id - b.id);
                const startFrame = sorted[0].frameNumber;
                const endFrame = sorted[sorted.length - 1].frameNumber;
                const totalSlotFaces = slotEntries.reduce((sum, e) => sum + e.facesCompleted, 0);

                return (
                  <tr key={slot} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{slot}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {startFrame} <span className="text-slate-400 mx-1">→</span> {endFrame} 
                      <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        ({slotEntries.length})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-purple-600">{totalSlotFaces}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
