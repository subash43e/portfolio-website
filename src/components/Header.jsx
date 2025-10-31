import React from "react";

const Header = () => {
  return (
    <header className="border-b border-cyan-600">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 font-mono text-lg bg-gray-900 text-white p-3 rounded-md">
            <span className="font-semibold text-green-400">&gt;</span>
            <span className="font-medium">Subash dev</span>

            {/* Blinking Cursor */}
            <span className="w-2 h-5 bg-white animate-pulse"></span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#about" className="hover:text-white">
            About
          </a>
          <a href="#skills" className="hover:text-white">
            Skills
          </a>
          <a href="#projects" className="hover:text-white">
            Projects
          </a>
          <a href="#contact" className="hover:text-white">
            Contact
          </a>
          <a
            href="#contact"
            className="ml-4 px-3 py-1.5 bg-cyan-600 text-slate-900 rounded-md text-sm"
          >
            Contact Me
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
