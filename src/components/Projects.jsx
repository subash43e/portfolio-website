import React from "react";
import ProjectCard from "./ProjectCard";

const Projects = () => {
  const projects = [
    {
      title: "Expense Tracker - Full-Stack Application",
      description:
        "A comprehensive expense management application featuring complete user authentication and real-time data management. Built with cutting-edge technologies including Next.js 16 and React 19, this full-stack application demonstrates modern web development practices.",
      tech: "React · Next.js · MongoDB · JWT · Tailwind CSS · Zod",
      link: "https://github.com/subash43e/expense_tracker",
      bgClass: "bg-linear-to-br from-sky-500 to-violet-400",
    },
    {
      title: "Personal Portfolio Website",
      description:
        "A modern, responsive portfolio website showcasing my journey from commerce background to full-stack development. Built with performance-first approach using Vite for lightning-fast development and optimized builds.",
      tech: "React · Vite · Tailwind CSS · JavaScript",
      link: "https://github.com/subash43e/portfolio-website",
      bgClass:
        "bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center",
      innerBg: "w-20 h-20 bg-white rounded-full shadow-md",
    },
    {
      title: "GitHub Activity CLI Tooli",
      description:
        "A command-line interface tool that fetches and displays GitHub user activity using the GitHub REST API. This project demonstrates proficiency in API integration, command-line development, and data processing.",
      tech: "Node.js · GitHub API · JavaScript",
      link: "https://github.com/subash43e/github-activity",
      bgClass: "bg-linear-to-br from-amber-600 to-rose-500",
    },
  ];

  return (
    <section id="projects">
      <h3 className="text-white font-semibold text-lg">Projects</h3>
      <div className="mt-6 space-y-6">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>
    </section>
  );
};

export default Projects;
