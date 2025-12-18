import MDEditor from "@uiw/react-md-editor";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Blog = () => {
  const { blogs } = useStore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <p className="text-lg mb-6 text-slate-400">
          Welcome to my blog! Here I'll share my thoughts, experiences, and
          insights on various topics.
        </p>

        <div className="space-y-6">
          {blogs.length === 0 ? (
            <div className="text-center text-slate-500 py-20 border border-dashed border-slate-800 rounded-3xl">
              No blog posts available.
            </div>
          ) : (
            blogs.map((blog, index) => {
              const authorName = currentUser?.displayName || "Admin";
              const authorInitial = authorName.charAt(0).toUpperCase();
              const blogDate = blog.createdAt 
                ? new Date(blog.createdAt.toDate()).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : new Date(blog.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });

              return (
              <article
                key={blog.id || index}
                className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl overflow-hidden hover:bg-slate-900/80 hover:border-cyan-500/30 transition-all duration-500"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-colors" />

                <div data-color-mode="dark" className="relative z-10">
                  <div className="line-clamp-3">
                    <MDEditor.Markdown
                      source={blog.content}
                      style={{
                        backgroundColor: "transparent",
                        fontSize: "0.95rem",
                      }}
                      className="prose prose-invert prose-slate max-w-none 
                      prose-headings:text-slate-100 prose-headings:mb-2
                      prose-p:text-slate-400 prose-p:leading-relaxed"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {currentUser?.photoURL && currentUser.photoURL.trim() ? (
                        <img
                          src={currentUser.photoURL}
                          alt={authorName}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-700 shadow-inner"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 shadow-inner">
                          {authorInitial}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {authorName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {blogDate} • {blog.readTime || "5 min read"}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/blog/${blog.id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-cyan-600 hover:text-white transition-all duration-300 shadow-lg cursor-pointer"
                  >
                    READ
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                </div>
              </article>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
