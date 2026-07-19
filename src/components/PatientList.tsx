import React, { useState } from 'react';
import { Search, UserPlus, Filter, X, Plus, ShieldCheck, Heart, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Patient, Role } from '../types';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (id: string) => void;
  onAddPatient: (patientData: Partial<Patient>) => Promise<void>;
  userRole: Role;
  userName: string;
}

export default function PatientList({
  patients,
  onSelectPatient,
  onAddPatient,
  userRole,
  userName,
}: PatientListProps) {
  const [search, setSearch] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // All, ER, Gen Ward
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Patient Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    bloodGroup: 'O+',
    allergies: '',
    medicines: '',
    medicalHistory: '',
    treatments: '',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
    isEmergencyCase: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const bloodGroups = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);

    const matchesBlood = selectedBlood === 'All' || p.bloodGroup === selectedBlood;

    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'ER' && p.isEmergencyCase) ||
      (selectedStatus === 'Gen' && !p.isEmergencyCase);

    return matchesSearch && matchesBlood && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Patient name is required';
    if (!formData.age || isNaN(Number(formData.age))) errors.age = 'Provide a valid age';
    if (!formData.phone.trim()) errors.phone = 'Contact number is required';
    if (!formData.emergencyName.trim()) errors.emergencyName = 'Emergency contact name required';
    if (!formData.emergencyPhone.trim()) errors.emergencyPhone = 'Emergency contact phone required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const patientPayload: Partial<Patient> = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies ? formData.allergies.split(',').map((x) => x.trim()) : [],
        medicines: formData.medicines ? formData.medicines.split(',').map((x) => x.trim()) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((x) => x.trim()) : [],
        treatments: formData.treatments ? formData.treatments.split(',').map((x) => x.trim()) : [],
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
        isEmergencyCase: formData.isEmergencyCase,
        lastUpdatedBy: userName,
      };

      await onAddPatient(patientPayload);
      setIsAdding(false);
      // reset form
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        phone: '',
        bloodGroup: 'O+',
        allergies: '',
        medicines: '',
        medicalHistory: '',
        treatments: '',
        emergencyName: '',
        emergencyRelation: 'Spouse',
        emergencyPhone: '',
        isEmergencyCase: false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="patient-list-view" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 overflow-hidden relative">
      
      {/* View Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Heart className="w-5 h-5 text-[#0046AF] dark:text-blue-400" />
            <span>Patient Directories</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Database Sync Active • HIPAA Protected
          </p>
        </div>
        <button
          id="toggle-add-patient-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-[#0046AF] hover:bg-[#003180] text-white font-bold text-[11px] rounded-xl transition flex items-center space-x-1.5 shadow-sm"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? 'Cancel' : 'New Intake'}</span>
        </button>
      </div>

      {isAdding ? (
        /* REGISTER NEW INTAKE OVERLAY FORM */
        <form
          id="new-patient-form"
          onSubmit={handleFormSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900 z-10"
        >
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserPlus className="w-4 h-4 text-[#0046AF]" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">
              EHR Clinical Admission Intake
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Patient Full Name *
              </label>
              <input
                id="form-patient-name"
                type="text"
                name="name"
                placeholder="e.g. Martha Steward"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              {formErrors.name && <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{formErrors.name}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Age (Years) *
              </label>
              <input
                id="form-patient-age"
                type="number"
                name="age"
                placeholder="e.g. 35"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              {formErrors.age && <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{formErrors.age}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Gender *
              </label>
              <select
                id="form-patient-gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Contact Phone *
              </label>
              <input
                id="form-patient-phone"
                type="text"
                name="phone"
                placeholder="e.g. +1 (555) 019-2831"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              {formErrors.phone && <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Blood Group *
              </label>
              <select
                id="form-patient-blood-group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {bloodGroups.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                id="form-patient-is-emergency"
                type="checkbox"
                name="isEmergencyCase"
                checked={formData.isEmergencyCase}
                onChange={handleInputChange}
                className="w-4 h-4 text-rose-600 bg-slate-50 border-slate-300 rounded focus:ring-rose-500"
              />
              <label className="text-xs font-bold text-rose-600 cursor-pointer select-none">
                Emergency Case (ER)
              </label>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Allergies (comma-separated)
            </label>
            <input
              id="form-patient-allergies"
              type="text"
              name="allergies"
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              value={formData.allergies}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Prescribed Medicines (comma-separated)
            </label>
            <input
              id="form-patient-medicines"
              type="text"
              name="medicines"
              placeholder="e.g. Lisinopril 10mg QD, Metformin 500mg BID"
              value={formData.medicines}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Medical Chronic History (comma-separated)
            </label>
            <input
              id="form-patient-history"
              type="text"
              name="medicalHistory"
              placeholder="e.g. Hypertension, Type-2 Diabetes"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Previous Surgical / Clinical Treatments (comma-separated)
            </label>
            <input
              id="form-patient-treatments"
              type="text"
              name="treatments"
              placeholder="e.g. Appendectomy CABG (2022)"
              value={formData.treatments}
              onChange={handleInputChange}
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800/40">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              Emergency Contact Person
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  id="form-emergency-name"
                  type="text"
                  name="emergencyName"
                  placeholder="Contact Full Name"
                  value={formData.emergencyName}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                {formErrors.emergencyName && <p className="text-[8px] text-rose-500 font-semibold mt-0.5">{formErrors.emergencyName}</p>}
              </div>
              <div>
                <input
                  id="form-emergency-phone"
                  type="text"
                  name="emergencyPhone"
                  placeholder="Contact Phone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                {formErrors.emergencyPhone && <p className="text-[8px] text-rose-500 font-semibold mt-0.5">{formErrors.emergencyPhone}</p>}
              </div>
              <div className="col-span-2">
                <select
                  id="form-emergency-relation"
                  name="emergencyRelation"
                  value={formData.emergencyRelation}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="submit-new-patient-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#0046AF] hover:bg-[#003180] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow shadow-blue-300 dark:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Secured Node...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Register Secured Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* PATIENT DIRECTORY BROWSER */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters & Search sub-bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 space-y-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="patient-list-search-input"
                type="text"
                placeholder="Search by Name, ID, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  id="clear-search-patient-btn"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grid selectors */}
            <div className="flex items-center justify-between space-x-2 pt-1">
              {/* Blood Group scroll tags */}
              <div className="flex-1 overflow-x-auto scrollbar-none flex items-center space-x-1.5 py-0.5">
                {bloodGroups.map((b) => (
                  <button
                    id={`filter-blood-${b}`}
                    key={b}
                    onClick={() => setSelectedBlood(b)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold shrink-0 transition ${
                      selectedBlood === b
                        ? 'bg-[#0046AF] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* ER Status dropdown */}
              <select
                id="filter-ward-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg outline-none"
              >
                <option value="All">All Wards</option>
                <option value="ER">Emergency (ER)</option>
                <option value="Gen">General Ward</option>
              </select>
            </div>
          </div>

          {/* Directory Row Listing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <div
                  id={`patient-directory-card-${p.id}`}
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className="p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm relative overflow-hidden"
                >
                  {p.isEmergencyCase && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500"></div>
                  )}
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      p.isEmergencyCase
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-[#0046AF]/10 text-[#0046AF] dark:bg-blue-950/40 dark:text-blue-400'
                    }`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center">
                        {p.name}
                        {p.isEmergencyCase && (
                          <span className="ml-1.5 px-1 py-0.5 bg-rose-500 text-[7px] font-mono rounded font-bold text-white uppercase tracking-wider animate-pulse">
                            CRITICAL
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                        ID: {p.id} • {p.gender} ({p.age}y)
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        {p.phone}
                      </p>
                    </div>
                  </div>
                  
                  {/* Blood Group Tag */}
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-black bg-[#0046AF]/10 dark:bg-blue-950/60 text-[#0046AF] dark:text-blue-400 px-2 py-0.5 rounded-lg border border-[#0046AF]/10 dark:border-blue-900/30">
                      {p.bloodGroup}
                    </span>
                    <span className="text-[8px] text-slate-400 block mt-1.5 font-mono">
                      View Chart &rarr;
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching patients registered in this node.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
