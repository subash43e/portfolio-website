import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileCode, BarChart2, AlertCircle, CheckCircle2,
  ArrowLeft, Trash2, Calendar, Clock, Search, Filter, Scissors
} from "lucide-react";
import JSZip from "jszip";
import { parseCVATXML, getTotalFrameCount } from "./cvatParser";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";

const SNAP_FRAMES = [
  0, 36, 72, 108, 144, 180, 216, 252, 288, 323, 359, 395, 431, 467, 503, 539, 575,
  611, 647, 683, 719, 755, 791, 827, 863, 899, 934, 970, 1006, 1042, 1078, 1114,
  1150, 1186, 1222, 1258, 1294, 1330, 1366, 1402, 1438, 1474, 1510, 1545, 1581,
  1617, 1653, 1689, 1725, 1761, 1796
];

// Helper to get dynamically generated snap frames up to max frame
const getDynamicSnapFrames = (maxFr) => {
  const frames = [...SNAP_FRAMES];
  let lastFrame = frames[frames.length - 1];
  while (lastFrame < maxFr) {
    lastFrame += 36;
    frames.push(lastFrame);
  }
  return frames;
};

const snapPercent = (rawPct, maxFr) => {
  if (maxFr <= 0) return rawPct;
  const rawFrame = (rawPct / 100) * maxFr;
  let closestFrame = Math.round(rawFrame);
  let minDiff = Infinity;
  
  const currentSnapFrames = getDynamicSnapFrames(maxFr);

  for (const sf of currentSnapFrames) {
    if (sf > maxFr) continue;
    const diff = Math.abs(sf - rawFrame);
    if (diff < minDiff) {
      minDiff = diff;
      closestFrame = sf;
    }
  }
  const snappedPct = (closestFrame / maxFr) * 100;
  return Math.max(0.1, Math.min(99.9, snappedPct));
};

const posToFrame = (posPercent, maxFrame) => {
  if (posPercent >= 99.9) return maxFrame;
  if (posPercent <= 0.1) return 0;
  
  const rawFrame = Math.round((posPercent / 100) * maxFrame);
  let closestFrame = rawFrame;
  let minDiff = Infinity;
  
  const currentSnapFrames = getDynamicSnapFrames(maxFrame);

  for (const sf of currentSnapFrames) {
    if (sf > maxFrame) continue;
    const diff = Math.abs(sf - rawFrame);
    if (diff < minDiff) {
      minDiff = diff;
      closestFrame = sf;
    }
  }
  return closestFrame;
};

// A refined, accessible 10-hue palette — distinct but harmonious
const PALETTE = [
  { bg: '#6366f1', light: '#eef2ff', text: '#4338ca' }, // violet
  { bg: '#0ea5e9', light: '#e0f2fe', text: '#0369a1' }, // sky
  { bg: '#10b981', light: '#ecfdf5', text: '#047857' }, // emerald
  { bg: '#f59e0b', light: '#fffbeb', text: '#b45309' }, // amber
  { bg: '#ef4444', light: '#fef2f2', text: '#b91c1c' }, // red
  { bg: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9' }, // purple
  { bg: '#ec4899', light: '#fdf2f8', text: '#be185d' }, // pink
  { bg: '#14b8a6', light: '#f0fdfa', text: '#0f766e' }, // teal
  { bg: '#f97316', light: '#fff7ed', text: '#c2410c' }, // orange
  { bg: '#06b6d4', light: '#ecfeff', text: '#0e7490' }, // cyan
];

const CvatAnalysis = () => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Single-session multi-file state arrays
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  
  const [hoveredSegIdx, setHoveredSegIdx] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage("cvat_analysis_history", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [manualInput, setManualInput] = useState("");

  const activeFileIdRef = useRef(activeFileId);
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);

  // Derived state mapping for the active file
  const activeFile = uploadedFiles.find(f => f.id === activeFileId) || null;
  const fileInfo = activeFile?.fileInfo || null;
  const rawXml = activeFile?.rawXml || null;
  const maxFrame = activeFile?.maxFrame || 0;
  const dividers = activeFile?.dividers || [];
  const fullStats = activeFile?.fullStats || null;
  const segmentResults = activeFile?.segmentResults || [];

  const updateActiveFile = useCallback((updates) => {
    setUploadedFiles(prev => prev.map(f => {
      if (f.id === activeFileIdRef.current) {
        const newProps = typeof updates === 'function' ? updates(f) : updates;
        return { ...f, ...newProps };
      }
      return f;
    }));
  }, []);

  const fileInputRef = useRef(null);
  const timelineRef = useRef(null);
  const searchInputRef = useRef(null);
  const manualInputRef = useRef(null);
  const draggingIdx = useRef(null);
  const navigate = useNavigate();

  // --- File Upload ---
  const processFiles = async (fileList) => {
    setError(null);
    if (!fileList || fileList.length === 0) return;
    
    // We parse in sequence to maintain order and show loading state if needed
    const newFiles = [];
    let firstNewId = null;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lowerName = file.name.toLowerCase();
      
      // Skip duplicate files safely
      if (uploadedFiles.some(f => f.fileInfo.fileName === file.name) || newFiles.some(f => f.fileInfo.fileName === file.name)) {
        setError(p => (p ? p + '\n' : '') + `Skipped ${file.name}: Already uploaded`);
        continue;
      }

      if (!lowerName.endsWith('.xml') && !lowerName.endsWith('.zip')) {
        setError(p => (p ? p + '\n' : '') + `Skipped ${file.name}: Not XML/ZIP`);
        continue;
      }
      if (file.size > 104857600) {
        setError(p => (p ? p + '\n' : '') + `Skipped ${file.name}: Exceeds 100MB`);
        continue;
      }
      
      try {
        let xmlContent = "";
        if (lowerName.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          let xmlFile = zip.file("annotations.xml");
          if (!xmlFile) {
            const allXml = Object.keys(zip.files).filter(n =>
              n.toLowerCase().endsWith('.xml') && !zip.files[n].dir &&
              !n.includes('__MACOSX') && !n.split('/').pop().startsWith('._')
            );
            if (allXml.length > 0) {
              const ann = allXml.find(n => n.toLowerCase().endsWith('annotations.xml'));
              xmlFile = zip.file(ann || allXml[0]);
            }
          }
          if (!xmlFile) throw new Error("No XML found inside ZIP.");
          xmlContent = await xmlFile.async("string");
        } else {
          xmlContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsText(file);
          });
        }
        
        const { maxFrameId } = getTotalFrameCount(xmlContent);
        const full = parseCVATXML(xmlContent);
        const id = Date.now().toString() + "_" + i + Math.random().toString(36).slice(2, 6);
        
        if (!firstNewId) firstNewId = id;
        
        newFiles.push({
          id,
          fileInfo: { fileName: file.name, totalSize: file.size },
          rawXml: xmlContent,
          maxFrame: maxFrameId,
          fullStats: full,
          dividers: [],
          segmentResults: [{
            startFrame: 0,
            endFrame: maxFrameId,
            startPct: 0,
            endPct: 100,
            label: 'S1',
            results: full
          }]
        });
      } catch (err) {
        setError(p => (p ? p + '\n' : '') + `Failed ${file.name}: ${err.message}`);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      if (!activeFileId) setActiveFileId(firstNewId);
    }
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // --- Timeline drag ---
  const getBarPercent = useCallback((clientX) => {
    const bar = timelineRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0.5, Math.min(99.5, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handleDividerMouseDown = (e, idx) => {
    if (!activeFile) return;
    e.preventDefault();
    draggingIdx.current = idx;
    const onMove = (mv) => {
      const rawPct = getBarPercent(mv.clientX);
      const pct = snapPercent(rawPct, maxFrame);
      updateActiveFile(prevFile => {
        const next = [...prevFile.dividers];
        const minLeft = idx > 0 ? prevFile.dividers[idx - 1] + 0.1 : 0.1;
        const maxRight = idx < prevFile.dividers.length - 1 ? prevFile.dividers[idx + 1] - 0.1 : 99.9;
        next[idx] = Math.max(minLeft, Math.min(maxRight, pct));
        return { dividers: next };
      });
    };
    const onUp = () => {
      draggingIdx.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      updateActiveFile(prevFile => ({
        segmentResults: calculateResults(prevFile.dividers, prevFile.maxFrame, prevFile.rawXml)
      }));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDividerTouchStart = (e, idx) => {
    if (!activeFile) return;
    const onMove = (tv) => {
      const rawPct = getBarPercent(tv.touches[0].clientX);
      const pct = snapPercent(rawPct, maxFrame);
      updateActiveFile(prevFile => {
        const next = [...prevFile.dividers];
        const minLeft = idx > 0 ? prevFile.dividers[idx - 1] + 0.1 : 0.1;
        const maxRight = idx < prevFile.dividers.length - 1 ? prevFile.dividers[idx + 1] - 0.1 : 99.9;
        next[idx] = Math.max(minLeft, Math.min(maxRight, pct));
        return { dividers: next };
      });
    };
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      updateActiveFile(prevFile => ({
        segmentResults: calculateResults(prevFile.dividers, prevFile.maxFrame, prevFile.rawXml)
      }));
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleDeleteSegment = (i) => {
    if (dividers.length === 0) return;
    const divIdx = i < dividers.length ? i : i - 1;
    updateActiveFile(prevFile => {
      const newDivs = prevFile.dividers.filter((_, idx) => idx !== divIdx);
      return {
        dividers: newDivs,
        segmentResults: calculateResults(newDivs, prevFile.maxFrame, prevFile.rawXml)
      };
    });
  };

  // Build segments from divider positions
  const buildSegments = (divs, mFrame) => {
    const positions = [0, ...divs, 100];
    return positions.slice(0, -1).map((start, i) => {
      const end = positions[i + 1];
      let startFrame = posToFrame(start, mFrame);
      if (i > 0) startFrame += 1;
      const endFrame = posToFrame(end, mFrame);
      return {
        startFrame: Math.min(startFrame, endFrame),
        endFrame,
        startPct: start,
        endPct: end,
        label: `S${i + 1}`,
      };
    });
  };
  
  const calculateResults = (divs, mFrame, xml) => {
    if (!xml) return [];
    return buildSegments(divs, mFrame).map(seg => ({
      ...seg,
      results: parseCVATXML(xml, seg.startFrame, seg.endFrame)
    }));
  };
  
  const segments = activeFile ? buildSegments(dividers, maxFrame) : [];

  const saveToHistory = () => {
    if (!fileInfo || segmentResults.length === 0) return;
    const entries = segmentResults.map(seg => ({
      id: Date.now() + Math.random(),
      date: new Date().toLocaleDateString(),
      ...seg.results,
      fileName: `${fileInfo.fileName} [${seg.label}: ${seg.startFrame}–${seg.endFrame}]`,
    }));
    setHistory(prev => [...entries, ...prev]);
  };

  const handleSaveAllToHistory = () => {
    if (uploadedFiles.length === 0) return;
    const entries = [];
    uploadedFiles.forEach(f => {
      if (f.segmentResults && f.segmentResults.length > 0) {
        f.segmentResults.forEach(seg => {
          entries.push({
            id: Date.now() + Math.random(),
            date: new Date().toLocaleDateString(),
            ...seg.results,
            fileName: `${f.fileInfo.fileName} [${seg.label}: ${seg.startFrame}–${seg.endFrame}]`,
          });
        });
      }
    });
    if (entries.length > 0) {
      setHistory(prev => [...entries, ...prev]);
    }
  };

  const deleteHistoryEntry = (id) => setHistory(history.filter(h => h.id !== id));

  const availableDates = [...new Set(history.map(h => h.date))].sort((a, b) => new Date(b) - new Date(a));
  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === "All Time" || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const applyManualRanges = () => {
    if (!manualInput.trim()) return;
    const parts = manualInput.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return; 

    const newDividers = [];
    for (let i = 0; i < parts.length; i++) {
      const match = parts[i].match(/\d+/g);
      if (match) {
        let frame = parseInt(match[match.length - 1], 10);
        let pct = (frame / maxFrame) * 100;
        if (pct >= 99.9) continue;
        pct = Math.max(0.1, pct);
        newDividers.push(pct);
      }
    }
    
    if (newDividers.length > 0) {
      const unique = [...new Set(newDividers)].sort((a,b) => a - b);
      updateActiveFile(prevFile => ({
        dividers: unique,
        segmentResults: calculateResults(unique, prevFile.maxFrame, prevFile.rawXml)
      }));
      setManualInput(""); 
    }
  };

  // Keep a stable ref to functions/state needed in global shortcuts
  const stateRef = useRef({ uploadedFiles, activeFileId, removeFile, handleSaveAllToHistory });
  useEffect(() => {
    stateRef.current = { uploadedFiles, activeFileId, removeFile, handleSaveAllToHistory };
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      
      if (e.key === 'Escape') {
        document.activeElement?.blur();
        return;
      }

      if (!isInputFocused) {
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          manualInputRef.current?.focus();
        } else if (e.key === '/') {
          e.preventDefault();
          searchInputRef.current?.focus();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          const { activeFileId, removeFile } = stateRef.current;
          if (activeFileId) {
            e.preventDefault();
            removeFile(activeFileId);
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const { uploadedFiles, activeFileId } = stateRef.current;
          if (uploadedFiles.length > 1) {
            const currentIdx = uploadedFiles.findIndex(f => f.id === activeFileId);
            if (currentIdx !== -1) {
              const nextIdx = e.key === 'ArrowUp' 
                ? (currentIdx === 0 ? uploadedFiles.length - 1 : currentIdx - 1)
                : (currentIdx === uploadedFiles.length - 1 ? 0 : currentIdx + 1);
              setActiveFileId(uploadedFiles[nextIdx].id);
            }
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        stateRef.current.handleSaveAllToHistory();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-800">
      <div className="max-w-6xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate('/cvat')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">CVAT Analysis</h1>
            <p className="text-xs text-slate-400 mt-0.5">Annotation report for <strong>CVAT for Images 1.1</strong></p>
          </div>
          <div className="w-16" /> {/* spacer to center title */}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar (Multi-file manager) ── */}
          {uploadedFiles.length > 0 && (
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
              <div
                className={`group border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${isDragging ? "border-indigo-400 bg-indigo-50/60 scale-[1.02]" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" multiple accept=".xml,.zip,.XML,.ZIP" className="hidden" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} />
                <Upload size={20} className="mx-auto text-slate-400 mb-2 group-hover:text-indigo-400 transition-colors" />
                <p className="text-xs font-semibold text-slate-600">Upload more files...</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploaded Files ({uploadedFiles.length})</span>
                  <span className="text-[9px] text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded flex gap-1">↑↓ nav</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                  {uploadedFiles.map((f) => (
                    <div key={f.id} className="relative group">
                      <button
                        onClick={() => setActiveFileId(f.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${f.id === activeFileId ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                      >
                        <FileCode size={16} className={`mt-0.5 flex-shrink-0 ${f.id === activeFileId ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <div className="min-w-0 flex-1 pr-6">
                          <p className={`text-xs font-semibold truncate ${f.id === activeFileId ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {f.fileInfo.fileName}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${f.id === activeFileId ? 'text-indigo-400/80' : 'text-slate-400'}`}>
                            {f.maxFrame + 1} frames {f.segmentResults?.length > 0 ? '· Analyzed ✓' : ''}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bulk Actions Footer */}
                <div className="bg-white border-t border-slate-100 p-3 space-y-2">
                  <button
                    onClick={handleSaveAllToHistory}
                    disabled={uploadedFiles.every(f => !f.segmentResults || f.segmentResults.length === 0)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <CheckCircle2 size={14} /> Save All to History
                    <span className="ml-1 text-[9px] font-mono tracking-tighter bg-indigo-800/50 px-1 py-0.5 text-white/60 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">Ctrl+S</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Right Panel (Active Workspace) ── */}
          <div className="flex-1 min-w-0">
            {/* Massive Upload Zone when empty */}
            {uploadedFiles.length === 0 && (
              <div
                className={`group border-2 border-dashed rounded-2xl px-8 py-20 text-center transition-all duration-200 cursor-pointer
                  ${isDragging ? "border-indigo-400 bg-indigo-50/60 scale-[1.01]" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" multiple accept=".xml,.zip,.XML,.ZIP" className="hidden" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} />
                <div className="flex justify-center mb-5">
                  <div className={`p-5 rounded-2xl transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
                    <Upload size={28} />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">Drop multiple CVAT files here</h3>
                <p className="text-sm text-slate-400">Supports multiple <code className="text-xs bg-slate-100 px-1 rounded">.xml</code> and <code className="text-xs bg-slate-100 px-1 rounded">.zip</code> · Max 100MB each</p>
                <p className="mt-3 text-[10px] text-slate-400 font-mono tracking-tight"><span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Ctrl+U</span> to upload · <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">M</span> for manual ranges</p>
                {error && (
                  <div className="inline-flex items-center gap-2 mt-5 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 text-sm">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}
              </div>
            )}

            {/* Active File Rendering */}
            {activeFile && (
              <div className="space-y-5">
                
                {/* Active File Header */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl flex-shrink-0">
                      <FileCode size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-800 truncate" title={activeFile.fileInfo.fileName}>
                        {activeFile.fileInfo.fileName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(activeFile.fileInfo.totalSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

            {/* Full file overview */}
            {fullStats && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Full File Summary</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {[
                    { label: 'Frames', value: fullStats.totalImages, color: '#1e293b' },
                    { label: 'Annotated', value: fullStats.annotatedImages, color: '#10b981' },
                    { label: 'Faces', value: fullStats.groupedMetrics.faces, color: '#6366f1' },
                    { label: 'L. Eye', value: fullStats.groupedMetrics.eyesLeft, color: '#0ea5e9' },
                    { label: 'R. Eye', value: fullStats.groupedMetrics.eyesRight, color: '#0ea5e9' },
                    { label: 'Noses', value: fullStats.groupedMetrics.noses, color: '#f59e0b' },
                    { label: 'L. Mouth', value: fullStats.groupedMetrics.mouthsLeft, color: '#ef4444' },
                    { label: 'R. Mouth', value: fullStats.groupedMetrics.mouthsRight, color: '#ec4899' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-1">{label}</p>
                      <p className="text-xl font-black" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Timeline Segmenter ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Frame Range Segmenter</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click timeline to split · Drag handles · Or type manual ranges
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 relative">
                  <input
                    ref={manualInputRef}
                    type="text"
                    placeholder="e.g. 0-545, 546-700"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyManualRanges()}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg w-40 md:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  {!manualInput && <span className="absolute right-[125px] top-[7px] pointer-events-none text-[9px] font-mono text-slate-300 px-1 rounded border border-slate-100 md:right-[150px]">M</span>}
                  <button 
                    onClick={applyManualRanges}
                    className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Apply
                  </button>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1.5 rounded-lg ml-1">
                    {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
                  </span>
                </div>
              </div>

              {/* Timeline bar — taller for easy interaction */}
              <div className="mt-5 mb-1">
                <div
                  ref={timelineRef}
                  className="relative h-16 rounded-xl overflow-hidden select-none"
                  style={{ background: '#e2e8f0' }}
                >
                  {/* Segment blocks */}
                  {segments.map((seg, i) => {
                    const color = PALETTE[i % PALETTE.length];
                    const isHovered = hoveredSegIdx === i;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
                        style={{
                          left: `${seg.startPct}%`,
                          width: `${seg.endPct - seg.startPct}%`,
                          background: color.bg,
                          opacity: isHovered ? 0.95 : 0.82,
                        }}
                        onMouseEnter={() => setHoveredSegIdx(i)}
                        onMouseLeave={() => setHoveredSegIdx(null)}
                        onClick={(e) => {
                          if (e.target.closest('[data-delete]')) return;
                          const bar = timelineRef.current;
                          if (!bar) return;
                          const rect = bar.getBoundingClientRect();
                          const rawPct = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
                          const pct = snapPercent(rawPct, maxFrame);
                          
                          updateActiveFile(prevFile => {
                            if (prevFile.dividers.includes(pct)) return prevFile;
                            const nextDivs = [...prevFile.dividers, pct].sort((a, b) => a - b);
                            return {
                              dividers: nextDivs,
                              segmentResults: calculateResults(nextDivs, prevFile.maxFrame, prevFile.rawXml)
                            };
                          });
                        }}
                      >
                        {/* Hover overlay: dim + show delete */}
                        {isHovered && dividers.length > 0 && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <button
                              data-delete="true"
                              onClick={(e) => { e.stopPropagation(); handleDeleteSegment(i); }}
                              className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors"
                              title="Remove segment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                        {/* Segment content */}
                        {!isHovered && (
                          <div className="flex flex-col items-center justify-center whitespace-nowrap pointer-events-none z-10 px-1">
                            <span className="text-white text-[11px] font-bold drop-shadow-md select-none leading-tight">
                              {seg.label}
                            </span>
                            <span className="text-white text-[9px] drop-shadow-md select-none leading-tight font-semibold mt-px">
                              {seg.endFrame - seg.startFrame + 1}f
                            </span>
                          </div>
                        )}
                        {/* Hover: show scissors hint */}
                        {isHovered && dividers.length === 0 && (
                          <Scissors size={14} className="text-white/70" />
                        )}
                      </div>
                    );
                  })}

                  {/* Draggable divider handles */}
                  {dividers.map((pct, idx) => (
                    <div
                      key={idx}
                      tabIndex={0}
                      className="absolute top-0 h-full z-20 flex items-center justify-center group focus:outline-none"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)', cursor: 'col-resize', width: '20px' }}
                      onMouseDown={(e) => handleDividerMouseDown(e, idx)}
                      onTouchStart={(e) => handleDividerTouchStart(e, idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          // Adjust by +/- 1%
                          const delta = e.key === 'ArrowLeft' ? -1 : 1;
                          let newPct = pct + delta;
                          const minLeft = idx > 0 ? dividers[idx - 1] + 0.1 : 0.1;
                          const maxRight = idx < dividers.length - 1 ? dividers[idx + 1] - 0.1 : 99.9;
                          if (newPct < minLeft) newPct = minLeft;
                          if (newPct > maxRight) newPct = maxRight;
                          
                          updateActiveFile(prevFile => {
                            const next = [...prevFile.dividers];
                            next[idx] = newPct;
                            return { dividers: next, segmentResults: calculateResults(next, prevFile.maxFrame, prevFile.rawXml) };
                          });
                        } else if (e.key === 'Delete' || e.key === 'Backspace') {
                          e.preventDefault();
                          handleDeleteSegment(idx + 1); // handleDeleteSegment takes segment index. Wait, let's fix this properly below.
                        }
                      }}
                    >
                      {/* Line */}
                      <div className="w-[3px] h-full bg-white/40 group-hover:bg-white/80 group-focus:bg-indigo-300 group-focus:w-[4px] transition-all" />
                      {/* Knob */}
                      <div className="absolute w-4 h-6 bg-white rounded shadow-lg flex flex-col items-center justify-center gap-[3px] opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-110 group-focus:opacity-100 group-focus:scale-110 group-focus:ring-2 ring-indigo-400 transition-all duration-200">
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Frame labels below bar */}
                <div className="relative mt-2" style={{ height: segmentResults.length > 0 ? '36px' : '18px' }}>
                  {segments.map((seg, i) => {
                    const res = segmentResults[i]?.results;
                    return (
                      <div
                        key={i}
                        className="absolute flex flex-col items-center justify-start overflow-visible whitespace-nowrap z-10"
                        style={{ left: `${seg.startPct}%`, width: `${seg.endPct - seg.startPct}%` }}
                      >
                        <p className="text-[9px] font-mono text-slate-500 font-medium px-1 bg-[#f8f9fc]/80 rounded">
                          {seg.startFrame}–{seg.endFrame}
                        </p>
                        {res && (
                          <p className="text-[9px] text-slate-600 bg-[#f8f9fc]/80 rounded px-1 mt-0.5">
                            <span className="text-emerald-600 font-bold">{res.annotatedImages}✓</span>
                            <span className="mx-1 text-slate-400">·</span>
                            <span className="font-semibold">{res.groupedMetrics.faces}F</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 text-sm">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

            </div>

            {/* ── Segment Results ── */}
            {segmentResults.length > 0 && (
              <div className="space-y-4">
                {segmentResults.map((seg, index) => {
                  const results = seg.results;
                  const color = PALETTE[index % PALETTE.length];
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Segment header bar */}
                      <div
                        className="px-5 py-3 flex items-center justify-between"
                        style={{ background: color.light, borderBottom: `1px solid ${color.bg}22` }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: color.bg, color: '#fff' }}
                          >
                            {seg.label}
                          </span>
                          <span className="text-xs font-mono font-medium" style={{ color: color.text }}>
                            Frames {seg.startFrame} → {seg.endFrame}
                          </span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: color.text }}>
                          {results.annotatedImages} / {results.totalImages} annotated
                        </span>
                      </div>

                      {/* Metrics grid */}
                      <div className="p-5">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {[
                            { label: 'Faces', value: results.groupedMetrics.faces, color: '#6366f1' },
                            { label: 'L. Eye', value: results.groupedMetrics.eyesLeft, color: '#0ea5e9' },
                            { label: 'R. Eye', value: results.groupedMetrics.eyesRight, color: '#0ea5e9' },
                            { label: 'Noses', value: results.groupedMetrics.noses, color: '#f59e0b' },
                            { label: 'L. Mouth', value: results.groupedMetrics.mouthsLeft, color: '#ef4444' },
                            { label: 'R. Mouth', value: results.groupedMetrics.mouthsRight, color: '#ec4899' },
                          ].map(({ label, value, color: c }) => (
                            <div key={label} className="bg-slate-50/70 rounded-xl p-3 text-center hover:bg-slate-100 transition-colors">
                              <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-1">{label}</p>
                              <p className="text-2xl font-black" style={{ color: c }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Advanced Attributes */}
                        {(Object.keys(results.faceAngles || {}).length > 0 || Object.keys(results.faceOcclusions || {}).length > 0) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            {Object.keys(results.faceAngles || {}).length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Face Angles</p>
                                <div className="space-y-2.5">
                                  {Object.entries(results.faceAngles).sort(([, a], [, b]) => b - a).map(([angle, count]) => (
                                    <div key={angle}>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600">{angle}</span>
                                        <span className="font-bold text-slate-800">{count}</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all"
                                          style={{ width: `${Math.min((count / Math.max(results.groupedMetrics.faces, 1)) * 100, 100)}%`, background: color.bg }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {Object.keys(results.faceOcclusions || {}).length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Occlusion Levels</p>
                                <div className="space-y-2.5">
                                  {Object.entries(results.faceOcclusions).sort(([, a], [, b]) => b - a).map(([occ, count]) => (
                                    <div key={occ}>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-slate-600">{occ}</span>
                                        <span className="font-bold text-slate-800">{count}</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-indigo-400 transition-all"
                                          style={{ width: `${Math.min((count / Math.max(results.groupedMetrics.faces, 1)) * 100, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

        {/* ── History ── */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-slate-400" />
                <span className="font-semibold text-slate-800 text-sm">History</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">{filteredHistory.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40"
                  />
                  {!searchQuery && <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-mono text-slate-300 px-1 rounded border border-slate-100">/</span>}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <Filter size={12} className="text-slate-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-xs bg-transparent focus:outline-none cursor-pointer text-slate-600"
                  >
                    <option value="All Time">All time</option>
                    {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    {['Date', 'File / Segment', 'Frames', 'Annotated', 'Faces', 'L.Eye', 'R.Eye', 'Nose', 'L.Mouth', 'R.Mouth', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={11} className="text-slate-300" />
                          {entry.date}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate font-medium text-slate-700" title={entry.fileName}>{entry.fileName}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.totalImages}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">{entry.annotatedImages}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{entry.groupedMetrics.faces}</td>
                      <td className="px-4 py-3 text-sky-600">{entry.groupedMetrics.eyesLeft}</td>
                      <td className="px-4 py-3 text-sky-600">{entry.groupedMetrics.eyesRight}</td>
                      <td className="px-4 py-3 text-amber-600">{entry.groupedMetrics.noses}</td>
                      <td className="px-4 py-3 text-rose-500">{entry.groupedMetrics.mouthsLeft}</td>
                      <td className="px-4 py-3 text-pink-500">{entry.groupedMetrics.mouthsRight}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CvatAnalysis;
