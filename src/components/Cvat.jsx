import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileVideo,
  Play,
  Download,
  Calendar,
  Eye,
  Clock,
  Plus,
  Square,
  Folder,
  Filter,
  Upload,
  Trash2,
  Edit2,
  Check,
  X
} from "lucide-react";

import useLocalStorage from "../hooks/useLocalStorage";

const CvatCalculation = () => {
  const [isWorking, setIsWorking] = useLocalStorage("cvat_isWorking", false);
  const [startTime, setStartTime] = useLocalStorage("cvat_startTime", null);
  const [frameNumber, setFrameNumber] = useLocalStorage("cvat_frameNumber", "");
  const [facesCompleted, setFacesCompleted] = useLocalStorage("cvat_facesCompleted", "");
  const [fileName, setFileName] = useLocalStorage("cvat_fileName", "");
  const [entries, setEntries] = useLocalStorage("cvat_entries", []);

  const todayString = new Date().toLocaleDateString();

  // Filters
  const [selectedExportFile, setSelectedExportFile] = useState("All");
  const [dateFilter, setDateFilter] = useState(todayString); 

  // NEW: State for Edit Mode
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ frameNumber: "", facesCompleted: "", fileName: "" });

  const frameInputRef = useRef(null);
  const facesInputRef = useRef(null);
  const fileInputRef = useRef(null); 

  const handleStartWorking = useCallback(() => {
    setStartTime(Date.now());
    setIsWorking(true);
  }, [setStartTime, setIsWorking]);

  const handleCancel = () => {
    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null);
  };

  const isFormValid = frameNumber.trim() !== "" && facesCompleted.trim() !== "" && fileName.trim() !== "";

  const handleCompleteFrame = useCallback(() => {
    if (!isFormValid) return; 

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    const newEntry = {
      id: Date.now(),
      date: todayString,
      fileName: fileName.trim(),
      frameNumber: frameNumber.trim(),
      facesCompleted: parseInt(facesCompleted, 10) || 0,
      durationMinutes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setEntries([newEntry, ...entries]);
    setSelectedExportFile(fileName.trim());
    setDateFilter(todayString); 
    
    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null);
  }, [isFormValid, fileName, frameNumber, facesCompleted, startTime, entries, setEntries, setIsWorking, setFrameNumber, setFacesCompleted, setStartTime, todayString]);

  // --- DELETE & EDIT LOGIC ---
  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this frame?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      frameNumber: entry.frameNumber,
      facesCompleted: entry.facesCompleted,
      fileName: entry.fileName
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = (id) => {
    if (editForm.frameNumber.trim() === "" || editForm.fileName.trim() === "") {
      alert("Frame Number and File Name cannot be empty.");
      return;
    }

    setEntries(entries.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          frameNumber: editForm.frameNumber.trim(),
          facesCompleted: parseInt(editForm.facesCompleted, 10) || 0,
          fileName: editForm.fileName.trim()
        };
      }
      return entry;
    }));
    setEditingId(null);
  };

  // --- CSV IMPORT LOGIC ---
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split("\n");
      
      const importedEntries = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cleanLine = line.replace(/^"|"$/g, '');
        const cols = cleanLine.split('","');
        
        if (cols.length >= 6) {
          importedEntries.push({
            id: Date.now() + i, 
            date: cols[0],
            timestamp: cols[1],
            fileName: cols[2],
            frameNumber: cols[3],
            facesCompleted: parseInt(cols[4], 10) || 0,
            durationMinutes: parseInt(cols[5], 10) || 0
          });
        }
      }

      const existingSignatures = new Set(entries.map(e => `${e.date}-${e.fileName}-${e.frameNumber}`));
      const newEntries = importedEntries.filter(
        e => !existingSignatures.has(`${e.date}-${e.fileName}-${e.frameNumber}`)
      );

      if (newEntries.length > 0) {
        const merged = [...newEntries, ...entries].sort((a, b) => b.id - a.id);
        setEntries(merged);
        alert(`Successfully imported ${newEntries.length} new frames!`);
      } else {
        alert("No new frames found. This data is already in your tracker.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // --- DYNAMIC DATE GENERATION ---
  const availableDates = [...new Set(entries.map(e => e.date))];
  if (!availableDates.includes(todayString)) {
    availableDates.push(todayString);
  }
  availableDates.sort((a, b) => new Date(b) - new Date(a));

  // --- FILTERING LOGIC ---
  const dateFilteredEntries = dateFilter === "All Time" 
    ? entries
    : entries.filter(entry => entry.date === dateFilter);

  const uniqueFilesToDisplay = [...new Set(dateFilteredEntries.map(e => e.fileName))];

  const finalDisplayEntries = selectedExportFile === "All" 
    ? dateFilteredEntries 
    : dateFilteredEntries.filter(entry => entry.fileName === selectedExportFile);

  const groupedEntries = finalDisplayEntries.reduce((acc, entry) => {
    if (!acc[entry.fileName]) acc[entry.fileName] = [];
    acc[entry.fileName].push(entry);
    return acc;
  }, {});

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (finalDisplayEntries.length === 0) {
      alert("No data to export for this selection!");
      return;
    }

    const headers = ["Date", "Time", "File Name", "Frame Number", "Faces Completed", "Duration (Minutes)"];
    const csvRows = finalDisplayEntries.map(entry => {
      return [
        `"${entry.date}"`,
        `"${entry.timestamp}"`,
        `"${entry.fileName}"`,
        `"${entry.frameNumber}"`,
        `"${entry.facesCompleted}"`,
        `"${entry.durationMinutes}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
    const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    link.setAttribute("download", `cvat_log_${safeFileName}_${dateStrForFile}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (isWorking && frameInputRef.current) frameInputRef.current.focus();
  }, [isWorking]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isWorking && e.code === "Space" && e.target.tagName !== "INPUT" && editingId === null) {
        e.preventDefault(); 
        if (fileName.trim() !== "") handleStartWorking();
        else alert("Please enter a File Name first!");
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isWorking, fileName, handleStartWorking, editingId]);

  const handleFrameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      if (frameNumber.trim() !== "") facesInputRef.current?.focus(); 
    }
  };

  const handleFacesKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isFormValid) handleCompleteFrame(); 
    }
  };

  // Totals for the left panel
  const todaysEntries = entries.filter((entry) => entry.date === todayString);
  const totalFramesCompleted = todaysEntries.length;
  const totalFacesCompleted = todaysEntries.reduce((sum, entry) => sum + entry.facesCompleted, 0);
  const totalTimeSpent = todaysEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileVideo size={36} className="text-slate-900" />
          <h1 className="text-4xl font-bold text-slate-900">
            CVAT Work Tracker
          </h1>
        </div>
        <p className="text-slate-500">
          Face Annotation Progress Tracker • Multi-System Ready
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Active Task</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Folder size={16} className="text-slate-500" />
                Current File / Video Name
              </label>
              <input
                type="text"
                placeholder="e.g., video_batch_01.mp4"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={isWorking}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <hr className="border-slate-100 mb-6" />

            {!isWorking ? (
              <button
                onClick={handleStartWorking}
                disabled={fileName.trim() === ""}
                className={`w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-colors group ${
                  fileName.trim() === "" 
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                    : "bg-[#0B0F19] hover:bg-slate-800 text-white"
                }`}
              >
                <Play size={18} />
                <span className="font-medium">Start Working on Frame</span>
                {fileName.trim() !== "" && (
                  <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                    Press Space
                  </span>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-green-700 text-sm">Working since</p>
                    <p className="text-green-700 font-semibold">
                      {startTime ? new Date(startTime).toLocaleTimeString("en-US", { hour12: false }) : ""}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">Frame Number</label>
                    <span className="text-xs text-slate-400">Press Enter ↵</span>
                  </div>
                  <input
                    ref={frameInputRef}
                    type="text"
                    value={frameNumber}
                    onChange={(e) => setFrameNumber(e.target.value)}
                    onKeyDown={handleFrameKeyDown}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">Number of Faces</label>
                    <span className="text-xs text-slate-400">Press Enter ↵</span>
                  </div>
                  <input
                    ref={facesInputRef}
                    type="number"
                    value={facesCompleted}
                    onChange={(e) => setFacesCompleted(e.target.value)}
                    onKeyDown={handleFacesKeyDown}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCompleteFrame}
                    disabled={!isFormValid}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-colors ${
                      isFormValid ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-500 text-white cursor-not-allowed opacity-90"
                    }`}
                  >
                    <Plus size={18} />
                    Complete Frame
                  </button>
                  <button onClick={handleCancel} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                    <Square size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800">Today's Grand Totals</h2>
            <p className="text-sm text-slate-500 mb-4">{todayString}</p>

            <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-lg font-semibold text-slate-800">Work History</h2>
              
              <div className="mt-2 flex gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setSelectedExportFile("All"); 
                  }}
                  className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer w-36"
                >
                  <option value="All Time">All Time</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {date === todayString ? `Today (${date})` : date}
                    </option>
                  ))}
                </select>

                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  <select
                    value={selectedExportFile}
                    onChange={(e) => setSelectedExportFile(e.target.value)}
                    className="bg-transparent border-none text-sm text-slate-700 w-full focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="All">All Files</option>
                    {uniqueFilesToDisplay.map((file) => (
                      <option key={file} value={file}>{file}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0 mt-1">
              <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                <Download size={14} /> Export
              </button>
              
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                <Upload size={14} /> Import
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mt-2">
            {finalDisplayEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-8">
                <h3 className="text-slate-500 font-medium mb-1">No entries found</h3>
                <p className="text-slate-400 text-sm">Start working or import previous data</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedEntries).map((file) => (
                  <div key={file} className="space-y-3">
                    {selectedExportFile === "All" && (
                      <h3 className="text-sm font-bold text-slate-700 border-b pb-1 flex items-center gap-2">
                        <Folder size={14} />
                        {file}
                        <span className="text-xs font-normal text-slate-400 ml-auto">
                          {groupedEntries[file].length} frames
                        </span>
                      </h3>
                    )}
                    
                    {groupedEntries[file].map((entry) => (
                      <div key={entry.id} className="p-3 border border-slate-100 bg-slate-50 rounded-lg ml-1 border-l-4 border-l-blue-400 group relative">
                        
                        {/* INLINE EDIT MODE */}
                        {editingId === entry.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-slate-500 font-medium block">File Name</label>
                                <input 
                                  type="text" 
                                  value={editForm.fileName} 
                                  onChange={(e) => setEditForm({...editForm, fileName: e.target.value})}
                                  className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 font-medium block">Frame</label>
                                <input 
                                  type="text" 
                                  value={editForm.frameNumber} 
                                  onChange={(e) => setEditForm({...editForm, frameNumber: e.target.value})}
                                  className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 font-medium block">Faces</label>
                                <input 
                                  type="number" 
                                  value={editForm.facesCompleted} 
                                  onChange={(e) => setEditForm({...editForm, facesCompleted: e.target.value})}
                                  className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={cancelEditing} className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-200 flex items-center gap-1">
                                <X size={12}/> Cancel
                              </button>
                              <button onClick={() => saveEdit(entry.id)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                                <Check size={12}/> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          
                          /* STANDARD DISPLAY MODE */
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">Frame: {entry.frameNumber}</p>
                              <p className="text-xs text-slate-500">
                                {dateFilter === "All Time" ? `${entry.date} at ` : ""}{entry.timestamp}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-purple-600">{entry.facesCompleted} faces</p>
                                <p className="text-xs text-slate-500">{entry.durationMinutes} min</p>
                              </div>
                              
                              {/* Action Buttons (Visible on Hover) */}
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditing(entry)} 
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEntry(entry.id)} 
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CvatCalculation;