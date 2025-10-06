import { Mail, Globe, Heart, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary-50 via-white to-primary-50 border-t border-primary-200 py-2 px-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        {/* Designed by */}
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
          <span className="font-medium text-gray-700">
            Designed and developed by{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent font-semibold">
              Sai Kowshik Ananthula
            </span>
          </span>
        </div>

        <span className="text-gray-400">|</span>

        {/* Contact info */}
        <span className="font-medium text-gray-600">Contact:</span>

        <a
          href="mailto:askowshik@outlook.com"
          className="group flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-primary-200 hover:border-primary-400 hover:shadow-sm transition-all duration-200"
        >
          <Mail className="w-3 h-3 text-primary-600 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-700 group-hover:text-primary-700">
            Email
          </span>
        </a>

        <a
          href="https://www.linkedin.com/in/ask7/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200"
        >
          <Linkedin className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
          <span className="font-medium text-white">
            LinkedIn
          </span>
        </a>

        <a
          href="https://saikowshik007.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-sm hover:shadow transition-all duration-200"
        >
          <Globe className="w-3 h-3 text-white group-hover:rotate-12 transition-transform" />
          <span className="font-medium text-white">
            Portfolio
          </span>
        </a>

        <span className="text-gray-400">•</span>

        {/* Copyright */}
        <span className="text-gray-500">
          © {new Date().getFullYear()} HLD Designer
        </span>
      </div>
    </footer>
  );
};
