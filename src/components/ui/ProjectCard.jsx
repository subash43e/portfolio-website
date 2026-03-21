
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const ProjectCard = ({ title, description, tech, link, bgClass, innerBg }) => {
  return (
    <motion.article 
      className="bg-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`md:w-1/3 h-40 md:h-auto ${bgClass}`}>
        {innerBg && <div className={innerBg}></div>}
      </div>
      <div className="p-6 md:w-2/3">
        <h4 className="text-white font-semibold text-xl">{title}</h4>
        <p className="mt-3 text-slate-300 text-sm">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-cyan-300">{tech}</div>
          <motion.a 
            className="text-sm text-cyan-500 hover:underline" 
            href={link}
            whileHover={{ x: 5 }}
          >
            View Project
          </motion.a>
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;