import React, { useState } from 'react';
import { Search, UserPlus, ShieldAlert, Camera, FileText, ChevronRight, Activity, Users, Bell, AlertTriangle } from 'lucide-react';
import { Patient, EmergencyNotification, User as StaffUser } from '../types';

interface DashboardProps {
  user: StaffUser;
  patients: Patient[];
  notifications: EmergencyNotification[];
  onNavigate: (page: string, targetId?: string) => void;
  onReadNotification: (notifId: string) => void;
}

export default function Dashboard({
  user,
  patients,
  notifications,
  onNavigate,
  onReadNotification
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Derived counts
  const totalPatients = patients.length;
  const emergencyCasesCount = patients.filter((p) => p.isEmergencyCase).length;
  const criticalLabsCount = patients.reduce(
    (acc, p) => acc + p.labReports.filter((r) => r.status === 'Critical').length,
    0
  );

  // Filtered list for search results inside dashboard
  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery)
      )
    : [];

  const unreadNotifications = notifications.filter(
    (n) => !n.readBy.includes(user.staffId)
  );
  const latestEmergency = notifications.find((n) => n.severity === "emergency");

  return (
    <div id="dashboard-view" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 overflow-y-auto">
      
      {/* Clinician Header Card */}
      <div className="bg-gradient-to-r from-[#0046AF] to-[#003180] text-white p-5 rounded-b-[2.5rem] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatarUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d"}
              alt={user.name}
              className="w-11 h-11 rounded-2xl border-2 border-white/20 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-200 tracking-widest font-mono">
                {user.department}
              </p>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center">
                {user.name}
                <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-[8px] font-mono rounded font-bold uppercase tracking-wide">
                  {user.role}
                </span>
              </h3>
            </div>
          </div>
          
          {/* Notification Alert Bell icon */}
          <button
            id="nav-profile-settings-bell"
            onClick={() => onNavigate('settings')}
            className="p-2 bg-white/10 hover:bg-white/15 rounded-xl transition relative border border-white/10"
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-blue-700 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Shift Details and Status */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10 text-xs text-blue-100 font-mono">
          <span>{user.shift}</span>
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            {user.status}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 space-y-4">
        
        {/* Urgent Emergency Alert Ribbon */}
        {latestEmergency && (
          <div
            id="emergency-alert-banner"
            onClick={() => {
              if (latestEmergency.patientId) {
                onNavigate('patient-details', latestEmergency.patientId);
              } else {
                onNavigate('emergency');
              }
              onReadNotification(latestEmergency.id);
            }}
            className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-2xl p-3 flex items-start space-x-2.5 cursor-pointer hover:bg-rose-100/50 transition-all duration-200 shadow-sm animate-bounce"
          >
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-md shrink-0">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase font-bold text-rose-600 dark:text-rose-400">
                  URGENT BROADCAST
                </span>
                <span className="text-[8px] text-rose-400 font-mono">
                  {new Date(latestEmergency.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold line-clamp-2 mt-0.5">
                {latestEmergency.message}
              </p>
              <span className="text-[9px] text-rose-500 font-bold mt-1 inline-block hover:underline">
                Tap to open chart &rarr;
              </span>
            </div>
          </div>
        )}

        {/* Search Patient Box */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="dashboard-search-patient-input"
              type="text"
              placeholder="Search patients by Name, ID, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0046AF] focus:border-[#0046AF] transition shadow-sm"
            />
          </div>

          {/* Search Result Overlay panel */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-400 font-mono">
                Matching patients ({filteredPatients.length})
              </div>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <button
                    id={`search-result-row-${p.id}`}
                    key={p.id}
                    onClick={() => {
                      onNavigate('patient-details', p.id);
                      setSearchQuery('');
                    }}
                    className="w-full p-2.5 text-left hover:bg-[#0046AF]/5 dark:hover:bg-blue-950/20 flex items-center justify-between transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {p.id} • {p.gender} ({p.age}y)
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold bg-[#0046AF]/10 dark:bg-blue-950 text-[#0046AF] dark:text-blue-400 px-1.5 py-0.5 rounded">
                        {p.bloodGroup}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No medical record matches "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Action Shortcuts Panel */}
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-2 px-1 font-mono">
            Clinical Fast Track
          </span>
          <div className="grid grid-cols-4 gap-2">
            
            {/* Quick action: Add Patient */}
            <button
              id="shortcut-add-patient"
              onClick={() => onNavigate('patient-list')}
              className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="p-2 bg-[#0046AF]/5 dark:bg-blue-950/40 text-[#0046AF] dark:text-blue-400 rounded-xl mb-1.5 shadow-sm">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                Register Patient
              </span>
            </button>

            {/* Quick action: Emergency dispatch */}
            <button
              id="shortcut-emergency-hub"
              onClick={() => onNavigate('emergency')}
              className="p-2.5 bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="p-2 bg-rose-500 text-white rounded-xl mb-1.5 shadow-md animate-pulse">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 leading-tight">
                Emergency Hub
              </span>
            </button>

            {/* Quick action: AI Camera OCR Scanner */}
            <button
              id="shortcut-ocr-scanner"
              onClick={() => onNavigate('scanner')}
              className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl mb-1.5 shadow-sm">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                AI Scanner
              </span>
            </button>

            {/* Quick action: Clinician audit logs */}
            <button
              id="shortcut-audit-logs"
              onClick={() => onNavigate('settings')}
              className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl mb-1.5 shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                Audit Logs
              </span>
            </button>

          </div>
        </div>

        {/* Bento Grid Analytics Card */}
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-2 px-1 font-mono">
            Ward Statistics (Live)
          </span>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Stat: Total Patients */}
            <div
              id="metric-total-patients"
              onClick={() => onNavigate('patient-list')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                  ACTIVE PATIENTS
                </span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans mt-0.5 block">
                  {totalPatients}
                </span>
              </div>
              <div className="p-2 bg-[#0046AF]/5 dark:bg-blue-950 text-[#0046AF] dark:text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Stat: Active Emergencies */}
            <div
              id="metric-emergencies"
              onClick={() => onNavigate('emergency')}
              className={`border p-3.5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-between ${
                emergencyCasesCount > 0
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900'
                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                  EMERGENCIES
                </span>
                <span className={`text-2xl font-black font-sans mt-0.5 block ${
                  emergencyCasesCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {emergencyCasesCount}
                </span>
              </div>
              <div className={`p-2 rounded-xl ${
                emergencyCasesCount > 0 ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Stat: Critical Labs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm col-span-2 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Critical Labs Status
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {criticalLabsCount > 0
                      ? `${criticalLabsCount} patient reports require senior clinician sign-off`
                      : 'All diagnostic lab ranges fully normal'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                criticalLabsCount > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse' : 'bg-slate-100 text-slate-500'
              }`}>
                {criticalLabsCount > 0 ? 'Urgent' : 'Clear'}
              </span>
            </div>

          </div>
        </div>

        {/* Recent Admissions Slider */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-mono">
              Recent Admissions
            </span>
            <button
              id="view-all-patients-dashboard-btn"
              onClick={() => onNavigate('patient-list')}
              className="text-[10px] font-bold text-[#0046AF] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {patients.slice(0, 3).map((p) => (
              <div
                id={`recent-admission-${p.id}`}
                key={p.id}
                onClick={() => onNavigate('patient-details', p.id)}
                className="p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                   <div className="w-8 h-8 rounded-full bg-[#0046AF]/10 dark:bg-blue-950 text-[#0046AF] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                      {p.id} • {p.gender} ({p.age}y)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    p.isEmergencyCase
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {p.isEmergencyCase ? 'ER' : 'Gen Ward'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
