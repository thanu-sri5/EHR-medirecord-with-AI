import React, { useState } from 'react';
import { ShieldCheck, Stethoscope, Users, User, ArrowLeft, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Role, User as StaffUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
  onGoBackToSplash: () => void;
}

// Pre-configured clinic accounts for HIPAA authorized personnel
const CLINICAL_STAFF: StaffUser[] = [
  {
    id: "STF-289",
    name: "Dr. Sarah Miller",
    role: "DOCTOR",
    staffId: "DOC-102",
    department: "Cardiology",
    phone: "+1 (555) 123-4567",
    status: "Active",
    shift: "Day Duty (07:00 - 15:00)",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "STF-902",
    name: "Dr. Alan Turing",
    role: "DOCTOR",
    staffId: "DOC-909",
    department: "Emergency Medicine",
    phone: "+1 (555) 987-6543",
    status: "On Call",
    shift: "Night Shift (23:00 - 07:00)",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "STF-501",
    name: "Nurse Clara Barton",
    role: "NURSE",
    staffId: "NUR-501",
    department: "Intensive Care Unit (ICU)",
    phone: "+1 (555) 456-7890",
    status: "Active",
    shift: "Day Duty (07:00 - 15:00)",
    avatarUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "STF-001",
    name: "Admin Bruce Wayne",
    role: "ADMIN",
    staffId: "ADM-001",
    department: "Hospital Administration",
    phone: "+1 (555) 999-0000",
    status: "Active",
    shift: "Office Hours (09:00 - 17:00)",
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200"
  }
];

export default function LoginScreen({ onLoginSuccess, onGoBackToSplash }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleQuickPrefill = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setSelectedRole(staff.role);
    setPin('1234'); // Auto pre-fill correct PIN for easy testing
    setErrorMsg('');
  };

  const handleKeypadPress = (num: string) => {
    setErrorMsg('');
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmitLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!selectedStaff) {
      setErrorMsg('Please select a clinical staff profile');
      return;
    }

    if (pin === '1234') {
      // Create session logs on server or locally
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStaff.staffId,
          userName: selectedStaff.name,
          userRole: selectedStaff.role,
          action: "LOGGED IN - Session started securely"
        })
      }).catch(err => console.error(err));

      onLoginSuccess(selectedStaff);
    } else {
      setErrorMsg('Access Denied: Invalid secure clinical PIN');
      setPin('');
    }
  };

  return (
    <div id="login-screen" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 p-5 overflow-y-auto">
      
      {/* Top Bar Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          id="back-splash-btn"
          onClick={onGoBackToSplash}
          className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Splash</span>
        </button>
        <div className="flex items-center space-x-1.5 text-[#0046AF] dark:text-blue-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider font-mono">SECURE ENTRY</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Clinical Authentication
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select authorized staff profile and enter secure EHR PIN
        </p>
      </div>

      {/* Staff Quick selection tabs */}
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-2 px-1">
          Authorized Hospital Personnel
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CLINICAL_STAFF.map((staff) => {
            const isSelected = selectedStaff?.id === staff.id;
            return (
              <button
                id={`staff-prefill-${staff.staffId}`}
                key={staff.id}
                onClick={() => handleQuickPrefill(staff)}
                className={`p-2.5 rounded-2xl border text-left flex items-start space-x-2 transition duration-200 ${
                  isSelected
                    ? 'border-[#0046AF] bg-[#0046AF]/5 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                }`}
              >
                <img
                  src={staff.avatarUrl}
                  alt={staff.name}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover mt-0.5"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {staff.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {staff.staffId} • {staff.role}
                  </p>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {staff.department}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PIN Entrance Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex-1 flex flex-col justify-between max-h-[460px]">
        <div>
          {/* Active staff selected tag */}
          {selectedStaff ? (
            <div className="flex items-center justify-between bg-[#0046AF]/5 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40 mb-3">
              <div className="flex items-center space-x-2">
                {selectedStaff.role === "DOCTOR" && <Stethoscope className="w-3.5 h-3.5 text-[#0046AF] dark:text-blue-400" />}
                {selectedStaff.role === "NURSE" && <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                {selectedStaff.role === "ADMIN" && <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Logging in as {selectedStaff.role.toLowerCase()}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                PIN: 1234
              </span>
            </div>
          ) : (
            <div className="text-center py-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1.5 bg-[#F4F7FA] dark:bg-slate-950 rounded-xl mb-3 border border-slate-100 dark:border-slate-800/30">
              <Lock className="w-3 h-3" />
              <span>Tap a staff profile above to begin</span>
            </div>
          )}

          {/* Masked PIN Display */}
          <div className="flex flex-col items-center">
            <div className="flex space-x-3 my-2">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      filled
                        ? 'bg-[#0046AF] border-[#0046AF] dark:bg-blue-400 dark:border-blue-400 scale-110'
                        : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  ></div>
                );
              })}
            </div>
            
            {/* Password view of PIN */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              <span className="tracking-widest">
                {showPassword ? pin || '••••' : '••••'}
              </span>
              {pin.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {errorMsg && (
              <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-2 font-semibold">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Secure key pad */}
        <div className="grid grid-cols-3 gap-2 px-4 py-2 mt-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              id={`pin-key-${num}`}
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="py-2.5 rounded-xl text-sm font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all duration-100 transform active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            id="pin-key-clear"
            type="button"
            onClick={handleClear}
            className="py-2.5 rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 uppercase transition-all"
          >
            Clear
          </button>
          <button
            id="pin-key-0"
            type="button"
            onClick={() => handleKeypadPress("0")}
            className="py-2.5 rounded-xl text-sm font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all transform active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            id="pin-key-backspace"
            type="button"
            onClick={handleBackspace}
            className="py-2.5 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 uppercase transition-all"
          >
            Delete
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-3">
          <button
            id="submit-login-btn"
            onClick={() => handleSubmitLogin()}
            disabled={pin.length !== 4 || !selectedStaff}
            className="w-full py-2.5 rounded-xl bg-[#0046AF] hover:bg-[#003180] text-white font-bold text-xs disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition flex items-center justify-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>AUTHORIZE & SIGN IN</span>
          </button>
        </div>
      </div>

      {/* Regulatory HIPAA Banner */}
      <div className="mt-3 text-center shrink-0">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed font-sans max-w-xs mx-auto">
          Authorized personnel only. Sessions are automatically audit-logged. Unauthorized access violates federal medical HIPAA laws.
        </p>
      </div>

    </div>
  );
}
