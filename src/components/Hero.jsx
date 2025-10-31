import React from 'react';

const Hero = () => {
  return (
    <section className="pt-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-md">I Build Modern Web<br/>Solutions</h1>
        <p className="mt-6 text-slate-300 max-w-2xl mx-auto">Passionate web developer creating beautiful and functional websites that solve real-world problems.</p>
        <div className="mt-8">
          <a href="#projects" className="inline-block bg-cyan-600 text-slate-900 px-4 py-2 rounded-md shadow">View My Work</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;