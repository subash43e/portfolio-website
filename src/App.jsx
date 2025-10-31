import React from 'react'
import './index.css'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-slate-900 font-bold">♦</div>
            <span className="font-medium">Web Developer</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#about" className="hover:text-white">About</a>
            <a href="#skills" className="hover:text-white">Skills</a>
            <a href="#projects" className="hover:text-white">Projects</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <a href="#contact" className="ml-4 px-3 py-1.5 bg-cyan-600 text-slate-900 rounded-md text-sm">Contact Me</a>
          </nav>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {/* Hero */}
        <section className="pt-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-md">I Build Modern Web<br/>Solutions</h1>
            <p className="mt-6 text-slate-300 max-w-2xl mx-auto">Passionate web developer creating beautiful and functional websites that solve real-world problems.</p>
            <div className="mt-8">
              <a href="#projects" className="inline-block bg-cyan-600 text-slate-900 px-4 py-2 rounded-md shadow">View My Work</a>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="pt-8">
          <div className="max-w-3xl">
            <h2 className="text-white font-semibold text-xl">About Me</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">I'm a passionate web developer with a knack for building elegant and effective solutions. I thrive on turning complex problems into simple, beautiful, and intuitive designs. When I'm not coding, you'll find me exploring the latest web technologies and contributing to open-source projects. I'm driven by a desire to create digital experiences that are not only visually appealing but also accessible and user-friendly.</p>
          </div>
        </section>

        {/* Skills */}
        <section id="skills">
          <h3 className="text-white font-semibold text-lg">Skills</h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/** Single skill card **/}
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

        {/* Projects */}
        <section id="projects">
          <h3 className="text-white font-semibold text-lg">Projects</h3>
          <div className="mt-6 space-y-6">
            {/** Project Card template **/}
            <article className="bg-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
              <div className="md:w-1/3 h-40 md:h-auto bg-linear-to-br from-sky-500 to-violet-400"></div>
              <div className="p-6 md:w-2/3">
                <h4 className="text-white font-semibold text-xl">Project Alpha</h4>
                <p className="mt-3 text-slate-300 text-sm">Problem: E-commerce clients struggled with a slow and clunky user interface, leading to high cart abandonment rates. Solution: I designed and developed a lightning-fast, responsive storefront using React and Next.js, resulting in a 40% increase in conversions.</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-cyan-300">React · Next.js · Stripe</div>
                  <a className="text-sm text-cyan-500 hover:underline" href="#">View Project</a>
                </div>
              </div>
            </article>

            <article className="bg-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
              <div className="md:w-1/3 h-40 md:h-auto bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-md"></div>
              </div>
              <div className="p-6 md:w-2/3">
                <h4 className="text-white font-semibold text-xl">Project Beta</h4>
                <p className="mt-3 text-slate-300 text-sm">Problem: A non-profit needed a way to manage volunteers and events efficiently. Solution: I built a custom web application with a Django backend and a Vue.js frontend, streamlining administrative tasks and improving volunteer engagement.</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-cyan-300">Django · Vue.js · PostgreSQL</div>
                  <a className="text-sm text-cyan-500 hover:underline" href="#">View Project</a>
                </div>
              </div>
            </article>

            <article className="bg-slate-800 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
              <div className="md:w-1/3 h-40 md:h-auto bg-linear-to-br from-amber-600 to-rose-500"></div>
              <div className="p-6 md:w-2/3">
                <h4 className="text-white font-semibold text-xl">Project Gamma</h4>
                <p className="mt-3 text-slate-300 text-sm">Problem: A local blogger wanted a personal website to showcase articles with a modern and readable design. Solution: I developed a custom, mobile-first blog using a headless CMS and Gatsby for optimal performance and SEO.</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-cyan-300">Gatsby · Contentful · GraphQL</div>
                  <a className="text-sm text-cyan-500 hover:underline" href="#">View Project</a>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="text-center py-12">
          <h3 className="text-white font-semibold text-lg">Get In Touch</h3>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">I'm currently available for freelance work and open to new opportunities. Let's build something amazing together.</p>
          <div className="mt-6">
            <a href="mailto:hello@example.com" className="inline-block bg-cyan-600 text-slate-900 px-4 py-2 rounded-md shadow">Say Hello</a>
          </div>
        </section>
      </main>
    </div>
  )
}
