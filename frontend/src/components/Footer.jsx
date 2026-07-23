import React from 'react';
import { Globe, MessageCircle, Share2, Mail, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 pt-16 pb-8 text-slate-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-slate-800 pb-12">
          
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-black text-sm">FL</span>
              </div>
              Surveillance
            </h3>
            <p className="text-slate-400 max-w-md leading-relaxed mb-6">
              A Final Year Engineering Project exploring the intersection of AI, privacy, and public health. Building a safer, data-driven tomorrow.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors">
                <Share2 size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Project Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Dashboard Preview</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Architecture Diagram</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Research Paper</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">GitHub Repository</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-6">Contact Team</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-slate-500" />
                <a href="mailto:team@example.com" className="hover:text-white transition-colors">team@example.com</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span>System Status: Online</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Final Year Project. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={14} className="text-rose-500" /> for Healthcare Innovation
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
