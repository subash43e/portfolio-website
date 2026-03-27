import React from "react";
import { BarChart2, ListOrdered, Calendar, Eye, Clock } from "lucide-react";

const DashboardStats = ({ dateFilter, finalDisplayEntries, activeTab, setActiveTab }) => {
  const slotNames = ["11:00 AM", "1:00 PM", "2:00 PM", "5:00 PM", "6:00 PM", "Overtime"];
  const slotData = slotNames.reduce((acc, slot) => ({ ...acc, [slot]: [] }), {});

  const totalFrames = finalDisplayEntries.length;
  const totalFaces = finalDisplayEntries.reduce((sum, e) => sum + e.facesCompleted, 0);
  const totalTime = finalDisplayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

  finalDisplayEntries.forEach(entry => {
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
    } catch (e) { /* ignore */ }

    const t = hours + (minutes / 60);
    if (t <= 11) slotData["11:00 AM"].push(entry);
    else if (t <= 13) slotData["1:00 PM"].push(entry);
    else if (t <= 14) slotData["2:00 PM"].push(entry);
    else if (t <= 17) slotData["5:00 PM"].push(entry);
    else if (t <= 18) slotData["6:00 PM"].push(entry);
    else slotData["Overtime"].push(entry);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">
          {dateFilter === "All Time" ? "All Time" : dateFilter}
        </p>
        <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
          {[
            { id: 'overview', icon: BarChart2, label: 'Overview' },
            { id: 'slots', icon: ListOrdered, label: 'Slots' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Frames', value: totalFrames, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { icon: Eye, label: 'Faces', value: totalFaces, color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Clock, label: 'Minutes', value: totalTime, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={13} className={color} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Slots tab */}
      {activeTab === 'slots' && (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wider text-slate-400">Slot</th>
                <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wider text-slate-400">Frames</th>
                <th className="px-3 py-2.5 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400">Faces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {slotNames.map(slot => {
                const slotEntries = slotData[slot];
                const sorted = [...slotEntries].sort((a, b) => a.id - b.id);
                const faces = slotEntries.reduce((sum, e) => sum + e.facesCompleted, 0);
                const isEmpty = slotEntries.length === 0;
                return (
                  <tr key={slot} className={isEmpty ? 'opacity-35' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="px-3 py-2.5 font-semibold text-slate-600">{slot}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {isEmpty ? '—' : (
                        <span>
                          {sorted[0].frameNumber}
                          <span className="mx-1 text-slate-300">→</span>
                          {sorted[sorted.length - 1].frameNumber}
                          <span className="ml-1.5 text-indigo-500 font-medium">({slotEntries.length})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-purple-600">{faces || 0}</td>
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
