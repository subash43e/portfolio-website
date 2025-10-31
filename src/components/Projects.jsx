import React from 'react';
import ProjectCard from './ProjectCard';

const Projects = () => {
  const projects = [
    {
      title: 'Project Alpha',
      description: 'Problem: E-commerce clients struggled with a slow and clunky user interface, leading to high cart abandonment rates. Solution: I designed and developed a lightning-fast, responsive storefront using React and Next.js, resulting in a 40% increase in conversions.',
      tech: 'React · Next.js · Stripe',
      link: '#',
      bgClass: 'bg-linear-to-br from-sky-500 to-violet-400'
    },
    {
      title: 'Project Beta',
      description: 'Problem: A non-profit needed a way to manage volunteers and events efficiently. Solution: I built a custom web application with a Django backend and a Vue.js frontend, streamlining administrative tasks and improving volunteer engagement.',
      tech: 'Django · Vue.js · PostgreSQL',
      link: '#',
      bgClass: 'bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center',
      innerBg: 'w-20 h-20 bg-white rounded-full shadow-md'
    },
    {
      title: 'Project Gamma',
      description: 'Problem: A local blogger wanted a personal website to showcase articles with a modern and readable design. Solution: I developed a custom, mobile-first blog using a headless CMS and Gatsby for optimal performance and SEO.',
      tech: 'Gatsby · Contentful · GraphQL',
      link: '#',
      bgClass: 'bg-linear-to-br from-amber-600 to-rose-500'
    }
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