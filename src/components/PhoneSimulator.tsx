import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldAlert, Wifi, Battery, Signal, Sun, Moon, Clock } from 'lucide-react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  systemTime: string;
}

export default function PhoneSimulator({
  children,
  darkMode,
  setDarkMode,
  systemTime,
}: PhoneSimulatorProps) {
  const [batteryLevel, setBatteryLevel] = useState(98);

  useEffect(() => {
    // Slowly drain or charge battery for realism
    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        if (prev <= 15) return 98; // reset
        return prev - 1;
      });
    }, 60000 * 5); // every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="phone-container" className="min-h-screen bg-[#F4F7FA] dark:bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300">
      
      {/* Upper Desktop Controls - Hidden on Mobile */}
      <div id="desktop-control-panel" className="hidden md:flex items-center justify-between w-full max-w-sm mb-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-[#0046AF] dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">
            SmartCare Mobile EHR
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle Applet Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#0046AF]" />}
          </button>
        </div>
      </div>

      {/* Main Phone Frame Chassis */}
      <div
        id="phone-chassis"
        className="w-full md:w-[412px] h-screen md:h-[840px] bg-black md:rounded-[48px] md:shadow-2xl border-x-0 md:border-[12px] border-slate-900 flex flex-col overflow-hidden relative md:aspect-[9/19.5]"
      >
        {/* Notch - Hidden on mobile screen stretch */}
        <div id="phone-notch" className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-50">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-neutral-800 rounded-full"></div>
          <div className="absolute top-1 right-8 w-2 h-2 bg-neutral-900 rounded-full"></div>
        </div>

        {/* Dynamic Mobile Status Bar */}
        <div
          id="mobile-status-bar"
          className="h-10 px-6 pt-2 bg-white dark:bg-slate-900 flex items-center justify-between text-slate-800 dark:text-slate-200 text-xs font-medium tracking-tight select-none z-40 shrink-0 border-b border-slate-100 dark:border-slate-800/50"
        >
          {/* Status Bar Left: Updated clock */}
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#0046AF] dark:text-blue-400 animate-pulse" />
            <span className="font-mono text-xs">{systemTime}</span>
          </div>

          {/* Status Bar Right: Battery, Wifi, Signal indicators */}
          <div className="flex items-center space-x-2">
            <Signal className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              <Battery className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="text-[9px] font-mono font-bold">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Screen Viewport - Render EHR App content */}
        <div id="phone-screen" className="flex-1 overflow-hidden flex flex-col bg-[#F4F7FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
          {children}
        </div>

        {/* Home Indicator bar on Desktop */}
        <div id="home-indicator-bar" className="hidden md:flex h-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/30 items-center justify-center z-40 shrink-0">
          <div className="w-28 h-1 bg-slate-400 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>

      {/* Desktop Hints */}
      <div className="hidden md:block text-center mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
        Responsive Layout • Touch & Desktop Optimizations • Real-time OCR Simulated Camera Included
      </div>
    </div>
  );
}
