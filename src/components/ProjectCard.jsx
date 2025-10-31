
const ProjectCard = ({ title, description, tech, link, bgClass, innerBg }) => {
  return (
    <article className="bg-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
      <div className={`md:w-1/3 h-40 md:h-auto ${bgClass}`}>
        {innerBg && <div className={innerBg}></div>}
      </div>
      <div className="p-6 md:w-2/3">
        <h4 className="text-white font-semibold text-xl">{title}</h4>
        <p className="mt-3 text-slate-300 text-sm">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-cyan-300">{tech}</div>
          <a className="text-sm text-cyan-500 hover:underline" href={link}>View Project</a>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;