import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Model from "./Model";

const AdminDashboard = () => {
  const [useModel, setToggleModel] = useState(false);

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/owner/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const toggleModel = (e) => {
    e.preventDefault();
    setToggleModel(!useModel);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">
              Welcome, {currentUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Blog Management Card */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Blog Management</h2>
            <p className="text-slate-300 mb-4">
              Create, edit, and manage blog posts
            </p>
            <button
              onClick={toggleModel}
              className="bg-cyan-600 hover:bg-cyan-700 text-slate-900 px-4 py-2 rounded-md transition duration-200"
            >
              Manage Blog
            </button>
          </div>

          {/* Projects Management Card */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Projects Management</h2>
            <p className="text-slate-300 mb-4">
              Add, update, and organize projects
            </p>
            <button className="bg-cyan-600 hover:bg-cyan-700 text-slate-900 px-4 py-2 rounded-md transition duration-200">
              Manage Projects
            </button>
          </div>

          {/* File Storage Card */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">File Storage</h2>
            <p className="text-slate-300 mb-4">
              Upload and manage files and images
            </p>
            <button className="bg-cyan-600 hover:bg-cyan-700 text-slate-900 px-4 py-2 rounded-md transition duration-200">
              Manage Files
            </button>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="mt-8 bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">0</div>
              <div className="text-slate-300">Blog Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">0</div>
              <div className="text-slate-300">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">0</div>
              <div className="text-slate-300">Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">0</div>
              <div className="text-slate-300">Visitors</div>
            </div>
          </div>
        </div>
        {useModel && <Model />}
      </div>
    </div>
  );
};

export default AdminDashboard;
