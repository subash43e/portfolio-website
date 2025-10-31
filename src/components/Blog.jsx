import React from 'react';

const Blog = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        <p className="text-lg mb-6">Welcome to my blog! Here I'll share my thoughts, experiences, and insights on various topics.</p>
        <div className="space-y-6">
          {/* Placeholder for blog posts */}
          <article className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Sample Blog Post</h2>
            <p className="text-slate-300 mb-4">Published on October 31, 2025</p>
            <p>This is a sample blog post. More content coming soon!</p>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Blog;