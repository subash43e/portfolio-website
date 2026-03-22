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
  Search,
  Settings,
  Timer,
  ListOrdered,
  BarChart2,
  FileText,
  Table,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  handleExportCSV,
  handleExportExcel,
  handleExportPDF,
} from "./cvat/exportUtils";
import DashboardStats from "./cvat/DashboardStats";

import useLocalStorage from "../../hooks/useLocalStorage";
import toast, { Toaster } from "react-hot-toast";

const CvatCalculation = () => {
  const [isWorking, setIsWorking] = useLocalStorage("cvat_isWorking", false);
  const [startTime, setStartTime] = useLocalStorage("cvat_startTime", null);
  const [frameNumber, setFrameNumber] = useLocalStorage("cvat_frameNumber", "");
  const [facesCompleted, setFacesCompleted] = useLocalStorage(
    "cvat_facesCompleted",
    "",
  );
  const [fileName, setFileName] = useLocalStorage("cvat_fileName", "");
  const [entries, setEntries] = useLocalStorage("cvat_entries", []);

  const [now, setNow] = useState(Date.now());

  const todayString = new Date().toLocaleDateString();
  const [selectedExportFile, setSelectedExportFile] = useState("All");
  const [dateFilter, setDateFilter] = useState(todayString);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [editingId, setEditingId] = useState(null);
  
  // NEW: State for modals (Cancel, Delete, Clear)
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const openModal = (type, data = null) => setModalState({ isOpen: true, type, data });
  const closeModal = () => setModalState({ isOpen: false, type: null, data: null });
  const [editForm, setEditForm] = useState({
    frameNumber: "",
    facesCompleted: "",
    fileName: "",
  });

  // NEW: State to control the bottom-left Dashboard tabs
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "slots"

  // NEW: State for collapsible folders in History
  const [collapsedFiles, setCollapsedFiles] = useState({});
  const toggleFile = (fileName) => {
    setCollapsedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  };

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
    closeModal();
  };

  const handleCancelClick = () => {
    if (isWorking && (startTime || frameNumber || facesCompleted)) {
      openModal("CANCEL_TASK");
    } else {
      handleCancel();
    }
  };

  const isFormValid =
    frameNumber.trim() !== "" &&
    facesCompleted.trim() !== "" &&
    fileName.trim() !== "";

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
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      startTimeString: new Date(startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setEntries([newEntry, ...entries]);
    setSelectedExportFile(fileName.trim());
    setDateFilter(todayString);

    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null);
  }, [
    isFormValid,
    fileName,
    frameNumber,
    facesCompleted,
    startTime,
    entries,
    setEntries,
    setIsWorking,
    setFrameNumber,
    setFacesCompleted,
    setStartTime,
    todayString,
  ]);

  const handleDeleteEntry = (id) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    toast.success("Frame deleted successfully");
    closeModal();
  };

  const confirmDeleteEntry = (id) => {
    openModal("DELETE_ENTRY", id);
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      frameNumber: entry.frameNumber,
      facesCompleted: entry.facesCompleted,
      fileName: entry.fileName,
    });
  };

  const cancelEditing = () => setEditingId(null);

  const saveEdit = (id) => {
    if (editForm.frameNumber.trim() === "" || editForm.fileName.trim() === "") {
      toast.error("Frame Number and File Name cannot be empty.");
      return;
    }
    setEntries(
      entries.map((entry) => {
        if (entry.id === id) {
          return {
            ...entry,
            frameNumber: editForm.frameNumber.trim(),
            facesCompleted: parseInt(editForm.facesCompleted, 10) || 0,
            fileName: editForm.fileName.trim(),
          };
        }
        return entry;
      }),
    );
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
        const cleanLine = line.replace(/^"|"$/g, "");
        const cols = cleanLine.split('","');
        if (cols.length >= 6) {
          importedEntries.push({
            id: Date.now() + i,
            date: cols[0],
            timestamp: cols[1],
            fileName: cols[2],
            frameNumber: cols[3],
            facesCompleted: parseInt(cols[4], 10) || 0,
            durationMinutes: parseInt(cols[5], 10) || 0,
          });
        }
      }

      const existingSignatures = new Set(
        entries.map((e) => `${e.date}-${e.fileName}-${e.frameNumber}`),
      );
      const newEntries = importedEntries.filter(
        (e) =>
          !existingSignatures.has(`${e.date}-${e.fileName}-${e.frameNumber}`),
      );

      if (newEntries.length > 0) {
        setEntries([...newEntries, ...entries].sort((a, b) => b.id - a.id));
        toast.success(`Successfully imported ${newEntries.length} new frames!`);
      } else {
        toast.error("No new frames found.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const availableDates = [...new Set(entries.map((e) => e.date))];
  if (!availableDates.includes(todayString)) availableDates.push(todayString);
  availableDates.sort((a, b) => new Date(b) - new Date(a));

  const dateFilteredEntries =
    dateFilter === "All Time"
      ? entries
      : entries.filter((entry) => entry.date === dateFilter);
  const uniqueFilesToDisplay = [
    ...new Set(dateFilteredEntries.map((e) => e.fileName)),
  ];
  const selectedFileEntries =
    selectedExportFile === "All"
      ? dateFilteredEntries
      : dateFilteredEntries.filter(
          (entry) => entry.fileName === selectedExportFile,
        );
        
  const finalDisplayEntries = selectedFileEntries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.fileName.toLowerCase().includes(q) ||
      entry.frameNumber.toString().toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(finalDisplayEntries.length / itemsPerPage));
  const paginatedEntries = finalDisplayEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const groupedEntries = paginatedEntries.reduce((acc, entry) => {
    if (!acc[entry.fileName]) acc[entry.fileName] = [];
    acc[entry.fileName].push(entry);
    return acc;
  }, {});

  // Export logic moved to exportUtils.js

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
      if (
        !isWorking &&
        e.code === "Space" &&
        e.target.tagName !== "INPUT" &&
        editingId === null
      ) {
        e.preventDefault();
        if (fileName.trim() !== "") handleStartWorking();
        else toast.error("Please enter a File Name first!");
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
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const todaysEntries = entries.filter((entry) => entry.date === todayString);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto mb-8 text-center relative">
        <div className="absolute right-0 top-0">
          <button 
            onClick={() => openModal("SETTINGS")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
            title="Settings & Data"
            aria-label="Open Settings and Data Management"
          >
            <Settings size={20} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileVideo size={36} className="text-slate-900" />
          <h1 className="text-4xl font-bold text-slate-900">
            CVAT Work Tracker
          </h1>
        </div>
        <p className="text-slate-500">
          Face Annotation Progress Tracker • Precision Stopwatch
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Active Task Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">
              Active Task
            </h2>

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
                {fileName.trim() !== "" && (
                  <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                    Press Space
                  </span>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div
                  className={`border rounded-lg p-4 flex justify-between items-center transition-colors ${startTime ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${startTime ? "text-red-700" : "text-blue-700"}`}
                    >
                      {startTime
                        ? "Recording Time..."
                        : "Awaiting Frame Number"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Timer
                        size={18}
                        className={startTime ? "text-red-600" : "text-blue-500"}
                      />
                      <p
                        className={`font-mono text-2xl font-bold tracking-wider ${startTime ? "text-red-600" : "text-blue-600"}`}
                      >
                        {formatStopwatch(startTime, now)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${startTime ? "bg-red-500 animate-pulse" : "bg-blue-400"}`}
                  ></div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">
                      Frame Number
                    </label>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Hit Enter ↵ to Start Timer
                    </span>
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
                    <label className="block text-sm font-medium text-slate-700">
                      Faces Completed
                    </label>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Hit Enter ↵ to Stop & Save
                    </span>
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
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 font-medium"
                  >
                    <Square size={16} /> Cancel Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NEW: TABBED DASHBOARD CARD */}
          {/* NEW: TABBED DASHBOARD CARD */}
          <DashboardStats
            dateFilter={dateFilter}
            finalDisplayEntries={finalDisplayEntries}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-140px)] min-h-[400px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Work History
              </h2>
              <div className="mt-2 flex flex-col 2xl:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search frame or file..."
                    aria-label="Search frame or file"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setSelectedExportFile("All");
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer w-36"
                  aria-label="Filter work history by date"
                >
                  <option value="All Time">All Time</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date === todayString ? `Today (${date})` : date}
                    </option>
                  ))}
                </select>
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  <select
                    value={selectedExportFile}
                    onChange={(e) => {
                      setSelectedExportFile(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-sm text-slate-700 w-full focus:outline-none focus:ring-0 cursor-pointer"
                    aria-label="Filter work history by file name"
                  >
                    <option value="All">All Files</option>
                    {uniqueFilesToDisplay.map((file) => (
                      <option key={file} value={file}>
                        {file}
                      </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 mt-1">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleExportCSV(
                      finalDisplayEntries,
                      dateFilter,
                      selectedExportFile,
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Export CSV"
                  aria-label="Export work history as CSV"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() =>
                    handleExportExcel(
                      finalDisplayEntries,
                      dateFilter,
                      selectedExportFile,
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  title="Export Excel"
                  aria-label="Export work history as Excel"
                >
                  <Table size={14} />
                </button>
                <button
                  onClick={() =>
                    handleExportPDF(
                      finalDisplayEntries,
                      dateFilter,
                      selectedExportFile,
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                  title="Export PDF"
                  aria-label="Export work history as PDF"
                >
                  <FileText size={14} />
                </button>
              </div>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Upload size={14} /> Import
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 mt-2">
            {finalDisplayEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-8">
                <h3 className="text-slate-500 font-medium mb-1">
                  No entries found
                </h3>
                <p className="text-slate-400 text-sm">
                  Start working or import previous data
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedEntries).map((file) => (
                  <div key={file} className="space-y-3">
                    {selectedExportFile === "All" && (
                      <h3
                        className="text-sm font-bold text-slate-700 border-b pb-1 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => toggleFile(file)}
                      >
                        {collapsedFiles[file] ? (
                          <ChevronRight size={14} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={14} className="text-slate-400" />
                        )}
                        <Folder size={14} className="text-slate-500" />
                        {file}
                        <span className="text-xs font-normal text-slate-400 ml-auto">
                          {groupedEntries[file].length} frames
                        </span>
                      </h3>
                    )}
                    {(!collapsedFiles[file] || selectedExportFile !== "All") &&
                      groupedEntries[file].map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 border border-slate-100 bg-slate-50 rounded-lg ml-1 border-l-4 border-l-blue-400 group relative"
                        >
                          {editingId === entry.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-slate-500 font-medium block">
                                    File Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.fileName}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        fileName: e.target.value,
                                      })
                                    }
                                    className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 font-medium block">
                                    Frame
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.frameNumber}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        frameNumber: e.target.value,
                                      })
                                    }
                                    className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 font-medium block">
                                    Faces
                                  </label>
                                  <input
                                    type="number"
                                    value={editForm.facesCompleted}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        facesCompleted: e.target.value,
                                      })
                                    }
                                    className="w-full border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-200 flex items-center gap-1"
                                >
                                  <X size={12} /> Cancel
                                </button>
                                <button
                                  onClick={() => saveEdit(entry.id)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                                >
                                  <Check size={12} /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  Frame: {entry.frameNumber}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {dateFilter === "All Time"
                                    ? `${entry.date} at `
                                    : ""}
                                  {entry.startTimeString
                                    ? `${entry.startTimeString} - ${entry.timestamp}`
                                    : entry.timestamp}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-medium text-purple-600">
                                    {entry.facesCompleted} faces
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {entry.durationMinutes} min
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditing(entry)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit"
                                    aria-label={`Edit frame ${entry.frameNumber}`}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteEntry(entry.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                    aria-label={`Delete frame ${entry.frameNumber}`}
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
          
          {/* Pagination Controls */}
          {finalDisplayEntries.length > 0 && totalPages > 1 && (
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, finalDisplayEntries.length)} of {finalDisplayEntries.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 border border-slate-200 rounded">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Settings Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            {modalState.type === "SETTINGS" ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Settings & Data</h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-1">Backup Data</h4>
                    <p className="text-sm text-slate-500 mb-3">Export your entire work history as a CSV file for safekeeping.</p>
                    <button 
                      onClick={() => { handleExportCSV(entries, "All Time", "All"); toast.success("Backup exported!"); }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Export Full Backup (CSV)
                    </button>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-semibold text-red-800 mb-1">Danger Zone</h4>
                    <p className="text-sm text-red-600 mb-3 opacity-90">Permanently delete all tracking data from this browser. This cannot be undone.</p>
                    <button 
                      onClick={() => openModal("CLEAR_ALL")}
                      className="w-full py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Factory Reset Data
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {modalState.type === "CANCEL_TASK" && "Cancel Active Task?"}
                  {modalState.type === "DELETE_ENTRY" && "Delete Frame Entry?"}
                  {modalState.type === "CLEAR_ALL" && "Clear All Data?"}
                </h3>
                <p className="text-slate-500 mb-6">
                  {modalState.type === "CANCEL_TASK" && "Are you sure you want to cancel the current task? Unsaved timer progress will be lost."}
                  {modalState.type === "DELETE_ENTRY" && "Are you sure you want to delete this frame permanently? This cannot be undone."}
                  {modalState.type === "CLEAR_ALL" && "WARNING: This will permanently delete ALL your CVAT work history. This action cannot be reversed!"}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => modalState.type === "CLEAR_ALL" ? openModal("SETTINGS") : closeModal()}
                    className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      if (modalState.type === "CANCEL_TASK") handleCancel();
                      if (modalState.type === "DELETE_ENTRY") handleDeleteEntry(modalState.data);
                      if (modalState.type === "CLEAR_ALL") {
                        setEntries([]);
                        setFrameNumber("");
                        setFacesCompleted("");
                        setFileName("");
                        setIsWorking(false);
                        setStartTime(null);
                        setSearchQuery("");
                        setCurrentPage(1);
                        toast.success("All data cleared successfully");
                        closeModal();
                      }
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                  >
                    {modalState.type === "CANCEL_TASK" && "Yes, Cancel"}
                    {modalState.type === "DELETE_ENTRY" && "Yes, Delete"}
                    {modalState.type === "CLEAR_ALL" && "Yes, Delete Everything"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default CvatCalculation;
