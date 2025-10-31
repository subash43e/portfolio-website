import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-cyan-600">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-1 font-mono text-lg bg-gray-900 text-white p-3 rounded-md">
            <span className="font-semibold text-green-400">&gt;</span>
            <span className="font-medium">Subash dev</span>

            {/* Blinking Cursor */}
            <span className="w-2 h-5 bg-white animate-pulse"></span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <Link to="/#about" className="hover:text-white">
            About
          </Link>
          <Link to="/#skills" className="hover:text-white">
            Skills
          </Link>
          <Link to="/#projects" className="hover:text-white">
            Projects
          </Link>
          <Link to="/#contact" className="hover:text-white">
            Contact
          </Link>
          <Link to="/blog" className="hover:text-white">
            Blog
          </Link>
          <Link
            to="/#contact"
            className="ml-4 px-3 py-1.5 bg-cyan-600 text-slate-900 rounded-md text-sm"
          >
            Contact Me
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
