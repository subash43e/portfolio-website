import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Upload, FileCode, BarChart2, AlertCircle, CheckCircle2,
  ArrowLeft, Trash2, Calendar, Clock, Search, Filter, Plus, Minus
} from "lucide-react";
import JSZip from "jszip";
import { parseCVATXML, getTotalFrameCount } from "./cvatParser";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";

/**
 * Convert a pixel offset on the bar to a frame number.
 */
const posToFrame = (posPercent, maxFrame) =>
  Math.round((posPercent / 100) * maxFrame);

const frameToPos = (frame, maxFrame) =>
  maxFrame > 0 ? (frame / maxFrame) * 100 : 0;

const CvatAnalysis = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useLocalStorage("cvat_current_fileInfo", null);
  const [rawXml, setRawXml] = useLocalStorage("cvat_current_rawXml", null);
  const [maxFrame, setMaxFrame] = useLocalStorage("cvat_current_maxFrame", 0);
  // dividers: array of percentages (0-100) representing positions on the timeline
  const [dividers, setDividers] = useLocalStorage("cvat_current_dividers", []);
  const [numSegments, setNumSegments] = useState(1);
  const [segInputVal, setSegInputVal] = useState("1");
  const [segmentResults, setSegmentResults] = useState([]);
  const [fullStats, setFullStats] = useLocalStorage("cvat_current_fullStats", null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage("cvat_analysis_history", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");

  const fileInputRef = useRef(null);
  const timelineRef = useRef(null);
  const draggingIdx = useRef(null);
  const navigate = useNavigate();

  // Sync numSegments from stored dividers on first load
  useEffect(() => {
    if (fileInfo) setNumSegments(dividers.length + 1);
  }, [fileInfo]); // eslint-disable-line

  // Build equally-spaced dividers when user changes segment count
  const handleSegmentCountChange = (count) => {
    const n = Math.max(1, Math.min(20, count));
    setNumSegments(n);
    setSegInputVal(String(n));
    if (n <= 1) {
      setDividers([]);
    } else {
      const newDividers = Array.from({ length: n - 1 }, (_, i) =>
        ((i + 1) / n) * 100
      );
      setDividers(newDividers);
    }
    setSegmentResults([]);
  };

  // --- File Upload ---
  const handleFileDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleFileDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const processFile = async (file) => {
    setError(null);
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xml') && !lowerName.endsWith('.zip')) {
      setError("Please upload a valid CVAT XML or ZIP file.");
      return;
    }
    if (file.size > 104857600) {
      setError("File is too large. Maximum 100MB allowed.");
      return;
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
      setRawXml(xmlContent);
      setMaxFrame(maxFrameId);
      setFullStats(full);
      setFileInfo({ fileName: file.name, totalSize: file.size });
      setDividers([]);
      setNumSegments(1);
      setSegmentResults([]);
    } catch (err) {
      setError(err.message || "Failed to parse file.");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e) => processFile(e.target.files[0]);

  const handleReset = () => {
    setFileInfo(null); setRawXml(null); setMaxFrame(0);
    setFullStats(null); setDividers([]); setNumSegments(1); setSegmentResults([]); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Timeline Drag ---
  const getBarPercent = useCallback((clientX) => {
    const bar = timelineRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0.5, Math.min(99.5, pct));
  }, []);

  const handleDividerMouseDown = (e, idx) => {
    e.preventDefault();
    draggingIdx.current = idx;

    const onMove = (mv) => {
      const pct = getBarPercent(mv.clientX);
      setDividers(prev => {
        const next = [...prev];
        const minLeft = idx > 0 ? prev[idx - 1] + 1 : 1;
        const maxRight = idx < prev.length - 1 ? prev[idx + 1] - 1 : 99;
        next[idx] = Math.max(minLeft, Math.min(maxRight, pct));
        return next;
      });
    };

    const onUp = () => {
      draggingIdx.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setSegmentResults([]); // Clear results when range changes
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Touch support
  const handleDividerTouchStart = (e, idx) => {
    draggingIdx.current = idx;
    const onMove = (tv) => {
      const pct = getBarPercent(tv.touches[0].clientX);
      setDividers(prev => {
        const next = [...prev];
        const minLeft = idx > 0 ? prev[idx - 1] + 1 : 1;
        const maxRight = idx < prev.length - 1 ? prev[idx + 1] - 1 : 99;
        next[idx] = Math.max(minLeft, Math.min(maxRight, pct));
        return next;
      });
    };
    const onEnd = () => {
      draggingIdx.current = null;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      setSegmentResults([]);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  // Build segments array from dividers
  const getSegments = () => {
    const positions = [0, ...dividers, 100];
    return positions.slice(0, -1).map((start, i) => {
      const end = positions[i + 1];
      return {
        startFrame: posToFrame(start, maxFrame),
        endFrame: posToFrame(end, maxFrame),
        startPct: start,
        endPct: end,
        label: `Segment ${i + 1}`,
      };
    });
  };

  const segments = getSegments();

  // --- Analysis ---
  const handleAnalyze = () => {
    if (!rawXml) return;
    try {
      setError(null);
      const results = segments.map(seg => {
        const res = parseCVATXML(rawXml, seg.startFrame, seg.endFrame);
        return { ...seg, results: res };
      });
      setSegmentResults(results);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    }
  };

  const deleteHistoryEntry = (id) => setHistory(history.filter(h => h.id !== id));

  const saveToHistory = () => {
    if (!fileInfo || segmentResults.length === 0) return;
    const entries = segmentResults.map(seg => ({
      id: Date.now() + Math.random(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...seg.results,
      fileName: `${fileInfo.fileName} [${seg.label}: ${seg.startFrame}–${seg.endFrame}]`
    }));
    setHistory(prev => [...entries, ...prev]);
  };

  const availableDates = [...new Set(history.map(h => h.date))].sort((a, b) => new Date(b) - new Date(a));
  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === "All Time" || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Segment color palette
  const COLORS = [
    '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444',
    '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1',
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 relative">
          <button onClick={() => navigate('/cvat')} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
            <ArrowLeft size={16} /> Tracker
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <BarChart2 size={32} className="text-slate-900" />
              <h1 className="text-3xl font-bold text-slate-900">CVAT XML Analysis</h1>
            </div>
            <p className="text-slate-500 text-sm">Export <strong>CVAT for Images 1.1</strong> → drop file → drag segments → analyze.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!fileInfo && (
          <div
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"}`}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".xml,.zip,.XML,.ZIP" className="hidden" ref={fileInputRef} onChange={handleFileInput} />
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-100 rounded-full text-blue-500"><Upload size={32} /></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Drag & Drop your ZIP or XML File</h3>
            <p className="text-slate-500 mb-6">or click to browse — max 100MB</p>
            {error && (
              <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}

        {/* Main UI after file is loaded */}
        {fileInfo && (
          <div className="space-y-6 animate-in fade-in">

            {/* File info strip */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileCode size={18} /></div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{fileInfo.fileName}</p>
                  <p className="text-xs text-slate-500">{(fileInfo.totalSize / 1024 / 1024).toFixed(2)} MB &nbsp;·&nbsp; Max Frame: <strong>{maxFrame}</strong></p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-300 transition-colors">
                Upload New File
              </button>
            </div>

            {/* Full File Overview Card */}
            {fullStats && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Full File Overview</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {[
                    { label: 'Total Frames', value: fullStats.totalImages, color: '#1e293b' },
                    { label: 'Annotated', value: fullStats.annotatedImages, color: '#10b981' },
                    { label: 'Faces', value: fullStats.groupedMetrics.faces, color: '#8b5cf6' },
                    { label: 'Left Eye', value: fullStats.groupedMetrics.eyesLeft, color: '#3b82f6' },
                    { label: 'Right Eye', value: fullStats.groupedMetrics.eyesRight, color: '#60a5fa' },
                    { label: 'Noses', value: fullStats.groupedMetrics.noses, color: '#f97316' },
                    { label: 'L. Mouth', value: fullStats.groupedMetrics.mouthsLeft, color: '#ef4444' },
                    { label: 'R. Mouth', value: fullStats.groupedMetrics.mouthsRight, color: '#ec4899' },
                  ].map(card => (
                    <div key={card.label} className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{card.label}</p>
                      <p className="text-lg font-black" style={{ color: card.color }}>{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Segmenter Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <h2 className="font-semibold text-slate-800">Frame Range Segmenter</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Set how many segments you need, then drag the dividers to adjust ranges.</p>
                </div>
                {/* Segment counter */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Segments:</span>
                  <button onClick={() => handleSegmentCountChange(numSegments - 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 transition-colors shadow-sm">
                    <Minus size={12} />
                  </button>
                  <span className="text-base font-black text-slate-800 w-6 text-center">{numSegments}</span>
                  <button onClick={() => handleSegmentCountChange(numSegments + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-500 transition-colors shadow-sm">
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* The Timeline Bar */}
              <div
                ref={timelineRef}
                className="relative h-14 rounded-xl overflow-hidden cursor-default select-none"
                style={{ background: '#e2e8f0' }}
              >
                <p className="absolute -top-5 right-0 text-[9px] text-slate-400 italic">Click on a segment to split it</p>
                {/* Colored segments — click to split */}
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer hover:brightness-110"
                    title="Click to split this segment"
                    style={{
                      left: `${seg.startPct}%`,
                      width: `${seg.endPct - seg.startPct}%`,
                      background: COLORS[i % COLORS.length],
                      opacity: 0.85,
                    }}
                    onClick={(e) => {
                      const bar = timelineRef.current;
                      if (!bar) return;
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
                      setDividers(prev => [...prev, pct].sort((a, b) => a - b));
                      setNumSegments(prev => prev + 1);
                      setSegInputVal(prev => String(parseInt(prev, 10) + 1));
                      setSegmentResults([]);
                    }}
                  >
                    <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow select-none truncate px-2 leading-tight">
                      {seg.label}
                    </span>
                    <span className="text-white/80 text-[9px] font-bold drop-shadow select-none leading-tight">
                      {seg.endFrame - seg.startFrame} frames
                    </span>
                  </div>
                ))}

                {/* Draggable dividers */}
                {dividers.map((pct, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 h-full flex items-center justify-center z-20 group"
                    style={{ left: `${pct}%`, transform: 'translateX(-50%)', cursor: 'col-resize' }}
                    onMouseDown={(e) => handleDividerMouseDown(e, idx)}
                    onTouchStart={(e) => handleDividerTouchStart(e, idx)}
                  >
                    {/* Divider visual */}
                    <div className="w-[3px] h-full bg-white shadow-md group-hover:bg-yellow-300 transition-colors"></div>
                    {/* Handle knob */}
                    <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-slate-400 shadow-lg group-hover:border-yellow-400 group-hover:scale-110 transition-all flex items-center justify-center">
                      <div className="w-1.5 h-3 flex flex-col justify-center items-center gap-[2px]">
                        <div className="w-[2px] h-[2px] bg-slate-400 rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-slate-400 rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-slate-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Segment info labels under the bar */}
              <div className="relative mt-2 h-10">
                {segments.map((seg, i) => {
                  const res = segmentResults[i]?.results;
                  return (
                    <div
                      key={i}
                      className="absolute text-center px-1"
                      style={{ left: `${seg.startPct}%`, width: `${seg.endPct - seg.startPct}%` }}
                    >
                      <p className="text-[9px] font-mono text-slate-400 whitespace-nowrap truncate">
                        {seg.startFrame} – {seg.endFrame}
                      </p>
                      {res && (
                        <p className="text-[9px] text-slate-500 whitespace-nowrap truncate mt-0.5">
                          <span className="text-emerald-600 font-semibold">{res.annotatedImages}✓</span>
                          <span className="mx-1 text-slate-300">|</span>
                          <span className="text-slate-500">{res.groupedMetrics.faces}F {res.groupedMetrics.eyesLeft + res.groupedMetrics.eyesRight}E {res.groupedMetrics.noses}N</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                <button onClick={saveToHistory} disabled={segmentResults.length === 0} className="px-5 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-lg text-sm hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <CheckCircle2 size={15} /> Save to History
                </button>
                <button onClick={handleAnalyze} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-700 transition-colors shadow-md flex items-center justify-center gap-2">
                  <BarChart2 size={15} /> Analyze {numSegments} {numSegments === 1 ? 'Segment' : 'Segments'}
                </button>
              </div>
            </div>

            {/* Results stacked per segment */}
            {segmentResults.length > 0 && (
              <div className="space-y-10">
                {segmentResults.map((seg, index) => {
                  const results = seg.results;
                  return (
                    <div key={index} className="relative mt-10 animate-in slide-in-from-bottom-4">
                      {/* Segment badge */}
                      <div className="absolute top-0 left-5 -translate-y-1/2 flex items-center gap-2 z-10">
                        <div
                          className="text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-md border-[3px] border-white flex items-center gap-2"
                          style={{ background: COLORS[index % COLORS.length] }}
                        >
                          {seg.label}
                        </div>
                        <div className="bg-white border-2 border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-mono font-medium shadow-sm">
                          Frames {seg.startFrame} → {seg.endFrame}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border-2 border-t-8 p-6 pt-10" style={{ borderColor: COLORS[index % COLORS.length], borderTopColor: COLORS[index % COLORS.length] }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                          {[
                            { label: 'Total Frames', value: results.totalImages, subLabel: `${results.annotatedImages} annotated`, subColor: '#10b981', color: '#1e293b' },
                            { label: 'Annotated', value: results.annotatedImages, color: '#10b981' },
                            { label: 'Total Faces', value: results.groupedMetrics.faces, color: '#8b5cf6' },
                            { label: 'Left Eye', value: results.groupedMetrics.eyesLeft, color: '#3b82f6' },
                            { label: 'Right Eye', value: results.groupedMetrics.eyesRight, color: '#60a5fa' },
                            { label: 'Noses', value: results.groupedMetrics.noses, color: '#f97316' },
                            { label: 'Left Mouth', value: results.groupedMetrics.mouthsLeft, color: '#ef4444' },
                            { label: 'Right Mouth', value: results.groupedMetrics.mouthsRight, color: '#ec4899' },
                          ].map(card => (
                            <div key={card.label} className="bg-slate-50 rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow flex flex-col justify-between" style={{ borderTopWidth: 4, borderTopColor: card.color }}>
                              <h3 className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">{card.label}</h3>
                              <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
                              {card.subLabel && (
                                <div className="mt-1 text-[9px] font-bold tracking-wide px-1 py-0.5 rounded inline-block w-max" style={{ color: card.subColor, background: '#ecfdf5' }}>
                                  {card.subLabel}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Advanced Attributes */}
                        {(Object.keys(results.faceAngles || {}).length > 0 || Object.keys(results.faceOcclusions || {}).length > 0) && (
                          <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-100 border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                              <BarChart2 size={15} className="text-slate-500" /> Advanced Face Attributes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {Object.keys(results.faceAngles || {}).length > 0 && (
                                <div>
                                  <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">Face Angles</h4>
                                  <div className="space-y-3">
                                    {Object.entries(results.faceAngles).sort(([,a],[,b])=>b-a).map(([angle, count]) => (
                                      <div key={angle}>
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="font-medium text-slate-700">{angle}</span>
                                          <span className="font-bold text-slate-800">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min((count / Math.max(results.groupedMetrics.faces, 1)) * 100, 100)}%`, background: COLORS[index % COLORS.length] }}></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Object.keys(results.faceOcclusions || {}).length > 0 && (
                                <div>
                                  <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">Occlusion Levels</h4>
                                  <div className="space-y-3">
                                    {Object.entries(results.faceOcclusions).sort(([,a],[,b])=>b-a).map(([occ, count]) => (
                                      <div key={occ}>
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="font-medium text-slate-700">{occ}</span>
                                          <span className="font-bold text-slate-800">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                                          <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${Math.min((count / Math.max(results.groupedMetrics.faces, 1)) * 100, 100)}%` }}></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
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

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-slate-500" /> Analysis History
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200 ml-2">
                  {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
                </span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search file name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-sm text-slate-700 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 w-full sm:w-auto">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent border-none text-sm text-slate-700 w-full focus:outline-none cursor-pointer"
                  >
                    <option value="All Time">All Time</option>
                    {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 font-medium text-slate-500">File Name / Segment</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Frames</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Faces</th>
                    <th className="px-4 py-3 font-medium text-slate-500">L.Eye</th>
                    <th className="px-4 py-3 font-medium text-slate-500">R.Eye</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Nose</th>
                    <th className="px-4 py-3 font-medium text-slate-500">L.Mouth</th>
                    <th className="px-4 py-3 font-medium text-slate-500">R.Mouth</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors bg-white text-xs">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{entry.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 max-w-[200px] truncate" title={entry.fileName}>{entry.fileName}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.totalImages}</td>
                      <td className="px-4 py-3 font-medium text-purple-600">{entry.groupedMetrics.faces}</td>
                      <td className="px-4 py-3 text-blue-600">{entry.groupedMetrics.eyesLeft}</td>
                      <td className="px-4 py-3 text-blue-600">{entry.groupedMetrics.eyesRight}</td>
                      <td className="px-4 py-3 text-orange-600">{entry.groupedMetrics.noses}</td>
                      <td className="px-4 py-3 text-rose-600">{entry.groupedMetrics.mouthsLeft}</td>
                      <td className="px-4 py-3 text-pink-600">{entry.groupedMetrics.mouthsRight}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteHistoryEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="Delete">
                          <Trash2 size={14} />
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
