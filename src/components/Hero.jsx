import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="pt-8">
      <div className="text-center">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-md"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          I Build Modern Web<br/>Solutions
        </motion.h1>
        <motion.p 
          className="mt-6 text-slate-300 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Passionate web developer creating beautiful and functional websites that solve real-world problems.
        </motion.p>
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a href="#projects" className="inline-block bg-cyan-600 text-slate-900 px-4 py-2 rounded-md shadow hover:bg-cyan-500 transition-colors">View My Work</a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;