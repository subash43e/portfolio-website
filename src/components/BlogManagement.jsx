import { useNavigate } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../hooks/useAuth";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from "react";

const BlogManagement = () => {
  const { blogs, setBlogsState } = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [shareConfirm, setShareConfirm] = useState(null);

  const handleDeleteBlog = async (blogId) => {
    setDeletingId(blogId);
    try {
      await deleteDoc(doc(db, "Blogs", blogId));
      const updatedBlogs = blogs.filter((blog) => blog.id !== blogId);
      if (window.__storeSetBlogs) {
        window.__storeSetBlogs(updatedBlogs);
      }
      setExpandedId(null);
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareBlog = (blogTitle) => {
    console.log(`Post "${blogTitle}" is shared`);
    alert(`✓ Post is shared\n\n"${blogTitle}"`);
    setShareConfirm(null);
  };

  const formatDate = (blog) => {
    if (blog.createdAt) {
      return new Date(blog.createdAt.toDate()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return new Date(blog.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Blog Management</h1>
            <p className="text-slate-400">
              View, edit, and delete your published blog posts
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold"
          >
            Go Back
          </button>
        </div>

        {/* Blog List */}
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          {blogs.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No blogs published yet</h3>
              <p className="text-slate-500 mb-6">Start creating your first blog post!</p>
              <button
                onClick={() => navigate("/owner/blog/create")}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition duration-200"
              >
                Create New Blog
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {blogs.map((blog, index) => {
                const titleMatch = blog.content.match(/^#{1,3}\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : `Blog Post ${index + 1}`;
                const wordCount = blog.content.trim().split(/\s+/).length;
                const isExpanded = expandedId === blog.id;

                return (
                  <div
                    key={blog.id || index}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden transition-all"
                  >
                    {/* Blog Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : blog.id)}
                      className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white text-lg">{title}</p>
                        <div className="flex gap-4 text-sm text-slate-400 mt-1">
                          <span>{formatDate(blog)}</span>
                          <span>{blog.readTime || "5 min read"}</span>
                          <span>{wordCount} words</span>
                        </div>
                      </div>
                      
                      {/* Toggle Icon */}
                      <svg
                        className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    {/* Expanded Actions */}
                    {isExpanded && (
                      <div className="bg-slate-800/50 border-t border-slate-700 px-6 py-4 flex gap-3">
                        <button
                          onClick={() => navigate(`/blog/${blog.id}`)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-cyan-300 hover:text-cyan-200 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>

                        <button
                          onClick={() => navigate(`/owner/blog/edit/${blog.id}`)}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>

                        <button
                          onClick={() => handleShareBlog(title)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-teal-300 hover:text-teal-200 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.589 12.938 10 12.052 10 11c0-1.657-1.343-3-3-3-1.657 0-3 1.343-3 3 0 1.052.411 1.938 1.316 2.342m0 0a9 9 0 019.632-3.36m0 0a9 9 0 110-4.682m0 0" />
                          </svg>
                          Share
                        </button>

                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          disabled={deletingId === blog.id}
                          className="flex-1 bg-slate-700 hover:bg-red-600 disabled:opacity-50 text-red-300 hover:text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 border border-slate-600 hover:border-red-500"
                        >
                          {deletingId === blog.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {blogs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">Total Posts</p>
              <p className="text-3xl font-bold text-cyan-400">{blogs.length}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">Total Words</p>
              <p className="text-3xl font-bold text-cyan-400">
                {blogs.reduce((sum, blog) => sum + blog.content.trim().split(/\s+/).length, 0)}
              </p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">Average Reading Time</p>
              <p className="text-3xl font-bold text-cyan-400">
                {Math.round(blogs.reduce((sum, blog) => {
                  const time = blog.readTime ? parseInt(blog.readTime) : 5;
                  return sum + time;
                }, 0) / blogs.length)} min
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
