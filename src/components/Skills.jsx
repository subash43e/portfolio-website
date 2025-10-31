import React from 'react';

const Skills = () => {
  return (
    <section id="skills">
      <h3 className="text-white font-semibold text-lg">Skills</h3>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Frontend</h4>
          <div className="flex flex-wrap gap-2">
            {['HTML5','CSS3','JavaScript','React','Vue.js','Tailwind CSS'].map(s => (
              <span key={s} className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Backend</h4>
          <div className="flex flex-wrap gap-2">
            {['Node.js','Express','Python','Django','PHP'].map(s => (
              <span key={s} className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Databases</h4>
          <div className="flex flex-wrap gap-2">
            {['MongoDB','PostgreSQL','MySQL','Firebase'].map(s => (
              <span key={s} className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Tools</h4>
          <div className="flex flex-wrap gap-2">
            {['Git','Docker','Webpack','Figma','Jira'].map(s => (
              <span key={s} className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;