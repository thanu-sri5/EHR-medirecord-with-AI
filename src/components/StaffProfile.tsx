import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Clock, FileText, Lock, LogOut, CheckCircle, Eye, RefreshCw, ServerCrash } from 'lucide-react';
import { User as StaffUser, AuditLog } from '../types';

interface StaffProfileProps {
  user: StaffUser;
  onLogout: () => void;
  sessionTimeout: number;
  setSessionTimeout: (val: number) => void;
}

export default function StaffProfile({
  user,
  onLogout,
  sessionTimeout,
  setSessionTimeout
}: StaffProfileProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="staff-settings-view" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 overflow-y-auto p-4 space-y-4">
      
      {/* Clinician Profile details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-bl-xl border-l border-b border-emerald-100 dark:border-emerald-900/10">
          AUTHORIZED NODE
        </div>

        <div className="flex items-center space-x-3.5">
          <img
            src={user.avatarUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d"}
            alt={user.name}
            className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {user.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Staff: <span className="font-bold text-slate-700 dark:text-slate-300">{user.staffId}</span> • {user.role}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Contact: {user.phone}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
            <span className="text-[8px] font-bold text-slate-400 block uppercase">Department</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{user.department}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
            <span className="text-[8px] font-bold text-slate-400 block uppercase">Shift Hours</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{user.shift.split('(')[0]}</span>
          </div>
        </div>
      </div>

      {/* Session Timeout security slider settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-[#0046AF]" />
          <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
            Session Security Locks
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-normal">
          Define automatic secure logoff intervals during terminal physical inactivity to safeguard hospital electronic data.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[1, 3, 5].map((mins) => (
            <button
              id={`timeout-setting-${mins}m`}
              key={mins}
              onClick={() => {
                setSessionTimeout(mins * 60);
                alert(`Dynamic Security: Session timeout auto-lock successfully set to ${mins} minutes.`);
              }}
              className={`py-2 rounded-xl text-[10px] font-bold transition border ${
                sessionTimeout === mins * 60
                  ? 'bg-[#0046AF]/5 dark:bg-blue-950/40 border-[#0046AF] text-[#0046AF] dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {mins} Minute{mins > 1 ? 's' : ''}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            id="immediate-logout-btn"
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Terminal Session</span>
          </button>
        </div>
      </div>

      {/* Central HIPAA Auditing timeline Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3 flex-1 flex flex-col overflow-hidden max-h-[380px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <FileText className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
              Secure HIPAA Audit Trails
            </span>
          </div>
          
          <button
            id="refresh-audit-logs-btn"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Audits Listing */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                id={`audit-log-row-${log.id}`}
                key={log.id}
                className="text-[10px] p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40 font-mono space-y-1"
              >
                <div className="flex justify-between text-slate-400 font-bold text-[8px]">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{log.id}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-normal">
                  <span className="font-extrabold text-[#0046AF] dark:text-blue-400">
                    {log.userName} ({log.userRole})
                  </span>{' '}
                  {log.action}
                  {log.patientName ? (
                    <>
                      {' '}for patient{' '}
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {log.patientName}
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="text-[7px] text-emerald-500 font-extrabold uppercase flex items-center">
                  <CheckCircle className="w-2 h-2 mr-1 text-emerald-500" />
                  SSL Encrypted & Approved
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-1">
              <ServerCrash className="w-6 h-6 text-slate-300" />
              <span>Empty ledger node</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
