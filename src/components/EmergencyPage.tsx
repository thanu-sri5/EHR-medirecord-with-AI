import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Users, Phone, ArrowLeft, Send, CheckCircle, BellRing, User, Loader2 } from 'lucide-react';
import { Patient, Role } from '../types';

interface EmergencyPageProps {
  patients: Patient[];
  onTriggerEmergency: (patientId: string, message: string) => Promise<void>;
  onNavigateToDetails: (id: string) => void;
  userRole: Role;
  userName: string;
}

export default function EmergencyPage({
  patients,
  onTriggerEmergency,
  onNavigateToDetails,
  userRole,
  userName,
}: EmergencyPageProps) {
  const [selectedId, setSelectedId] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Selected patient details
  const activePatient = patients.find((p) => p.id === selectedId);

  // Filter only emergency patients, but allow selecting any patient in case of acute crisis
  const emergencyPatientsList = patients;

  const handleDispatchEmergency = async () => {
    if (!selectedId) return;
    setSending(true);
    setSuccess(false);
    try {
      const message = customMsg.trim()
        ? `CRITICAL ALERT: ${customMsg.trim()} - Patient ${activePatient?.name} (${selectedId}). Blood: ${activePatient?.bloodGroup}`
        : `CRITICAL ALERT: Red button activated for ${activePatient?.name} (${selectedId}). Urgent clinical response needed in Ward 3. Blood: ${activePatient?.bloodGroup}, Allergies: ${activePatient?.allergies.join(', ') || 'None'}`;

      await onTriggerEmergency(selectedId, message);
      setSuccess(true);
      setCustomMsg('');
      
      // Auto reset success after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="emergency-hub-view" className="flex-1 flex flex-col bg-rose-50/40 dark:bg-rose-950/10 overflow-y-auto p-4 space-y-4">
      
      {/* Page Title Header */}
      <div className="flex items-center space-x-3 bg-rose-600 text-white p-4 rounded-2xl shadow-md border border-rose-500 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6"></div>
        <div className="p-2 bg-white text-rose-600 rounded-xl">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider font-mono">
            Emergency Dispatch Hub
          </h2>
          <p className="text-[10px] text-rose-100 mt-0.5 leading-snug">
            HIPAA Authoritative One-Tap Doctor Broadcast System
          </p>
        </div>
      </div>

      {/* Main Red Alert Core Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Identify Patient in Distress *
          </label>
          <select
            id="emergency-patient-selector"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSuccess(false);
            }}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
          >
            <option value="">-- Choose patient in acute status --</option>
            {emergencyPatientsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) • Blood {p.bloodGroup} {p.isEmergencyCase ? '• [CRITICAL ER]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Emergency Patient Stats Preview */}
        {activePatient ? (
          <div className="bg-rose-50/50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-2xl p-3.5 space-y-3">
            
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/20 pb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black text-rose-900 dark:text-rose-300">
                  {activePatient.name} ({activePatient.age}y / {activePatient.gender})
                </span>
              </div>
              <button
                id="emergency-view-chart-btn"
                onClick={() => onNavigateToDetails(activePatient.id)}
                className="text-[9px] font-black text-rose-600 dark:text-rose-400 hover:underline"
              >
                Open Full EHR &rarr;
              </button>
            </div>

            {/* Giant Critical Clinical Markers */}
            <div className="grid grid-cols-2 gap-2">
              
              <div className="bg-white dark:bg-slate-950 p-3 rounded-xl text-center border border-rose-100 dark:border-rose-900/20 flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Blood Group
                </span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-sans tracking-tight">
                  {activePatient.bloodGroup}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-xl text-center border border-rose-100 dark:border-rose-900/20 flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Allergy Risk
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 line-clamp-2 leading-tight">
                  {activePatient.allergies.join(', ') || 'NKDA (None)'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20 col-span-2 text-xs">
                <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">
                  Active Medications
                </span>
                <p className="text-slate-800 dark:text-slate-300 font-mono font-bold leading-relaxed line-clamp-2">
                  {activePatient.medicines.join(' • ') || 'No daily drugs prescribed'}
                </p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl col-span-2 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">
                    Emergency Contact ({activePatient.emergencyContact.relation})
                  </span>
                  <p className="text-slate-800 dark:text-slate-300 font-bold mt-0.5">
                    {activePatient.emergencyContact.name}
                  </p>
                </div>
                <a
                  id="emergency-call-contact-btn"
                  href={`tel:${activePatient.emergencyContact.phone}`}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow transition flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Simulating secure outbound clinical call to emergency contact: ${activePatient.emergencyContact.name} (${activePatient.emergencyContact.phone})`);
                  }}
                >
                  <Phone className="w-3.5 h-3.5 text-white" />
                </a>
              </div>

            </div>

            {/* Custom dispatch message */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Custom Dispatch Message (Optional)
              </label>
              <input
                id="emergency-custom-msg-input"
                type="text"
                placeholder="e.g. Cardiopulmonary arrest in Room 4B, need crash cart"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Red button Action trigger */}
            <div className="pt-2">
              <button
                id="emergency-red-btn"
                onClick={handleDispatchEmergency}
                disabled={sending}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 dark:shadow-none border-2 border-white/20 transition flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>BROADCASTING URGENT...</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4 animate-bounce text-white" />
                    <span>BROADCAST CLINICAL DISPATCH</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <AlertTriangle className="w-8 h-8 text-rose-500/60 animate-bounce" />
            <p className="max-w-xs font-semibold">
              Select a patient in distress from the dropdown to unlock the Emergency Red button.
            </p>
          </div>
        )}
      </div>

      {/* Success alert message log feedback */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-3.5 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2.5 shadow animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold">Broadcast Succeeded</h4>
            <p className="text-[10px] leading-relaxed">
              SMS Pagers dispatched, and physical room alerts successfully transmitted. Cardiology, ICU, and ER on-call clinicians notified.
            </p>
          </div>
        </div>
      )}

      {/* Ward Status Log feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-2">
          Hospital Emergency Network Log (Simulated)
        </span>
        <div className="space-y-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex justify-between items-start">
            <span className="text-emerald-500 font-bold">[ONLINE]</span>
            <span className="text-right">Pager transmitter node #ER-901</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400">[IDLE]</span>
            <span className="text-right">Central monitor sync active</span>
          </div>
        </div>
      </div>

    </div>
  );
}
