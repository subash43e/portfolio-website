import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../hooks/useAuth";
import MDEditor from "@uiw/react-md-editor";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { blogs } = useStore();
  const { currentUser } = useAuth();

  // Find the specific blog
  const blog = blogs.find((b) => b.id === id);

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog Not Found</h1>
          <p className="text-slate-400 mb-6">The blog post you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/blog")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const authorName = currentUser?.displayName || "Admin";
  const blogDate = blog.createdAt
    ? new Date(blog.createdAt.toDate()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(blog.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </button>
        </div>

        {/* Author Info */}
        <div className="mb-8 flex items-center gap-4 pb-8 border-b border-slate-700">
          <div className="relative">
            {currentUser?.photoURL && currentUser.photoURL.trim() ? (
              <img
                src={currentUser.photoURL}
                alt={authorName}
                className="h-16 w-16 rounded-full object-cover border-2 border-cyan-500"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 border-2 border-cyan-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{authorName}</h3>
            <p className="text-slate-400 text-sm">
              {blogDate} • {blog.readTime || "5 min read"}
            </p>
          </div>
        </div>

        {/* Blog Content */}
        <article className="prose prose-invert prose-slate max-w-none">
          <div data-color-mode="dark">
            <MDEditor.Markdown
              source={blog.content}
              style={{
                backgroundColor: "transparent",
                color: "#e2e8f0",
              }}
              className="prose prose-invert prose-slate max-w-none 
              prose-headings:text-slate-100 prose-headings:mt-8 prose-headings:mb-4
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-cyan-400 prose-a:hover:text-cyan-300
              prose-code:text-cyan-400 prose-code:bg-slate-800/50 prose-code:px-2 prose-code:py-1 prose-code:rounded
              prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
              prose-blockquote:border-l-cyan-500 prose-blockquote:text-slate-300
              prose-img:rounded-lg prose-img:shadow-lg
              prose-li:text-slate-300
              prose-hr:border-slate-700"
            />
          </div>
        </article>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/blog")}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
