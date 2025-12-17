import {  useNavigate } from "react-router-dom";

const Modal = ({ toggleModal }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-cyan-950 p-6 shadow-2xl transition-all ring-1 ring-gray-900/5">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <button
            onClick={toggleModal}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/owner/blog/create/")}
            className="group flex w-full items-center justify-between rounded-xl bg-cyan-50 px-4 py-3 text-slate-700 transition-all hover:bg-cyan-100 hover:shadow-md"
          >
            <span className="font-semibold">Create New Post</span>
            <svg
              className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button className="group flex w-full items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-slate-700 transition-all hover:bg-red-100 hover:shadow-md">
            <span className="font-semibold">Manage blogs</span>
            <svg
              className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
