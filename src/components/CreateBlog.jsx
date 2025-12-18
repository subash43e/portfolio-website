import MDEditor from "@uiw/react-md-editor";
import { useStore } from "../hooks/useStore";

function BlogCreator() {
  const { mdContent, setMdContent, saveBlog } = useStore();

  const handlePublish = (e) => {
    e.preventDefault();
    saveBlog(mdContent);
  };

  return (
    <div className="h-full w-full text-slate-100 flex flex-col items-center py-4 px-4">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">
        Create Blog Page
      </h1>
      <div className="w-full flex-1 flex justify-center">
        <div className="w-full max-h-1/3 flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl h-full">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-sm font-semibold text-slate-400">
            MARKDOWN INPUT
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
        <button
          onClick={handlePublish}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
        >
          Publish Blog Post
        </button>
      </div>
    </div>
  );
}

export default BlogCreator;
