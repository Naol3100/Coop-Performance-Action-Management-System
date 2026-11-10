import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode for low-light office environment'}
      className={`group relative flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 shadow-sm text-xs select-none ${
        isDark
          ? 'bg-slate-800/90 border-slate-750 text-amber-300 hover:bg-slate-800 hover:border-amber-500/40'
          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750 hover:border-slate-600'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode (Optimized for low-light office environments)'}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
          <span className="text-[11px] font-semibold text-amber-200">Light</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-300 transition-transform duration-300 group-hover:-rotate-12" />
          <span className="text-[11px] font-medium text-slate-300">Dark</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        </>
      )}
    </button>
  );
};

