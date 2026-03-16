import { useState } from 'react';
import { 
  FileVideo, 
  Play, 
  Download, 
  Calendar, 
  Eye, 
  Clock, 
  Plus, 
  Square 
} from 'lucide-react';

const CvatCalculation = () => {
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [frameNumber, setFrameNumber] = useState('');
  const [facesCompleted, setFacesCompleted] = useState('');

  const handleStartWorking = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    setStartTime(timeString);
    setIsWorking(true);
  };

  const handleCancel = () => {
    setIsWorking(false);
    setFrameNumber('');
    setFacesCompleted('');
    setStartTime('');
  };

  const isFormValid = frameNumber.trim() !== '' && facesCompleted.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileVideo size={36} className="text-slate-900" />
          <h1 className="text-4xl font-bold text-slate-900">CVAT Work Tracker</h1>
        </div>
        <p className="text-slate-500">
          Face Annotation Progress Tracker • 6 Objects per Face (Box, Eyes, Nose, Mouth)
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Quick Entry Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Quick Entry</h2>
            
            {!isWorking ? (
              <button 
                onClick={handleStartWorking}
                className="w-full bg-[#0B0F19] hover:bg-slate-800 text-white rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} />
                <span className="font-medium">Start Working on Frame</span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Status Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-green-700 text-sm">Working since</p>
                    <p className="text-green-700 font-semibold">{startTime}</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* Inputs */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Frame Number
                  </label>
                  <input 
                    type="text" 
                    value={frameNumber}
                    onChange={(e) => setFrameNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Number of Faces Completed
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g., 3"
                    value={facesCompleted}
                    onChange={(e) => setFacesCompleted(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 placeholder-slate-400"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={!isFormValid}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-colors ${
                      isFormValid 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-500 text-white cursor-not-allowed opacity-90'
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
            <h2 className="text-lg font-semibold text-slate-800">Today's Summary</h2>
            <p className="text-sm text-slate-500 mb-4">3/16/2026</p>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Frames Completed */}
              <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Calendar size={16} className="text-blue-500" />
                  <span>Frames<br/>Completed</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">0</span>
              </div>

              {/* Total Faces */}
              <div className="bg-purple-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Eye size={16} className="text-purple-500" />
                  <span>Total Faces</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">0</span>
              </div>

              {/* Time Spent */}
              <div className="bg-orange-50 rounded-xl p-4 flex flex-col justify-between h-24">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={16} className="text-orange-500" />
                  <span>Time Spent</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">0m</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Work History</h2>
              <p className="text-sm text-slate-500">0 entries today</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} />
              Export to CSV
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-500 font-medium mb-1">No entries yet today</h3>
            <p className="text-slate-400 text-sm">Start working on a frame to create your first entry</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CvatCalculation;