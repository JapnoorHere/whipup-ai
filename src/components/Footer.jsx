import React from 'react';
import { GiChefToque } from 'react-icons/gi';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-t from-black/80 via-gray-900/70 to-transparent text-white/70 py-12 mt-16 border-t border-white/10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center space-x-2 mb-3">
              <GiChefToque className="text-orange-500 text-3xl" />
              <h3 className="text-orange-500 text-2xl font-bold">WhipUp</h3>
            </div>
            <p className="text-sm">Smart recipes, instantly.</p>
            <p className="text-xs mt-1">AI-Powered Culinary Assistant</p>
          </div>
          <div className="text-center">
            <p className="text-sm mb-2">
              © {currentYear} WhipUp. All rights reserved.
            </p>
            <p className="text-xs italic">
              "The future of cooking, one smart recipe at a time."
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm mb-3 font-medium">Connect with Us</p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/JapnoorHere"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-white/70 hover:text-orange-400 transition-colors duration-300 transform hover:scale-110"
              >
                <FaGithub size={22} />
              </a>
              <a
                href="https://www.linkedin.com/in/japnoor-singh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-white/70 hover:text-orange-400 transition-colors duration-300 transform hover:scale-110"
              >
                <FaLinkedin size={22} />
              </a>
              <a
                href="https://twitter.com/japnoor_here"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-white/70 hover:text-orange-400 transition-colors duration-300 transform hover:scale-110"
              >
                <FaTwitter size={22} />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-10 pt-6 border-t border-white/10">
          <p className="text-xs">
            Built By Japnoor Singh
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
