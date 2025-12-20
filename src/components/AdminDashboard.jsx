import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import Model from "./Model";
import { useStore } from "../hooks/useStore";

const UserProfileModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
      fetchUserProfile();
    }
  }, [currentUser, isOpen]);

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setBio(data.bio || "");
        if (data.photoURL) setPhotoURL(data.photoURL);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let finalPhotoURL = photoURL;

      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: finalPhotoURL,
      });

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName: displayName,
          photoURL: finalPhotoURL,
          bio: bio,
          email: currentUser.email,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setPhotoURL(finalPhotoURL);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg max-w-2xl w-full mx-4 p-8 shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">User Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded mb-4">
            {success}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              {photoURL && photoURL.trim() ? (
                <img
                  src={photoURL}
                  alt="User Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-cyan-600 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-linear-to-br from-cyan-500 to-cyan-700 border-4 border-cyan-600 shadow-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {(displayName || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-100">
                  {displayName || "User"}
                </h3>
                <p className="text-slate-400 mb-2">{currentUser?.email}</p>
                <p className="text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-md min-h-15">
                  {bio || "No bio added yet"}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-6 rounded-md shadow-lg shadow-cyan-600/20"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Profile Photo URL
              </label>
              <div className="flex items-center gap-6">
                {photoURL && photoURL.trim() ? (
                  <img
                    src={photoURL}
                    alt="User Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-cyan-600"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-cyan-500 to-cyan-700 border-4 border-cyan-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {(displayName || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter image URL"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-cyan-500 resize-none"
                rows="4"
              ></textarea>
            </div>
            <div className="flex gap-4 justify-end pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchUserProfile();
                }}
                className="bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-700 py-2 px-6 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-6 rounded-md disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { blogs } = useStore();

  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const toggleBlogModal = (e) => {
    if (e) e.preventDefault();
    setShowBlogModal(!showBlogModal);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200 text-sm font-medium shadow-lg shadow-red-600/20"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8 bg-linear-to-r from-cyan-900/80 to-slate-800 p-6 rounded-lg border border-cyan-700/30 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {currentUser?.photoURL && currentUser.photoURL.trim() ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-4 border-cyan-500 shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-slate-700 border-4 border-cyan-500 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-cyan-500">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentUser?.displayName || "Admin User"}
              </h2>
              <p className="text-cyan-200 mb-2">{currentUser?.email}</p>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                System Administrator
              </p>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold shadow-lg shadow-cyan-600/20"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2 text-cyan-400">
              Blog Management
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              Create new articles, edit existing posts, and manage content.
            </p>
            <button
              onClick={toggleBlogModal}
              className="w-full bg-slate-700 hover:bg-cyan-600 hover:text-white text-cyan-400 px-4 py-2 rounded-md transition duration-200"
            >
              Manage Blog
            </button>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2 text-cyan-400">
              Projects Management
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              Add new portfolio projects, update details, and organize work.
            </p>
            <button className="w-full bg-slate-700 hover:bg-cyan-600 hover:text-white text-cyan-400 px-4 py-2 rounded-md transition duration-200">
              Manage Projects
            </button>
          </div>
        </div>

        {/* --- Quick Stats --- */}
        <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-slate-300 border-b border-slate-700 pb-2">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                {blogs.length}
              </div>
              <div className="text-slate-400 text-sm">Blog Posts</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <div className="text-3xl font-bold text-cyan-400 mb-1">0</div>
              <div className="text-slate-400 text-sm">Visitors</div>
            </div>
          </div>
        </div>

        {showBlogModal && <Model toggleModal={toggleBlogModal} />}

        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
