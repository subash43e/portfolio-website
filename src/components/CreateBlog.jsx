import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const CreateBlog = () => {
  // 1. Initialize state with some default text
  const [markdown, setMarkdown] = useState(
    "# Welcome to my Blog\n\nStart typing your markdown here..."
  );

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8 text-cyan-400">
        Create Blog Page
      </h1>

      {/* Main Editor Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 h-[80vh]">
        {/* LEFT SIDE: Input Area */}
        <div className="flex flex-col h-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-slate-400">
            MARKDOWN INPUT
          </div>
          <textarea
            className="w-full h-full p-6 bg-slate-900 text-slate-300 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck="false"
          ></textarea>
        </div>

        {/* RIGHT SIDE: Preview Area */}
        <div className="flex flex-col h-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-slate-400">
            PREVIEW
          </div>

          {/* Note: 'prose' and 'prose-invert' come from the @tailwindcss/typography plugin.
            They automatically style h1, h2, p, ul, etc. inside this div.
          */}
          <div className="w-full h-full p-6 overflow-y-auto prose prose-invert prose-cyan max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {markdown}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
