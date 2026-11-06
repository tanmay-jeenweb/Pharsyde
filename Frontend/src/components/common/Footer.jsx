import React from 'react';
import { Link } from 'react-router-dom';
import jwLogo from '../../assets/jwLogo.jpeg';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-14">
        <div className="py-3 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">

          <p>© {new Date().getFullYear()} PHARSYDE Inc. All rights reserved.</p>

          <a
            href="https://www.jeenweb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <span className="font-medium">Design by Jeenweb Technologists</span>
            <img
              src={jwLogo}
              alt="Jeenweb Technologists"
              className="h-7 w-auto object-contain rounded-xs transition-transform group-hover:scale-105"
            />
          </a>

          <Link
            to="/policy"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Policies &amp; Protection
          </Link>

          <span>Winnipeg, Manitoba, Canada</span>

        </div>
      </div>
    </footer>
  );
}
