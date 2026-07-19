import React, { useState, useEffect } from 'react';
import { ArrowLeft, Stethoscope, AlertOctagon, Heart, Pill, Calendar, Activity, ShieldAlert, Loader2, Edit2, Trash2, Printer } from 'lucide-react';
import { Patient, Role, LabReport } from '../types';

interface PatientDetailsProps {
  patient: Patient;
  onBack: () => void;
  onUpdatePatient: (id: string, updatedData: Partial<Patient> & { editNote?: string }) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  userRole: Role;
  userName: string;
  userStaffId: string;
}

export default function PatientDetails({
  patient,
  onBack,
  onUpdatePatient,
  onDeletePatient,
  userRole,
  userName,
  userStaffId,
}: PatientDetailsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'labs' | 'medicines' | 'audit'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // AI Emergency Summary States
  const [summary, setSummary] = useState<any | null>(patient.emergencySummary || null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (summary) return; // Use existing cached summary if available to keep it fast
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const res = await fetch(`/api/patients/${patient.id}/emergency-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: false })
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
          // Save back to disk to persist so offline reads can load it directly
          await onUpdatePatient(patient.id, {
            emergencySummary: data,
            editNote: "AI CLINICAL SUMMARIZER: Instantiated secure emergency summary card"
          });
        } else {
          setSummaryError("Could not compile real-time AI summary.");
        }
      } catch (err) {
        console.error(err);
        setSummaryError("Clinical summary database offline. Viewing local offline state if cached.");
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [patient.id]);

  const handleRegenerateSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/patients/${patient.id}/emergency-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        await onUpdatePatient(patient.id, {
          emergencySummary: data,
          editNote: "AI CLINICAL SUMMARIZER: Force-refreshed medical emergency parameters"
        });
      } else {
        alert("Failed to compile AI summary from server.");
      }
    } catch (err) {
      console.error(err);
      alert("Network exception refreshing AI summarizer.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Quick Prescribe State
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Form Edit State
  const [editForm, setEditForm] = useState({
    name: patient.name,
    age: patient.age.toString(),
    phone: patient.phone,
    bloodGroup: patient.bloodGroup,
    isEmergencyCase: !!patient.isEmergencyCase,
  });

  const handleQuickAddMed = async () => {
    if (!newMed.trim()) return;
    setSubmitting(true);
    try {
      const updatedMeds = [...patient.medicines, newMed.trim()];
      await onUpdatePatient(patient.id, {
        medicines: updatedMeds,
        editNote: `Added prescription: ${newMed.trim()}`,
      });
      setNewMed('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    setSubmitting(true);
    try {
      const updatedAllergies = [...patient.allergies, newAllergy.trim()];
      await onUpdatePatient(patient.id, {
        allergies: updatedAllergies,
        editNote: `Updated allergies: Added ${newAllergy.trim()}`,
      });
      setNewAllergy('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBaseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdatePatient(patient.id, {
        name: editForm.name,
        age: parseInt(editForm.age),
        phone: editForm.phone,
        bloodGroup: editForm.bloodGroup,
        isEmergencyCase: editForm.isEmergencyCase,
        editNote: "Modified core patient demographics",
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (confirm(`CRITICAL: Are you sure you want to permanently delete the clinical EHR record of ${patient.name}? This action is irreversible.`)) {
      setSubmitting(true);
      try {
        await onDeletePatient(patient.id);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Generate some realistic medical vitals for the chart
  const vitals = {
    systolic: 128,
    diastolic: 84,
    bpm: 76,
    temp: "98.6 °F",
    spo2: "98%"
  };

  return (
    <div id="patient-details-view" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 overflow-hidden">
      
      {/* Top Header navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <button
          id="patient-details-back-btn"
          onClick={onBack}
          className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold">Directories</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Quick print simulate */}
          <button
            id="print-chart-btn"
            onClick={() => alert(`Printing Patient EHR Chart for ${patient.name}...\nDownloaded as PDF summary.`)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Download PDF EHR Chart"
          >
            <Printer className="w-4 h-4" />
          </button>
          
          {userRole === "ADMIN" && (
            <button
              id="delete-patient-record-btn"
              onClick={handleDeleteRecord}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 transition"
              title="Delete Patient Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            id="edit-patient-demographics-btn"
            onClick={() => {
              setEditForm({
                name: patient.name,
                age: patient.age.toString(),
                phone: patient.phone,
                bloodGroup: patient.bloodGroup,
                isEmergencyCase: !!patient.isEmergencyCase,
              });
              setIsEditing(!isEditing);
            }}
            className="p-2 rounded-xl bg-[#0046AF]/5 hover:bg-[#0046AF]/10 dark:bg-blue-950/20 text-[#0046AF] transition"
            title="Edit Demographics"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        /* EDITING DEMOGRAPHICS SCREEN */
        <form
          id="edit-patient-demographics-form"
          onSubmit={handleUpdateBaseDetails}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900"
        >
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Edit2 className="w-4 h-4 text-[#0046AF]" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">
              Update Patient Demographics
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                id="edit-form-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Age (Years)
              </label>
              <input
                id="edit-form-age"
                type="number"
                value={editForm.age}
                onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Contact Phone
              </label>
              <input
                id="edit-form-phone"
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Blood Group
              </label>
              <select
                id="edit-form-blood"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="edit-form-is-emergency"
                type="checkbox"
                checked={editForm.isEmergencyCase}
                onChange={(e) => setEditForm({ ...editForm, isEmergencyCase: e.target.checked })}
                className="w-4 h-4 text-rose-600 bg-slate-50 border-slate-300 rounded focus:ring-rose-500"
              />
              <label className="text-xs font-bold text-rose-600 cursor-pointer select-none">
                Emergency Case (ER Ward Status)
              </label>
            </div>
          </div>

          <div className="pt-4 flex space-x-2">
            <button
              id="edit-cancel-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              id="edit-save-btn"
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#0046AF] text-white font-bold text-xs rounded-xl hover:bg-[#003180] transition flex items-center justify-center space-x-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        /* PATIENT EHR DASHBOARD TABBED SCREEN */
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Patient Quick Demographic banner */}
          <div className="bg-white dark:bg-slate-900 px-5 py-4 shrink-0 border-b border-slate-100 dark:border-slate-800/60 relative overflow-hidden">
            {patient.isEmergencyCase && (
              <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[9px] uppercase px-3 py-1 tracking-wider rounded-bl-xl animate-pulse">
                Emergency Critical Care
              </div>
            )}

            <div className="flex items-center space-x-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm ${
                patient.isEmergencyCase ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-[#0046AF] to-[#003180]'
              }`}>
                {patient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {patient.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-slate-600 dark:text-slate-300 font-bold">{patient.id}</span> • {patient.gender} • {patient.age}y
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Tel: {patient.phone}
                </p>
              </div>
            </div>

            {/* Micro Vitals Banner Grid */}
            <div className="grid grid-cols-5 gap-1.5 mt-3.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/40">
              <div>
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Blood</span>
                <span className="text-[10px] font-black text-[#0046AF] dark:text-blue-400 font-mono block">{patient.bloodGroup}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Heart</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono block">{vitals.bpm} bpm</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">BP</span>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono block">{vitals.systolic}/{vitals.diastolic}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">SPO2</span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono block">{vitals.spo2}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800">
                <span className="text-[8px] text-slate-400 font-bold block uppercase">Temp</span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono block">{vitals.temp}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation selectors */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-around shrink-0 text-center font-bold text-[10px] uppercase font-mono tracking-wider">
            {(['profile', 'labs', 'medicines', 'audit'] as const).map((tab) => (
              <button
                id={`patient-tab-selector-${tab}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 border-b-2 transition ${
                  activeTab === tab
                    ? 'border-[#0046AF] text-[#0046AF] dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'profile' && 'Chart History'}
                {tab === 'labs' && 'Diagnostics'}
                {tab === 'medicines' && 'Medicines'}
                {tab === 'audit' && 'Security Audit'}
              </button>
            ))}
          </div>

          {/* Active Tab Screen Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* TAB: Core clinical history and allergies */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                
                {/* AI EMERGENCY SUMMARY CARD (MANDATE) */}
                <div id="ai-emergency-summary-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-red-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase font-mono">
                        AI Emergency Summary
                      </span>
                    </div>
                    <button
                      id="regenerate-ai-summary-btn"
                      onClick={handleRegenerateSummary}
                      disabled={loadingSummary}
                      className="text-[9px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center space-x-1 font-mono uppercase bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md border border-blue-200/20"
                    >
                      {loadingSummary ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Activity className="w-2.5 h-2.5" />
                      )}
                      <span>REFRESH AI</span>
                    </button>
                  </div>

                  {loadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-slate-400">Gemini reading chart records...</span>
                    </div>
                  ) : summaryError ? (
                    <div className="text-center py-4 space-y-1">
                      <p className="text-[10px] text-amber-500 font-bold font-mono uppercase">{summaryError}</p>
                      <button
                        onClick={handleRegenerateSummary}
                        className="text-[9px] font-bold text-[#0046AF] hover:underline"
                      >
                        Retry live summary generation
                      </button>
                    </div>
                  ) : summary ? (
                    <div className="space-y-3 text-xs leading-relaxed">
                      
                      {/* Risk Alert Alerting Banner */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        summary.emergencyRiskLevel === 'High'
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-300'
                          : summary.emergencyRiskLevel === 'Medium'
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300'
                      }`}>
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            summary.emergencyRiskLevel === 'High' ? 'bg-rose-600 animate-ping' : summary.emergencyRiskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
                          <span className="text-[10px] font-black uppercase font-mono">RISK LEVEL: {summary.emergencyRiskLevel}</span>
                        </div>
                        <span className="text-[8px] font-extrabold uppercase opacity-85 font-mono">ENCRYPTED EHR</span>
                      </div>

                      {/* Clinical Notes */}
                      <p className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-[11px] border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                        "{summary.emergencyNotes}"
                      </p>

                      {/* Summary Parameters Matrix */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Blood Group</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{summary.bloodGroup || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Known Allergies</span>
                          <span className="font-extrabold text-rose-600 dark:text-rose-400">
                            {summary.allergies && summary.allergies.length > 0 ? summary.allergies.join(', ') : 'None Reported'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Chronic Illnesses</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            {summary.chronicDiseases && summary.chronicDiseases.length > 0 ? summary.chronicDiseases.join(', ') : 'None recorded'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Active Medications</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            {summary.currentMedications && summary.currentMedications.length > 0 ? summary.currentMedications.join(', ') : 'None prescribed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Previous Surgeries</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {summary.previousSurgeries && summary.previousSurgeries.length > 0 ? summary.previousSurgeries.join(', ') : 'No history'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Last Visit admission</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {summary.lastHospitalVisit || 'No recorded visits'}
                          </span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <button
                        onClick={handleRegenerateSummary}
                        className="text-xs font-bold text-[#0046AF] hover:underline animate-pulse"
                      >
                        Compile Secure AI Emergency Summary
                      </button>
                    </div>
                  )}
                </div>

                {/* Allergies Warning card */}
                <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 p-3.5 rounded-2xl">
                  <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 mb-2">
                    <AlertOctagon className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                      Severe Drug / Food Allergies
                    </span>
                  </div>
                  
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a, i) => (
                        <span key={i} className="text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/20">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      No known active clinical drug allergies reported (NKDA).
                    </p>
                  )}

                  {/* Add Allergy tool */}
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      id="quick-add-allergy-input"
                      type="text"
                      placeholder="Add critical allergy..."
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      id="quick-add-allergy-btn"
                      onClick={handleQuickAddAllergy}
                      disabled={submitting}
                      className="px-2.5 py-1.5 bg-rose-600 text-white font-bold text-[9px] rounded-lg hover:bg-rose-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Chronic medical history */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <Stethoscope className="w-4 h-4 text-[#0046AF]" />
                    <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                      Active Medical Diagnoses
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {patient.medicalHistory.map((h, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#0046AF] rounded-full mr-2"></span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Previous surgical treatments */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                      Surgeries & Historical Procedures
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {patient.treatments.map((t, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Emergency Contact */}
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1.5">
                    Authorized Emergency Representative
                  </span>
                  <div className="text-xs">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200">
                      {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                      Phone: {patient.emergencyContact.phone}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Lab Diagnostics & Vitals Trends */}
            {activeTab === 'labs' && (
              <div className="space-y-4">
                
                {/* Visual blood pressure trend widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400 block mb-3">
                    Blood Pressure / Heart Rate Trend (12 Hours)
                  </span>
                  
                  {/* Custom graphical trend bar representation */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1 font-mono">
                        <span className="text-slate-600">Systolic (Normal: &lt; 120 mmHg)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{vitals.systolic} mmHg</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1 font-mono">
                        <span className="text-slate-600">Diastolic (Normal: &lt; 80 mmHg)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{vitals.diastolic} mmHg</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1 font-mono">
                        <span className="text-slate-600">Pulse (Resting Normal: 60 - 100 BPM)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{vitals.bpm} BPM</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Diagnostics reports list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400 block px-1">
                    Lab Panels & Findings ({patient.labReports.length})
                  </span>
                  
                  {patient.labReports.length > 0 ? (
                    patient.labReports.map((report) => (
                      <div
                        id={`lab-report-card-${report.id}`}
                        key={report.id}
                        className="p-3 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {report.testName}
                          </h4>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            report.status === 'Critical'
                              ? 'bg-rose-500 text-white animate-pulse'
                              : report.status === 'Abnormal'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800/20 leading-relaxed">
                          {report.result}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400 font-mono">
                          <span>ID: {report.id}</span>
                          <span>Panel Date: {report.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      No lab diagnostic reports issued on this patient file.
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* TAB: Prescribed daily medicines */}
            {activeTab === 'medicines' && (
              <div className="space-y-4">
                
                {/* Action panel: Add new prescription */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 mb-2.5">
                    <Pill className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                      Issue New Prescription
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      id="quick-prescribe-med-input"
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg BID x7d"
                      value={newMed}
                      onChange={(e) => setNewMed(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      id="quick-prescribe-med-btn"
                      onClick={handleQuickAddMed}
                      disabled={submitting || !newMed.trim()}
                      className="px-3.5 py-2.5 bg-[#0046AF] text-white font-bold text-xs rounded-xl hover:bg-[#003180] transition"
                    >
                      Prescribe
                    </button>
                  </div>
                </div>

                {/* Medicines List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-400 block px-1">
                    Active Clinical Prescriptions ({patient.medicines.length})
                  </span>

                  {patient.medicines.length > 0 ? (
                    patient.medicines.map((med, idx) => (
                      <div
                        id={`medicine-row-${idx}`}
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {med}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded shrink-0">
                          SAFETY DISPENSED
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      No therapeutic medications currently prescribed.
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* TAB: SECURE AUDIT TRAIL LOGS */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 p-3.5 rounded-2xl text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold">HIPAA Secure Node Operations</h4>
                    <p className="text-[10px] leading-relaxed">
                      All EHR modifications, diagnostics reviews, and demographic changes on this node are encrypted and permanently recorded onto the central hospital audit server.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                      Last Modification
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#0046AF] bg-[#0046AF]/5 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                      Secured SSL
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-500">
                      Modified By: <span className="font-bold text-slate-800 dark:text-slate-100">{patient.lastUpdatedBy}</span>
                    </p>
                    <p className="text-slate-500 font-mono">
                      Timestamp: {new Date(patient.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
