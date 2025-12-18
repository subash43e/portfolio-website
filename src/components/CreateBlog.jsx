import MDEditor from "@uiw/react-md-editor";
import { useStore } from "../hooks/useStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function BlogCreator() {
  const { mdContent, setMdContent, saveBlog } = useStore();
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null); // 'success', 'error', null

  const handlePublish = async (e) => {
    e.preventDefault();
    
    if (!mdContent.trim()) {
      setPublishStatus("error");
      alert("Please write some content before publishing!");
      return;
    }

    setIsPublishing(true);
    try {
      await saveBlog(mdContent);
      setPublishStatus("success");
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        navigate("/blog");
      }, 2000);
    } catch (error) {
      console.error("Publish error:", error);
      setPublishStatus("error");
      setTimeout(() => setPublishStatus(null), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-full w-full text-slate-100 flex flex-col items-center py-4 px-4">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">
        Create Blog Post
      </h1>

      {/* Success Message */}
      {publishStatus === "success" && (
        <div className="mb-4 w-full max-w-4xl bg-green-500/20 border border-green-500 text-green-200 px-6 py-4 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
          <div>
            <p className="font-semibold">Blog published successfully! 🎉</p>
            <p className="text-sm text-green-200/80">Redirecting to blog page...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {publishStatus === "error" && (
        <div className="mb-4 w-full max-w-4xl bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <p className="font-semibold">Failed to publish blog. Please try again.</p>
        </div>
      )}

      <div className="w-full flex-1 flex justify-center">
        <div className="w-full max-h-1/3 flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl h-full">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-slate-400 flex justify-between items-center">
            <span>MARKDOWN INPUT</span>
            <span className="text-xs text-slate-500">
              {mdContent.trim().split(/\s+/).length} words
            </span>
          </div>
          <div
            data-color-mode="dark"
            className="flex-1 w-full overflow-y-auto "
          >
            <MDEditor onChange={setMdContent} value={mdContent} height={500} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            disabled={isPublishing}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Go Back
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !mdContent.trim()}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publishing...
              </>
            ) : (
              <>
                Publish Blog Post
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Your blog will be visible on the /blog page after publishing
        </p>
      </div>
    </div>
  );
}

export default BlogCreator;
