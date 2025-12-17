import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const Skills = () => {
  const skillCategories = [
    {
      title: "Frontend",
      skills: [
        "HTML5",
        "CSS3",
        "JavaScript",
        "React",
        "Tailwind CSS",
        "shadcn/ui",
        "Next.js",
        "Vite",
      ],
    },
    {
      title: "Backend",
      skills: [
        "Node.js",
        "MongoDB",
        "PostgreSQL",
        "Firebase",
        "REST APIs",
        "JWT Authentication",
      ],
    },
    {
      title: "Tools",
      skills: [
        "Git & GitHub",
        "npm",
        "VS Code",
        "Linux",
        "Vercel/Netlify (Deployment)",
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const skillVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <section id="skills">
      <h3 className="text-white font-semibold text-lg">Skills</h3>
      <motion.div 
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {skillCategories.map((category) => (
          <motion.div
            key={category.title}
            className="bg-slate-800 p-6 rounded-lg shadow"
            variants={cardVariants}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <h4 className="text-white font-medium mb-3">{category.title}</h4>
            <motion.div 
              className="flex flex-wrap gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {category.skills.map((skill) => (
                <motion.span
                  key={skill}
                  className="text-xs bg-slate-700 text-slate-200 px-3 py-1 rounded-full"
                  variants={skillVariants}
                  whileHover={{ scale: 1.1, backgroundColor: "#0f172a" }}
                >
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Skills;
