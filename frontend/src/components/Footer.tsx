import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="" className="h-10 w-10" />
      <div>
        <p className="font-bold">PlayerPro</p>
        <p className="text-xs text-slate-400">Build your team. Own the season.</p>
      </div>
    </div>
    <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
      <Link to="/rules-and-scoring" className="hover:text-emerald-300">Rules</Link>
      <Link to="/players" className="hover:text-emerald-300">Players</Link>
      <Link to="/fixtures" className="hover:text-emerald-300">Fixtures</Link>
      <Link to="/help-center" className="hover:text-emerald-300">Help</Link>
    </nav>
    <p className="text-xs text-slate-500">© {new Date().getFullYear()} PlayerPro</p>
  </div>
);

export default Footer;
