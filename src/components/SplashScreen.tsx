import React from 'react';
import { Activity, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <div id="splash-screen" className="flex-1 flex flex-col bg-gradient-to-b from-[#0046AF] via-[#003180] to-[#0A122C] text-white p-6 relative justify-between overflow-hidden">
      
      {/* Absolute floating grid designs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Hospital Identity Tag */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-100">ST. JUDE CLINIC CLOUD</span>
        </div>
        <span className="text-[9px] font-mono text-slate-300">V3.5.4 (SECURE)</span>
      </div>

      {/* Main Core Identity: Heartbeat Animation */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-4">
        
        {/* Pulsing Outer Logo */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform duration-300">
            <Heart className="w-10 h-10 text-[#0046AF] animate-pulse fill-[#0046AF]/10" />
          </div>
          {/* Clinical Cross Accessory */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-base font-black shadow border border-white">
            +
          </div>
        </div>

        {/* Branding Typography */}
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">
          SmartCare<span className="text-emerald-400">EHR</span>
        </h1>
        <p className="text-blue-100 text-xs mt-2 max-w-xs font-light">
          Hospital Electronic Health Record system for real-time mobile clinical operations
        </p>

        {/* Animated Clinical Pulse Wave */}
        <div className="w-44 h-12 mt-6 relative flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full text-emerald-400 opacity-60" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M 0 15 L 20 15 L 25 15 L 30 5 L 35 25 L 40 12 L 42 15 L 50 15 L 55 15 L 60 15 L 65 15" className="animate-[dash_1.5s_linear_infinite]" />
            <style>{`
              @keyframes dash {
                0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; }
                50% { stroke-dasharray: 50 50; stroke-dashoffset: 0; }
                100% { stroke-dasharray: 0 100; stroke-dashoffset: -100; }
              }
            `}</style>
          </svg>
        </div>
      </div>

      {/* Dynamic Interaction: Trigger Operational Login */}
      <div className="flex flex-col space-y-4 z-10">
        <button
          id="enter-ehr-btn"
          onClick={onEnter}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-[#0046AF] font-bold text-sm rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2"
        >
          <span>Initiate Clinical Session</span>
          <Activity className="w-4 h-4 text-[#0046AF]" />
        </button>

        <div className="flex justify-center space-x-4 text-[10px] text-blue-200 font-mono">
          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>Encrypted Node</span>
          <span>•</span>
          <span>HIPAA Compliant</span>
        </div>
      </div>

    </div>
  );
}
