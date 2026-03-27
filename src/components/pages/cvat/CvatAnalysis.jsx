import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileCode, BarChart2, AlertCircle, CheckCircle2,
  ArrowLeft, Trash2, Calendar, Clock, Search, Filter, Scissors
} from "lucide-react";
import JSZip from "jszip";
import { parseCVATXML, getTotalFrameCount } from "./cvatParser";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";

const posToFrame = (posPercent, maxFrame) =>
  Math.round((posPercent / 100) * maxFrame);

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
  const [fileInfo, setFileInfo] = useLocalStorage("cvat_current_fileInfo", null);
  const [rawXml, setRawXml] = useLocalStorage("cvat_current_rawXml", null);
  const [maxFrame, setMaxFrame] = useLocalStorage("cvat_current_maxFrame", 0);
  const [dividers, setDividers] = useLocalStorage("cvat_current_dividers", []);
  const [numSegments, setNumSegments] = useState(1);
  const [hoveredSegIdx, setHoveredSegIdx] = useState(null);
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

  useEffect(() => {
    if (fileInfo) setNumSegments(dividers.length + 1);
  }, [fileInfo]); // eslint-disable-line

  // --- File Upload ---
  const processFile = async (file) => {
    setError(null);
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xml') && !lowerName.endsWith('.zip')) {
      setError("Please upload a valid CVAT XML or ZIP file.");
      return;
    }
    if (file.size > 104857600) {
      setError("File is too large (max 100MB).");
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

  const handleReset = () => {
    setFileInfo(null); setRawXml(null); setMaxFrame(0);
    setFullStats(null); setDividers([]); setNumSegments(1);
    setSegmentResults([]); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Timeline drag ---
  const getBarPercent = useCallback((clientX) => {
    const bar = timelineRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0.5, Math.min(99.5, ((clientX - rect.left) / rect.width) * 100));
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
      setSegmentResults([]);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDividerTouchStart = (e, idx) => {
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
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      setSegmentResults([]);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  const handleDeleteSegment = (i) => {
    if (dividers.length === 0) return;
    const divIdx = i < dividers.length ? i : i - 1;
    setDividers(prev => prev.filter((_, idx) => idx !== divIdx));
    setNumSegments(prev => Math.max(1, prev - 1));
    setSegmentResults([]);
  };

  // Build segments from divider positions
  const getSegments = () => {
    const positions = [0, ...dividers, 100];
    return positions.slice(0, -1).map((start, i) => {
      const end = positions[i + 1];
      return {
        startFrame: posToFrame(start, maxFrame),
        endFrame: posToFrame(end, maxFrame),
        startPct: start,
        endPct: end,
        label: `S${i + 1}`,
      };
    });
  };
  const segments = getSegments();

  // --- Analysis ---
  const handleAnalyze = () => {
    if (!rawXml) return;
    try {
      setError(null);
      const results = segments.map(seg => ({
        ...seg,
        results: parseCVATXML(rawXml, seg.startFrame, seg.endFrame),
      }));
      setSegmentResults(results);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    }
  };

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

  const deleteHistoryEntry = (id) => setHistory(history.filter(h => h.id !== id));

  const availableDates = [...new Set(history.map(h => h.date))].sort((a, b) => new Date(b) - new Date(a));
  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === "All Time" || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-800">
      <div className="max-w-5xl mx-auto px-5 py-10">

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

        {/* ── Upload Zone ── */}
        {!fileInfo && (
          <div
            className={`group border-2 border-dashed rounded-2xl px-8 py-20 text-center transition-all duration-200 cursor-pointer
              ${isDragging ? "border-indigo-400 bg-indigo-50/60 scale-[1.01]" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".xml,.zip,.XML,.ZIP" className="hidden" ref={fileInputRef}
              onChange={(e) => processFile(e.target.files[0])} />
            <div className="flex justify-center mb-5">
              <div className={`p-5 rounded-2xl transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
                <Upload size={28} />
              </div>
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">Drop your CVAT file here</h3>
            <p className="text-sm text-slate-400">Supports <code className="text-xs bg-slate-100 px-1 rounded">.xml</code> and <code className="text-xs bg-slate-100 px-1 rounded">.zip</code> · Max 100MB</p>
            {error && (
              <div className="inline-flex items-center gap-2 mt-5 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── After Upload ── */}
        {fileInfo && (
          <div className="space-y-5">

            {/* File strip */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><FileCode size={16} /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{fileInfo.fileName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(fileInfo.totalSize / 1024 / 1024).toFixed(2)} MB &nbsp;·&nbsp;
                    <span className="font-medium text-slate-600">{maxFrame + 1}</span> total frames
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Change file
              </button>
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
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Frame Range Segmenter</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click the timeline to split · Drag handles to resize · Hover to delete
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                  {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
                </span>
              </div>

              {/* Timeline bar — taller for easy interaction */}
              <div className="mt-5 mb-1">
                <div
                  ref={timelineRef}
                  className="relative h-16 rounded-xl overflow-visible select-none"
                  style={{ background: '#e2e8f0' }}
                >
                  {/* Segment blocks */}
                  {segments.map((seg, i) => {
                    const color = PALETTE[i % PALETTE.length];
                    const isHovered = hoveredSegIdx === i;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-150 overflow-hidden rounded-[inherit]"
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
                          const pct = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
                          setDividers(prev => [...prev, pct].sort((a, b) => a - b));
                          setNumSegments(prev => prev + 1);
                          setSegmentResults([]);
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
                          <>
                            <span className="text-white text-[11px] font-bold drop-shadow select-none leading-tight">
                              {seg.label}
                            </span>
                            <span className="text-white/70 text-[9px] select-none leading-tight font-medium">
                              {seg.endFrame - seg.startFrame}f
                            </span>
                          </>
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
                      className="absolute top-0 h-full z-20 flex items-center justify-center group"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)', cursor: 'col-resize', width: '20px' }}
                      onMouseDown={(e) => handleDividerMouseDown(e, idx)}
                      onTouchStart={(e) => handleDividerTouchStart(e, idx)}
                    >
                      {/* Line */}
                      <div className="w-0.5 h-full bg-white/80 group-hover:bg-white transition-colors shadow-sm" />
                      {/* Knob */}
                      <div className="absolute w-4 h-6 bg-white rounded shadow-lg flex flex-col items-center justify-center gap-[3px] group-hover:scale-110 transition-transform">
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
                        className="absolute text-center"
                        style={{ left: `${seg.startPct}%`, width: `${seg.endPct - seg.startPct}%` }}
                      >
                        <p className="text-[9px] font-mono text-slate-400 truncate px-1">
                          {seg.startFrame}–{seg.endFrame}
                        </p>
                        {res && (
                          <p className="text-[9px] text-slate-500 truncate px-1 mt-0.5">
                            <span className="text-emerald-600 font-semibold">{res.annotatedImages}✓</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span>{res.groupedMetrics.faces}F</span>
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

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                <button
                  onClick={saveToHistory}
                  disabled={segmentResults.length === 0}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl hover:bg-indigo-50"
                >
                  <CheckCircle2 size={15} /> Save to History
                </button>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-200 hover:shadow-indigo-300"
                >
                  <BarChart2 size={15} />
                  Analyze {segments.length} {segments.length === 1 ? 'Segment' : 'Segments'}
                </button>
              </div>
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
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40"
                  />
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
