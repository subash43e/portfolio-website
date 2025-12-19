import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const BlogEdit = () => {
  const { id } = useParams();
  const { blogs } = useStore();
  const navigate = useNavigate();
  const [mdContent, setMdContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Find the blog to edit
  useEffect(() => {
    const blog = blogs.find((b) => b.id === id);
    if (blog) {
      setMdContent(blog.content);
    } else {
      setError("Blog not found!");
    }
  }, [id, blogs]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!mdContent.trim()) {
      setError("Please write some content!");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const words = mdContent.trim().split(/\s+/).length;
      const readingTime = Math.ceil(words / 200);

      await updateDoc(doc(db, "Blogs", id), {
        content: mdContent,
        readTime: `${readingTime} min read`,
        updatedAt: new Date(),
      });

      setSuccess("Blog updated successfully! 🎉");
      setTimeout(() => {
        navigate("/owner/blogs/management");
      }, 2000);
    } catch (err) {
      console.error("Error updating blog:", err);
      setError("Failed to update blog. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !blogs.find((b) => b.id === id)) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog Not Found</h1>
          <p className="text-slate-400 mb-6">The blog post you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/owner/blogs/management")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold"
          >
            Back to Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full text-slate-100 flex flex-col items-center py-4 px-4">
      <h1 className="text-3xl font-bold mb-2 text-cyan-400">Edit Blog Post</h1>
      <p className="text-slate-400 mb-6">Update your blog content below</p>

      {/* Success Message */}
      {success && (
        <div className="mb-4 w-full max-w-4xl bg-green-500/20 border border-green-500 text-green-200 px-6 py-4 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
          <div>
            <p className="font-semibold">Blog updated successfully!</p>
            <p className="text-sm text-green-200/80">Redirecting to management...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 w-full max-w-4xl bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="w-full flex-1 flex justify-center">
        <div className="w-full max-h-1/3 flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl h-full">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-slate-400 flex justify-between items-center">
            <span>MARKDOWN EDITOR</span>
            <span className="text-xs text-slate-500">
              {mdContent.trim().split(/\s+/).length} words
            </span>
          </div>
          <div data-color-mode="dark" className="flex-1 w-full overflow-y-auto">
            <MDEditor onChange={setMdContent} value={mdContent} height={500} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/owner/blogs/management")}
            disabled={isSaving}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !mdContent.trim()}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Save Changes
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Your changes will be saved to Firestore
        </p>
      </div>
    </div>
  );
};

export default BlogEdit;
