import React from "react";

const Skills = () => {
  return (
    <section id="skills">
      <h3 className="text-white font-semibold text-lg">Skills</h3>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Frontend</h4>
          <div className="flex flex-wrap gap-2">
            {[
              "HTML5",
              "CSS3",
              "JavaScript",
              "React",
              "Tailwind CSS",
              "shadcn/ui",
              "Next.js",
              "Vite",
            ].map((s) => (
              <span
                key={s}
                className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Backend</h4>
          <div className="flex flex-wrap gap-2">
            {[
              "Node.js",
              "MongoDB",
              "PostgreSQL",
              "Firebase",
              "REST APIs",
              "JWT Authentication",
            ].map((s) => (
              <span
                key={s}
                className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow">
          <h4 className="text-white font-medium mb-3">Tools</h4>
          <div className="flex flex-wrap gap-2">
            {[
              "Git & GitHub",
              "npm",
              "VS Code",
              "Linux",
              "Vercel/Netlify (Deployment)",
            ].map((s) => (
              <span
                key={s}
                className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
