import React from 'react';
import Hero from '../components/Hero';
import Highlights from '../components/Highlights';
import Modules from '../components/Modules';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <main className="flex-grow">
        <Hero />
        <Highlights />
        <Modules />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
