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
} from "lucide-react";

import useLocalStorage from "../hooks/useLocalStorage";

const CvatCalculation = () => {
  const [isWorking, setIsWorking] = useLocalStorage("cvat_isWorking", false);
  const [startTime, setStartTime] = useLocalStorage("cvat_startTime", null);
  const [frameNumber, setFrameNumber] = useLocalStorage("cvat_frameNumber", "");
  const [facesCompleted, setFacesCompleted] = useLocalStorage("cvat_facesCompleted", "");
  const [entries, setEntries] = useLocalStorage("cvat_entries", []);

  // 1. Create refs to control input focus programmatically
  const frameInputRef = useRef(null);
  const facesInputRef = useRef(null);

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

  const isFormValid = frameNumber.trim() !== "" && facesCompleted.trim() !== "";

  const handleCompleteFrame = useCallback(() => {
    if (!isFormValid) return; // Prevent submission if invalid

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      frameNumber: frameNumber.trim(),
      facesCompleted: parseInt(facesCompleted, 10) || 0,
      durationMinutes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setEntries([newEntry, ...entries]);
    setIsWorking(false);
    setFrameNumber("");
    setFacesCompleted("");
    setStartTime(null);
  }, [isFormValid, frameNumber, facesCompleted, startTime, entries, setEntries, setIsWorking, setFrameNumber, setFacesCompleted, setStartTime]);

  // 2. Auto-focus the Frame Number input when we start working
  useEffect(() => {
    if (isWorking && frameInputRef.current) {
      frameInputRef.current.focus();
    }
  }, [isWorking]);

  // 3. Listen for the Spacebar to start working
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Only trigger if NOT working, the key is Space, and user isn't typing in another random input
      if (!isWorking && e.code === "Space" && e.target.tagName !== "INPUT") {
        e.preventDefault(); // Prevents the page from scrolling down
        handleStartWorking();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isWorking, handleStartWorking]);

  // 4. Handle input navigation on Enter press
  const handleFrameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent accidental form submissions
      if (frameNumber.trim() !== "") {
        facesInputRef.current?.focus(); // Jump to the faces input
      }
    }
  };

  const handleFacesKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isFormValid) {
        handleCompleteFrame(); // Submit and reset
      }
    }
  };

  const todayString = new Date().toLocaleDateString();
  const todaysEntries = entries.filter((entry) => entry.date === todayString);
  
  const totalFramesCompleted = todaysEntries.length;
  const totalFacesCompleted = todaysEntries.reduce((sum, entry) => sum + entry.facesCompleted, 0);
  const totalTimeSpent = todaysEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileVideo size={36} className="text-slate-900" />
          <h1 className="text-4xl font-bold text-slate-900">
            CVAT Work Tracker
          </h1>
        </div>
        <p className="text-slate-500">
          Face Annotation Progress Tracker • 6 Objects per Face (Box, Eyes,
          Nose, Mouth)
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Quick Entry Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">
              Quick Entry
            </h2>

            {!isWorking ? (
              <button
                onClick={handleStartWorking}
                className="w-full bg-[#0B0F19] hover:bg-slate-800 text-white rounded-lg py-3 flex items-center justify-center gap-2 transition-colors group"
              >
                <Play size={18} />
                <span className="font-medium">Start Working on Frame</span>
                <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                  Press Space
                </span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Status Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-green-700 text-sm">Working since</p>
                    <p className="text-green-700 font-semibold">
                      {startTime ? new Date(startTime).toLocaleTimeString("en-US", { hour12: false }) : ""}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* Inputs */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-slate-700">
                      Frame Number
                    </label>
                    <span className="text-xs text-slate-400">Press Enter ↵ to advance</span>
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
                    <label className="block text-sm font-medium text-slate-700">
                      Number of Faces Completed
                    </label>
                    <span className="text-xs text-slate-400">Press Enter ↵ to submit</span>
                  </div>
                  <input
                    ref={facesInputRef}
                    type="number"
                    placeholder="e.g., 3"
                    value={facesCompleted}
                    onChange={(e) => setFacesCompleted(e.target.value)}
                    onKeyDown={handleFacesKeyDown}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 placeholder-slate-400"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCompleteFrame}
                    disabled={!isFormValid}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-colors ${
                      isFormValid
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-500 text-white cursor-not-allowed opacity-90"
                    }`}
                  >
                    <Plus size={18} />
                    Complete Frame
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Square size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today's Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Today's Summary
            </h2>
            <p className="text-sm text-slate-500 mb-4">{todayString}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar size={16} className="text-blue-500" />
                  <span>
                    Frames
                    <br />
                    Completed
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{totalFramesCompleted}</span>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Eye size={16} className="text-purple-500" />
                  <span>Total Faces</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{totalFacesCompleted}</span>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={16} className="text-orange-500" />
                  <span>Time Spent</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">{totalTimeSpent}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Work History
              </h2>
              <p className="text-sm text-slate-500">{todaysEntries.length} entries today</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} />
              Export to CSV
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {todaysEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-12">
                <h3 className="text-slate-500 font-medium mb-1">
                  No entries yet today
                </h3>
                <p className="text-slate-400 text-sm">
                  Start working on a frame to create your first entry
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysEntries.map((entry) => (
                  <div key={entry.id} className="p-4 border border-slate-100 bg-slate-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">Frame: {entry.frameNumber}</p>
                      <p className="text-xs text-slate-500">{entry.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-600">{entry.facesCompleted} faces</p>
                      <p className="text-xs text-slate-500">{entry.durationMinutes} min</p>
                    </div>
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