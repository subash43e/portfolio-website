import React from 'react';

const Contact = () => {
  return (
    <section id="contact" className="text-center py-12">
      <h3 className="text-white font-semibold text-lg">Get In Touch</h3>
      <p className="mt-4 text-slate-300 max-w-2xl mx-auto">I'm currently available for freelance work and open to new opportunities. Let's build something amazing together.</p>
      <div className="mt-6">
        <a href="mailto:subash432e@gmail.com" className="inline-block bg-cyan-600 text-slate-900 px-4 py-2 rounded-md shadow">Say Hello</a>
      </div>
    </section>
  );
};

export default Contact;