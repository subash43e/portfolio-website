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
  X,
  Timer,
  ListOrdered,
  BarChart2,
  FileText,
  Table
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import useLocalStorage from "../../hooks/useLocalStorage";

const CvatCalculation = () => {
  const [isWorking, setIsWorking] = useLocalStorage("cvat_isWorking", false);
  const [startTime, setStartTime] = useLocalStorage("cvat_startTime", null);
  const [frameNumber, setFrameNumber] = useLocalStorage("cvat_frameNumber", "");
  const [facesCompleted, setFacesCompleted] = useLocalStorage("cvat_facesCompleted", "");
  const [fileName, setFileName] = useLocalStorage("cvat_fileName", "");
  const [entries, setEntries] = useLocalStorage("cvat_entries", []);

  const [now, setNow] = useState(Date.now());

  const todayString = new Date().toLocaleDateString();
  const [selectedExportFile, setSelectedExportFile] = useState("All");
  const [dateFilter, setDateFilter] = useState(todayString); 

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ frameNumber: "", facesCompleted: "", fileName: "" });

  // NEW: State to control the bottom-left Dashboard tabs
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "slots"

  const frameInputRef = useRef(null);
  const facesInputRef = useRef(null);
  const fileInputRef = useRef(null); 

  // Live stopwatch effect
  useEffect(() => {
    let interval;
    if (isWorking) {
      interval = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking]);

  const handleStartWorking = useCallback(() => {
    setIsWorking(true);
    setNow(Date.now()); 
  }, [setIsWorking]);

  const handleCancel = () => {
    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null);
  };

  const isFormValid = frameNumber.trim() !== "" && facesCompleted.trim() !== "" && fileName.trim() !== "";

  const handleCompleteFrame = useCallback(() => {
    if (!isFormValid || !startTime) return; 

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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startTimeString: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setEntries([newEntry, ...entries]);
    setSelectedExportFile(fileName.trim());
    setDateFilter(todayString); 
    
    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null); 
  }, [isFormValid, fileName, frameNumber, facesCompleted, startTime, entries, setEntries, setIsWorking, setFrameNumber, setFacesCompleted, setStartTime, todayString]);

  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this frame?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditForm({ frameNumber: entry.frameNumber, facesCompleted: entry.facesCompleted, fileName: entry.fileName });
  };

  const cancelEditing = () => setEditingId(null);

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
      const newEntries = importedEntries.filter(e => !existingSignatures.has(`${e.date}-${e.fileName}-${e.frameNumber}`));

      if (newEntries.length > 0) {
        setEntries([...newEntries, ...entries].sort((a, b) => b.id - a.id));
        alert(`Successfully imported ${newEntries.length} new frames!`);
      } else {
        alert("No new frames found.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const availableDates = [...new Set(entries.map(e => e.date))];
  if (!availableDates.includes(todayString)) availableDates.push(todayString);
  availableDates.sort((a, b) => new Date(b) - new Date(a));

  const dateFilteredEntries = dateFilter === "All Time" ? entries : entries.filter(entry => entry.date === dateFilter);
  const uniqueFilesToDisplay = [...new Set(dateFilteredEntries.map(e => e.fileName))];
  const finalDisplayEntries = selectedExportFile === "All" ? dateFilteredEntries : dateFilteredEntries.filter(entry => entry.fileName === selectedExportFile);
  
  const groupedEntries = finalDisplayEntries.reduce((acc, entry) => {
    if (!acc[entry.fileName]) acc[entry.fileName] = [];
    acc[entry.fileName].push(entry);
    return acc;
  }, {});

  const handleExportCSV = () => {
    if (finalDisplayEntries.length === 0) return alert("No data to export!");
    const headers = ["Date", "Start Time", "End Time", "File Name", "Frame Number", "Faces Completed", "Duration (Minutes)"];
    const csvRows = finalDisplayEntries.map(entry => [
      `"${entry.date}"`, `"${entry.startTimeString || "N/A"}"`, `"${entry.timestamp}"`, `"${entry.fileName}"`, `"${entry.frameNumber}"`, `"${entry.facesCompleted}"`, `"${entry.durationMinutes}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
    const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `cvat_log_${safeFileName}_${dateStrForFile}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (finalDisplayEntries.length === 0) return alert("No data to export!");
    const wsData = finalDisplayEntries.map(entry => ({
      Date: entry.date,
      "Start Time": entry.startTimeString || "N/A",
      "End Time": entry.timestamp,
      "File Name": entry.fileName,
      "Frame Number": entry.frameNumber,
      "Faces Completed": entry.facesCompleted,
      "Duration (Min)": entry.durationMinutes
    }));
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CVAT Data");
    const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
    const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `cvat_log_${safeFileName}_${dateStrForFile}.xlsx`);
  };

  const handleExportPDF = () => {
    if (finalDisplayEntries.length === 0) return alert("No data to export!");
    const doc = new jsPDF();
    doc.text("CVAT Report", 14, 15);
    
    const tableColumn = ["Date", "Start Time", "End Time", "File Name", "Frame", "Faces", "Duration (Min)"];
    const tableRows = [];

    finalDisplayEntries.forEach(entry => {
      const rowData = [
        entry.date,
        entry.startTimeString || "N/A",
        entry.timestamp,
        entry.fileName,
        entry.frameNumber,
        entry.facesCompleted,
        entry.durationMinutes
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
    const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`cvat_report_${safeFileName}_${dateStrForFile}.pdf`);
  };

  useEffect(() => {
    if (isWorking && !startTime && frameInputRef.current) {
      frameInputRef.current.focus();
    }
  }, [isWorking, startTime]);

  useEffect(() => {
    if (isWorking && startTime && facesInputRef.current) {
      facesInputRef.current.focus();
    }
  }, [isWorking, startTime]);

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
      if (frameNumber.trim() !== "") {
        if (!startTime) {
          const nowMs = Date.now();
          setStartTime(nowMs);
          setNow(nowMs);
        }
      }
    }
  };

  const handleFacesKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isFormValid) handleCompleteFrame(); 
    }
  };

  const formatStopwatch = (startMs, currentMs) => {
    if (!startMs) return "00:00";
    const totalSeconds = Math.max(0, Math.floor((currentMs - startMs) / 1000));
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const todaysEntries = entries.filter((entry) => entry.date === todayString);

  // --- SLOT CALCULATION LOGIC ---
  const slotNames = ["11:00 AM", "1:00 PM", "2:00 PM", "5:00 PM", "6:00 PM", "Overtime"];
  const slotData = slotNames.reduce((acc, slot) => ({ ...acc, [slot]: [] }), {});
  const entriesForSlots = dateFilter === "All Time" ? finalDisplayEntries.filter(entry => entry.date === todayString) : finalDisplayEntries;
  
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileVideo size={36} className="text-slate-900" />
          <h1 className="text-4xl font-bold text-slate-900">CVAT Work Tracker</h1>
        </div>
        <p className="text-slate-500">Face Annotation Progress Tracker • Precision Stopwatch</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Active Task Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Active Task</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Folder size={16} className="text-slate-500" /> Current File
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
                className={`w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-colors group ${fileName.trim() === "" ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#0B0F19] hover:bg-slate-800 text-white"}`}
              >
                <Play size={18} />
                <span className="font-medium">Prepare Frame</span>
                {fileName.trim() !== "" && <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">Press Space</span>}
              </button>
            ) : (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 flex justify-between items-center transition-colors ${startTime ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div>
                    <p className={`text-sm font-medium ${startTime ? 'text-red-700' : 'text-blue-700'}`}>
                      {startTime ? "Recording Time..." : "Awaiting Frame Number"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Timer size={18} className={startTime ? 'text-red-600' : 'text-blue-500'} />
                      <p className={`font-mono text-2xl font-bold tracking-wider ${startTime ? 'text-red-600' : 'text-blue-600'}`}>
                        {formatStopwatch(startTime, now)}
                      </p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${startTime ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}></div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">Frame Number</label>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Hit Enter ↵ to Start Timer</span>
                  </div>
                  <input
                    ref={frameInputRef}
                    type="text"
                    value={frameNumber}
                    onChange={(e) => setFrameNumber(e.target.value)}
                    onKeyDown={handleFrameKeyDown}
                    disabled={startTime !== null} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">Faces Completed</label>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Hit Enter ↵ to Stop & Save</span>
                  </div>
                  <input
                    ref={facesInputRef}
                    type="number"
                    value={facesCompleted}
                    onChange={(e) => setFacesCompleted(e.target.value)}
                    onKeyDown={handleFacesKeyDown}
                    disabled={startTime === null} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-100"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 font-medium">
                    <Square size={16} /> Cancel Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NEW: TABBED DASHBOARD CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            
            {/* Tab Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">
                {dateFilter === "All Time" ? "Today's Performance" : `${dateFilter} Performance`}
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-140px)] min-h-[400px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-lg font-semibold text-slate-800">Work History</h2>
              <div className="mt-2 flex gap-2">
                <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setSelectedExportFile("All"); }} className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer w-36">
                  <option value="All Time">All Time</option>
                  {availableDates.map(date => <option key={date} value={date}>{date === todayString ? `Today (${date})` : date}</option>)}
                </select>
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  <select value={selectedExportFile} onChange={(e) => setSelectedExportFile(e.target.value)} className="bg-transparent border-none text-sm text-slate-700 w-full focus:outline-none focus:ring-0 cursor-pointer">
                    <option value="All">All Files</option>
                    {uniqueFilesToDisplay.map((file) => <option key={file} value={file}>{file}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 mt-1">
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors" title="Export CSV"><Download size={14} /></button>
                <button onClick={handleExportExcel} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700 hover:bg-green-100 transition-colors" title="Export Excel"><Table size={14} /></button>
                <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 hover:bg-red-100 transition-colors" title="Export PDF"><FileText size={14} /></button>
              </div>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"><Upload size={14} /> Import</button>
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
                      <h3 className="text-sm font-bold text-slate-700 border-b pb-1 flex items-center gap-2"><Folder size={14} />{file}<span className="text-xs font-normal text-slate-400 ml-auto">{groupedEntries[file].length} frames</span></h3>
                    )}
                    {groupedEntries[file].map((entry) => (
                      <div key={entry.id} className="p-3 border border-slate-100 bg-slate-50 rounded-lg ml-1 border-l-4 border-l-blue-400 group relative">
                        {editingId === entry.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-xs text-slate-500 font-medium block">File Name</label><input type="text" value={editForm.fileName} onChange={(e) => setEditForm({...editForm, fileName: e.target.value})} className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white" /></div>
                              <div><label className="text-xs text-slate-500 font-medium block">Frame</label><input type="text" value={editForm.frameNumber} onChange={(e) => setEditForm({...editForm, frameNumber: e.target.value})} className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white" /></div>
                              <div><label className="text-xs text-slate-500 font-medium block">Faces</label><input type="number" value={editForm.facesCompleted} onChange={(e) => setEditForm({...editForm, facesCompleted: e.target.value})} className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white" /></div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={cancelEditing} className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-200 flex items-center gap-1"><X size={12}/> Cancel</button>
                              <button onClick={() => saveEdit(entry.id)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Check size={12}/> Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-800 text-sm">Frame: {entry.frameNumber}</p>
                              <p className="text-xs text-slate-500">{dateFilter === "All Time" ? `${entry.date} at ` : ""}{entry.startTimeString ? `${entry.startTimeString} - ${entry.timestamp}` : entry.timestamp}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-purple-600">{entry.facesCompleted} faces</p>
                                <p className="text-xs text-slate-500">{entry.durationMinutes} min</p>
                              </div>
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditing(entry)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>
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





// i need to fix three problem.
// first one was the ui. if getting to big i give lots of data. I needed a scroll version.
// second one was the data has exporting is always giving the data as a time is staring time and after time difference only getting, but i need a staring and ending time data so i can she which time end the frame.
// in timer its always starting at the nagative value i neeed to fix this also.
