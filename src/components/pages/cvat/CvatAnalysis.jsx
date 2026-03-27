import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileCode, 
  BarChart2, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  ListOrdered,
  Eye,
  Smile,
  ArrowLeft,
  Trash2,
  Calendar,
  Clock,
  Search,
  Filter
} from "lucide-react";
import JSZip from "jszip";
import { parseCVATXML } from "./cvatParser";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../../hooks/useLocalStorage";

const CvatAnalysis = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileData, setFileData] = useLocalStorage("cvat_current_fileData", null);
  const [rawXml, setRawXml] = useLocalStorage("cvat_current_rawXml", null);
  const [startFrame, setStartFrame] = useLocalStorage("cvat_current_startFrame", "");
  const [endFrame, setEndFrame] = useLocalStorage("cvat_current_endFrame", "");
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage("cvat_analysis_history", []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Time");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    setError(null);
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xml') && !lowerName.endsWith('.zip')) {
      setError("Please upload a valid CVAT XML or ZIP file.");
      return;
    }

    try {
      let xmlContent = "";
      
      if (lowerName.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        // CVAT for Images 1.1 ZIP export usually has "annotations.xml" at the root or within
        let xmlFile = zip.file("annotations.xml");
        if (!xmlFile) {
          // If not exactly "annotations.xml" at root, try to find any valid XML
          const allXmlFiles = Object.keys(zip.files).filter(name => {
            const isXml = name.toLowerCase().endsWith('.xml');
            const isDir = zip.files[name].dir;
            const isMacOsx = name.includes('__MACOSX');
            const isHidden = name.split('/').pop().startsWith('._');
            return isXml && !isDir && !isMacOsx && !isHidden;
          });
          
          if (allXmlFiles.length > 0) {
            // Prefer file named annotations.xml if it exists in subdirectories
            const annotationsXml = allXmlFiles.find(name => name.toLowerCase().endsWith('annotations.xml'));
            xmlFile = zip.file(annotationsXml || allXmlFiles[0]);
          }
        }
        
        if (!xmlFile) {
          throw new Error("No XML annotations found inside the ZIP file.");
        }
        xmlContent = await xmlFile.async("string");
      } else {
        // Direct XML upload fallback
        xmlContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read the XML file."));
          reader.readAsText(file);
        });
      }

      let parsedXmlContent = xmlContent;
      setRawXml(parsedXmlContent);

      const result = parseCVATXML(parsedXmlContent);
      const newRecord = {
        fileName: file.name,
        ...result,
        startFrame: null,
        endFrame: null
      };
      setFileData(newRecord);
      
      // Auto-save removed: user will manually save using the button

    } catch (err) {
      setError(err.message || "Failed to parse the file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleReset = () => {
    setFileData(null);
    setRawXml(null);
    setStartFrame("");
    setEndFrame("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deleteHistoryEntry = (id) => {
    setHistory(history.filter(h => h.id !== id));
  };

  const handleAnalyzeRange = () => {
    if (!rawXml) return;
    try {
      setError(null);
      const start = startFrame !== "" ? parseInt(startFrame, 10) : null;
      const end = endFrame !== "" ? parseInt(endFrame, 10) : null;
      
      const result = parseCVATXML(rawXml, start, end);
      
      setFileData(prev => ({
        ...prev,
        ...result,
        startFrame: start,
        endFrame: end
      }));
    } catch(err) {
      setError(err.message || "Range analysis failed.");
    }
  };

  const saveToHistory = () => {
    if (!fileData) return;
    
    let displayName = fileData.fileName;
    if (fileData.startFrame !== null || fileData.endFrame !== null) {
      const s = fileData.startFrame !== null ? fileData.startFrame : 0;
      const e = fileData.endFrame !== null ? fileData.endFrame : 'Max';
      displayName = `${fileData.fileName} [${s}-${e}]`;
    }

    const historyEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...fileData,
      fileName: displayName
    };
    
    setHistory(prev => [historyEntry, ...prev]);
  };

  const availableDates = [...new Set(history.map(h => h.date))].sort((a, b) => new Date(b) - new Date(a));
  
  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === "All Time" || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto mb-8 relative">
        <button 
          onClick={() => navigate('/cvat')}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft size={16} /> Tracker
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BarChart2 size={36} className="text-slate-900" />
            <h1 className="text-4xl font-bold text-slate-900">
              CVAT XML Analysis
            </h1>
          </div>
          <p className="text-slate-500">
            Export <strong>CVAT for Images 1.1</strong> and drop the ZIP or XML file below for a detailed annotation report.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {!fileData && (
          <div 
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".xml,.zip,.XML,.ZIP" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileInput}
            />
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-100 rounded-full text-blue-500">
                <Upload size={32} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Drag & Drop your ZIP or XML File</h3>
            <p className="text-slate-500 mb-6">or click to browse from your computer</p>
            {error && (
              <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}

        {fileData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Control Bar for Frame Range & Save */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row items-center justify-between gap-4 border-l-4 border-l-blue-500">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Start Frame:</label>
                  <input 
                    type="number" 
                    value={startFrame} 
                    onChange={e => setStartFrame(e.target.value)} 
                    placeholder="e.g. 66" 
                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600 whitespace-nowrap">End Frame:</label>
                  <input 
                    type="number" 
                    value={endFrame} 
                    onChange={e => setEndFrame(e.target.value)} 
                    placeholder="e.g. 1000" 
                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  />
                </div>
                <button 
                  onClick={handleAnalyzeRange} 
                  className="px-5 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition shadow-sm w-full sm:w-auto"
                >
                  Analyze Range
                </button>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <button 
                  onClick={handleReset}
                  className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 w-full sm:w-auto text-center"
                >
                  Upload New File
                </button>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <button 
                  onClick={saveToHistory} 
                  className="px-5 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 w-full sm:w-auto"
                >
                  <CheckCircle2 size={16} /> Save to History
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-slate-800 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Total Frames</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.totalImages}</p>
                <div className="mt-1 text-[10px] font-medium text-emerald-600">{fileData.annotatedImages} Annotated</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-purple-500 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Total Faces</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.faces}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-blue-500 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Left Eye</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.eyesLeft}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-blue-400 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Right Eye</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.eyesRight}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-orange-500 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Noses</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.noses}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-rose-500 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Left Mouth</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.mouthsLeft}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-t-4 border-t-pink-400 flex flex-col justify-between">
                <h3 className="text-xs font-medium text-slate-500 mb-1">Right Mouth</h3>
                <p className="text-xl font-bold text-slate-800">{fileData.groupedMetrics.mouthsRight}</p>
              </div>
            </div>

            {/* Advanced Insights Section */}
            {(Object.keys(fileData.faceAngles || {}).length > 0 || Object.keys(fileData.faceOcclusions || {}).length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8 mt-8 animate-in fade-in">
                <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <BarChart2 size={18} className="text-blue-500" /> Advanced Face Attributes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Face Angles */}
                  {Object.keys(fileData.faceAngles || {}).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-4 border-b border-slate-100 pb-2">Face Angles Breakdown</h4>
                      <div className="space-y-4">
                        {Object.entries(fileData.faceAngles)
                          .sort(([,a], [,b]) => b - a)
                          .map(([angle, count]) => (
                          <div key={angle}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700">{angle}</span>
                              <span className="text-slate-500 font-semibold">{count}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.min((count / fileData.groupedMetrics.faces) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 text-right">
                              {((count / fileData.groupedMetrics.faces) * 100).toFixed(1)}% of faces
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Occlusions */}
                  {Object.keys(fileData.faceOcclusions || {}).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-4 border-b border-slate-100 pb-2">Occlusion Levels</h4>
                      <div className="space-y-4">
                        {Object.entries(fileData.faceOcclusions)
                          .sort(([,a], [,b]) => b - a)
                          .map(([occ, count]) => (
                          <div key={occ}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700">{occ}</span>
                              <span className="text-slate-500 font-semibold">{count}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-indigo-400 h-2 rounded-full" 
                                style={{ width: `${Math.min((count / fileData.groupedMetrics.faces) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 text-right">
                              {((count / fileData.groupedMetrics.faces) * 100).toFixed(1)}% of faces
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
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-slate-500" /> Analysis History
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200 ml-2">
                  {filteredHistory.length} {filteredHistory.length === 1 ? 'File' : 'Files'}
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
                    {availableDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 font-medium text-slate-500">File Name</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Frames</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Faces</th>
                    <th className="px-4 py-3 font-medium text-slate-500">L. Eye</th>
                    <th className="px-4 py-3 font-medium text-slate-500">R. Eye</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Nose</th>
                    <th className="px-4 py-3 font-medium text-slate-500">L. Mouth</th>
                    <th className="px-4 py-3 font-medium text-slate-500">R. Mouth</th>
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
                      <td className="px-4 py-3 font-medium text-slate-700 max-w-[150px] truncate" title={entry.fileName}>
                        {entry.fileName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.totalImages}
                      </td>
                      <td className="px-4 py-3 font-medium text-purple-600">
                        {entry.groupedMetrics.faces}
                      </td>
                      <td className="px-4 py-3 text-blue-600">
                        {entry.groupedMetrics.eyesLeft}
                      </td>
                      <td className="px-4 py-3 text-blue-600">
                        {entry.groupedMetrics.eyesRight}
                      </td>
                      <td className="px-4 py-3 text-orange-600">
                        {entry.groupedMetrics.noses}
                      </td>
                      <td className="px-4 py-3 text-rose-600">
                        {entry.groupedMetrics.mouthsLeft}
                      </td>
                      <td className="px-4 py-3 text-pink-600">
                        {entry.groupedMetrics.mouthsRight}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete History Entry"
                          aria-label="Delete"
                        >
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
