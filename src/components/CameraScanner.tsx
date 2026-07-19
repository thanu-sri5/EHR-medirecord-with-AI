import React, { useState, useRef, useEffect } from 'react';
import { Camera, FileText, Upload, RefreshCw, Sparkles, Check, Loader2, ShieldCheck, ClipboardCheck, QrCode, User, Heart, AlertTriangle, Phone, Calendar, Info, Edit3, ShieldAlert } from 'lucide-react';
import { Patient } from '../types';

interface CameraScannerProps {
  patients: Patient[];
  onAddPatient: (patientData: Partial<Patient>) => Promise<void>;
  onUpdatePatient: (id: string, updatedData: Partial<Patient> & { editNote?: string }) => Promise<void>;
  onNavigate: (page: string, targetId?: string) => void;
}

export default function CameraScanner({ patients, onAddPatient, onUpdatePatient, onNavigate }: CameraScannerProps) {
  const [activeTab, setActiveTab] = useState<'ocr' | 'qr'>('ocr');
  const [docType, setDocType] = useState<'Prescription' | 'LabReport' | 'DischargeSummary' | 'MedicalBill'>('Prescription');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedPatientOption, setSelectedPatientOption] = useState<string>('NEW');

  // Simulated QR Code Scan States
  const [scannedPatientId, setScannedPatientId] = useState<string>('');
  const [scannedSummary, setScannedSummary] = useState<any | null>(null);
  const [loadingQrData, setLoadingQrData] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera access denied or unavailable", err);
      setCameraError("Webcam denied or sandbox constraints active. Please upload a file or use our quick presets below!");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateQrScan = async (patientId: string) => {
    if (!patientId) {
      setScannedPatientId('');
      setScannedSummary(null);
      return;
    }
    setScannedPatientId(patientId);
    setLoadingQrData(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/emergency-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      if (res.ok) {
        const data = await res.json();
        setScannedSummary(data);
      } else {
        alert("Failed to retrieve emergency credentials.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQrData(false);
    }
  };

  // Pre-drawn clinical documents for rapid testing (Preset Base64 proxies)
  const handleSelectPreset = (presetType: 'Prescription' | 'LabReport' | 'DischargeSummary' | 'MedicalBill') => {
    setDocType(presetType);
    setParsedResult(null);
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250" viewBox="0 0 200 250"><rect width="100%" height="100%" fill="%23f1f5f9"/><rect x="20" y="20" width="160" height="15" fill="%233b82f6" rx="4"/><rect x="20" y="50" width="100" height="8" fill="%23cbd5e1" rx="2"/><rect x="20" y="70" width="140" height="8" fill="%2394a3b8" rx="2"/><rect x="20" y="90" width="140" height="8" fill="%2394a3b8" rx="2"/><rect x="20" y="110" width="80" height="8" fill="%23cbd5e1" rx="2"/><rect x="20" y="140" width="160" height="1" fill="%23e2e8f0"/><circle cx="40" cy="180" r="15" fill="%2310b981" fill-opacity="0.2"/><text x="70" y="185" font-family="monospace" font-size="10" font-weight="bold" fill="%23334155">ST. JUDE RECORD</text></svg>`;
    setImagePreview(placeholderSvg);
  };

  const handleAnalyzeOCR = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setParsedResult(null);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview,
          mimeType: 'image/jpeg',
          documentType: docType,
          prompt: `Document category: ${docType}`
        })
      });
      const data = await res.json();
      if (data.data) {
        setParsedResult(data.data);
      } else {
        alert("Parsing failed. Please check backend log errors.");
      }
    } catch (err) {
      console.error(err);
      alert("API error during OCR analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToEHR = async () => {
    if (!parsedResult) return;
    setAnalyzing(true);
    try {
      if (selectedPatientOption === 'NEW') {
        const newPatientPayload: Partial<Patient> = {
          name: parsedResult.name || "Parsed Patient File",
          age: parsedResult.age || 40,
          gender: parsedResult.gender || "Male",
          phone: parsedResult.phone || "+1 (555) 019-2811",
          bloodGroup: parsedResult.bloodGroup || "O+",
          allergies: parsedResult.allergies || [],
          medicines: parsedResult.medicines || [],
          medicalHistory: parsedResult.medicalHistory || [],
          treatments: parsedResult.treatments || [],
          labReports: parsedResult.labReports || [],
          emergencyContact: parsedResult.emergencyContact || {
            name: "Mary Spouse",
            relation: "Spouse",
            phone: "+1 (555) 019-2815"
          },
          isEmergencyCase: false
        };

        await onAddPatient(newPatientPayload);
        alert(`Success! Generated secure EHR profile for ${parsedResult.name} using Gemini Clinical OCR.`);
        onNavigate('patient-list');
      } else {
        const existing = patients.find(p => p.id === selectedPatientOption);
        if (!existing) return;

        // Perform clinical merge of parameters
        const uniqueAllergies = Array.from(new Set([...existing.allergies, ...(parsedResult.allergies || [])]));
        const uniqueMedicines = Array.from(new Set([...existing.medicines, ...(parsedResult.medicines || [])]));
        const uniqueDiagnoses = Array.from(new Set([...existing.medicalHistory, ...(parsedResult.medicalHistory || [])]));
        const uniqueTreatments = Array.from(new Set([...existing.treatments, ...(parsedResult.treatments || [])]));
        
        // Formulate and merge new lab report records
        const newLabReports = (parsedResult.labReports || []).map((lr: any, idx: number) => ({
          id: `LAB-${Math.floor(1000 + Math.random() * 9000)}-${idx}`,
          date: lr.date || new Date().toISOString().split('T')[0],
          testName: lr.testName || 'Clinical OCR Test Panel',
          result: lr.result || 'Extracted result values details',
          status: lr.status || 'Normal'
        }));
        const mergedLabReports = [...existing.labReports, ...newLabReports];

        await onUpdatePatient(existing.id, {
          allergies: uniqueAllergies,
          medicines: uniqueMedicines,
          medicalHistory: uniqueDiagnoses,
          treatments: uniqueTreatments,
          labReports: mergedLabReports,
          editNote: `AI SCANNER: Merged parsed ${docType} findings`
        });

        alert(`Success! Merged extracted OCR clinical findings directly into ${existing.name}'s active EHR chart.`);
        onNavigate('patient-details', existing.id);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to insert patient into central sync database.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div id="camera-ocr-view" className="flex-1 flex flex-col bg-[#F4F7FA] dark:bg-slate-950 overflow-y-auto p-4 space-y-4">
      
      {/* Dynamic Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-200 dark:bg-slate-900 rounded-xl">
        <button
          id="scanner-tab-ocr"
          onClick={() => setActiveTab('ocr')}
          className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'ocr'
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Report OCR Scanner</span>
        </button>

        <button
          id="scanner-tab-qr"
          onClick={() => setActiveTab('qr')}
          className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'qr'
              ? 'bg-white dark:bg-slate-800 text-[#0046AF] dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Emergency QR Reader</span>
        </button>
      </div>

      {activeTab === 'ocr' ? (
        /* ==================== OCR DOCUMENT SCANNER TAB ==================== */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Smart Report Scanner
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Gemini-Powered Multi-spectral Medical OCR Converter
              </p>
            </div>
          </div>

          {/* Select Document Class tag */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2 font-mono">
              Select Document Category
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {['Prescription', 'LabReport', 'DischargeSummary', 'MedicalBill'].map((type) => (
                <button
                  id={`select-doc-type-${type}`}
                  key={type}
                  onClick={() => {
                    setDocType(type as any);
                    setParsedResult(null);
                  }}
                  className={`py-1.5 rounded-lg text-[9px] font-bold transition border ${
                    docType === type
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {type === 'Prescription' && 'Rx Pad'}
                  {type === 'LabReport' && 'Lab report'}
                  {type === 'DischargeSummary' && 'Discharge'}
                  {type === 'MedicalBill' && 'ER Bill'}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Viewfinder chassis or Preview */}
          <div className="bg-slate-950 rounded-3xl aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-900 shadow-inner">
            {cameraActive ? (
              /* LIVE VIDEO FEED */
              <div className="w-full h-full relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                ></video>
                
                {/* Viewfinder Target Reticle */}
                <div className="absolute inset-8 border border-white/25 pointer-events-none rounded-xl flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg"></div>
                  <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg"></div>
                  <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg"></div>
                  <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg"></div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono bg-black/60 px-2 py-0.5 rounded">
                    ALIGN DOCUMENT
                  </span>
                </div>

                {/* Snap Button action */}
                <button
                  id="capture-snap-btn"
                  onClick={handleCapture}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-white hover:bg-slate-100 border-4 border-slate-800 rounded-full flex items-center justify-center transition shadow-lg active:scale-95"
                ></button>
              </div>
            ) : imagePreview ? (
              /* SNAPSHOT PREVIEW */
              <div className="w-full h-full relative">
                <img
                  src={imagePreview}
                  alt="Scanned medical preview"
                  className="w-full h-full object-contain bg-slate-900"
                  referrerPolicy="no-referrer"
                />
                
                {/* Retake buttons overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                  <button
                    id="retake-snap-btn"
                    onClick={startCamera}
                    className="px-2.5 py-1.5 bg-black/75 hover:bg-black text-white font-bold text-[10px] rounded-xl flex items-center space-x-1 border border-white/10"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Snap New</span>
                  </button>

                  <button
                    id="analyze-ocr-btn"
                    onClick={handleAnalyzeOCR}
                    disabled={analyzing}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl flex items-center space-x-1 shadow-md"
                  >
                    {analyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Run Gemini AI OCR</span>
                  </button>
                </div>
              </div>
            ) : (
              /* IDLE INSTRUCTIONS VIEW */
              <div className="text-center p-6 text-slate-400 space-y-4">
                <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mx-auto">
                  <Camera className="w-7 h-7 text-slate-500" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Initiate Scanner Camera</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                    Aim the camera squarely over prescription pads, blood charts, or invoices for automated parsing.
                  </p>
                </div>

                <div className="flex justify-center space-x-2 pt-2">
                  <button
                    id="start-camera-lens-btn"
                    onClick={startCamera}
                    className="px-3.5 py-2 bg-[#0046AF] hover:bg-[#003180] text-white font-bold text-[10px] rounded-xl transition flex items-center space-x-1.5 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Lens</span>
                  </button>
                  
                  <button
                    id="trigger-file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl transition flex items-center space-x-1.5 border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-[10px] text-amber-500 font-bold text-center leading-normal px-2">
              {cameraError}
            </p>
          )}

          {/* Clinical evaluation documents presets for rapid testing */}
          {!cameraActive && !imagePreview && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2 font-mono">
                EHR System Quick-Presets (OCR document tests)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="preset-doc-prescription"
                  onClick={() => handleSelectPreset('Prescription')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition"
                >
                  <FileText className="w-4 h-4 text-emerald-500 mb-1" />
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Arthur Pendragon</h5>
                  <p className="text-[8px] text-slate-400">Prescription Pad</p>
                </button>

                <button
                  id="preset-doc-labreport"
                  onClick={() => handleSelectPreset('LabReport')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition"
                >
                  <FileText className="w-4 h-4 text-[#0046AF] mb-1" />
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Sophia Martinez</h5>
                  <p className="text-[8px] text-slate-400">TSH Lab panel</p>
                </button>

                <button
                  id="preset-doc-dischargesummary"
                  onClick={() => handleSelectPreset('DischargeSummary')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition"
                >
                  <FileText className="w-4 h-4 text-rose-500 mb-1" />
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Marcus Aurelius</h5>
                  <p className="text-[8px] text-slate-400">Discharge Summary</p>
                </button>

                <button
                  id="preset-doc-medicalbill"
                  onClick={() => handleSelectPreset('MedicalBill')}
                  className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition"
                >
                  <FileText className="w-4 h-4 text-purple-500 mb-1" />
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">George Bailey</h5>
                  <p className="text-[8px] text-slate-400">ER invoice</p>
                </button>
              </div>
            </div>
          )}

          {/* Structured OCR Results Review with doctor editing capabilities */}
          {parsedResult && (
            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase font-mono">
                    AI Parsed EHR Reviewer
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                  Edit Before Saving
                </span>
              </div>

              {/* Editable Fields Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Full Name</label>
                  <input
                    type="text"
                    value={parsedResult.name || ''}
                    onChange={(e) => setParsedResult({ ...parsedResult, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Age</label>
                    <input
                      type="number"
                      value={parsedResult.age || 0}
                      onChange={(e) => setParsedResult({ ...parsedResult, age: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Gender</label>
                    <input
                      type="text"
                      value={parsedResult.gender || ''}
                      onChange={(e) => setParsedResult({ ...parsedResult, gender: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Blood Group</label>
                  <input
                    type="text"
                    value={parsedResult.bloodGroup || ''}
                    onChange={(e) => setParsedResult({ ...parsedResult, bloodGroup: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-rose-500 font-mono">Drug Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={(parsedResult.allergies || []).join(', ')}
                    onChange={(e) => setParsedResult({ ...parsedResult, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-600 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Medicines (comma separated)</label>
                  <textarea
                    value={(parsedResult.medicines || []).join(', ')}
                    onChange={(e) => setParsedResult({ ...parsedResult, medicines: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Chronic Diagnoses (comma separated)</label>
                  <textarea
                    value={(parsedResult.medicalHistory || []).join(', ')}
                    onChange={(e) => setParsedResult({ ...parsedResult, medicalHistory: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Assignment Selector Option */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase block font-mono">
                  Assign Extracted Data To:
                </label>
                <select
                  value={selectedPatientOption}
                  onChange={(e) => setSelectedPatientOption(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="NEW">+ Register as a New Patient Profile</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      Merge with {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-1">
                <button
                  id="save-ocr-to-ehr-btn"
                  onClick={handleSaveToEHR}
                  disabled={analyzing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-white font-bold" />
                  )}
                  <span>COMMIT TO SECURE CLINICAL EHR</span>
                </button>
              </div>

            </div>
          )}
        </div>
      ) : (
        /* ==================== EMERGENCY QR ACCESS TAB ==================== */
        <div className="space-y-4">
          
          {/* Header */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 text-[#0046AF] dark:text-blue-400 rounded-xl">
              <QrCode className="w-5 h-5 text-[#0046AF] dark:text-blue-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Scan Emergency QR
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Instant encrypted first-responder patient summary loader
              </p>
            </div>
          </div>

          {/* Secure staff badge */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/40 flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0046AF] dark:text-blue-400 shrink-0" />
            <div className="text-[10px]">
              <span className="font-extrabold text-blue-950 dark:text-blue-300 block uppercase font-mono tracking-tight">Clinician Authentication Confirmed</span>
              <span className="text-slate-500">Only authorized hospital medical staff can decrypt patient emergency QR bands.</span>
            </div>
          </div>

          {/* QR Viewfinder Simulator */}
          <div className="bg-slate-950 rounded-3xl aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-900 shadow-inner">
            <div className="absolute inset-10 border-2 border-dashed border-blue-400/40 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
              <QrCode className="w-16 h-16 text-blue-500/30 animate-pulse mb-2" />
              <div className="w-10 h-1 bg-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce"></div>
              <span className="text-[8px] uppercase tracking-wider text-blue-400/50 font-mono">SCANNING BAND...</span>
            </div>

            {/* Simulating QR Select overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 px-3 py-2 rounded-2xl flex items-center justify-between z-10 pointer-events-auto">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">SIMULATE QR SCAN:</span>
              <select
                value={scannedPatientId}
                onChange={(e) => handleSimulateQrScan(e.target.value)}
                className="p-1 bg-slate-900 text-white border border-slate-800 rounded text-[10px] focus:outline-none"
              >
                <option value="">-- Tap to Scan QR Band --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    Patient QR Band: {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingQrData && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Loader2 className="w-5 h-5 text-[#0046AF] animate-spin" />
              <span className="text-xs font-mono font-bold text-slate-500">Retrieving encrypted medical summary...</span>
            </div>
          )}

          {/* QR Scan Output View */}
          {scannedSummary && !loadingQrData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
              
              {/* Patient Basic Header details */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {patients.find(p => p.id === scannedPatientId)?.name}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                      ID: {scannedPatientId}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">BLOOD GROUP</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                    {scannedSummary.bloodGroup}
                  </span>
                </div>
              </div>

              {/* Urgency summary card */}
              <div className={`p-3.5 rounded-2xl border flex items-start space-x-2.5 relative overflow-hidden ${
                scannedSummary.emergencyRiskLevel === 'High'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-300'
                  : scannedSummary.emergencyRiskLevel === 'Medium'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-300'
              }`}>
                <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${
                  scannedSummary.emergencyRiskLevel === 'High' ? 'text-rose-600' : scannedSummary.emergencyRiskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <div className="text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold uppercase tracking-wide">Emergency Risk Level</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${
                      scannedSummary.emergencyRiskLevel === 'High' ? 'bg-rose-600' : scannedSummary.emergencyRiskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {scannedSummary.emergencyRiskLevel}
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">{scannedSummary.emergencyNotes}</p>
                </div>
              </div>

              {/* List Parameters */}
              <div className="space-y-3.5 text-xs">
                
                {/* Severe Allergies */}
                <div className="bg-rose-50/40 dark:bg-rose-950/10 p-3 rounded-2xl border border-rose-100 dark:border-rose-950/30">
                  <div className="flex items-center space-x-1.5 mb-1 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="font-bold uppercase text-[9px] font-mono tracking-wider">Clinical Allergen Warnings</span>
                  </div>
                  {scannedSummary.allergies && scannedSummary.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scannedSummary.allergies.map((a: string, idx: number) => (
                        <span key={idx} className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No severe drug allergies on file.</span>
                  )}
                </div>

                {/* Chronic Diseases */}
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[8px] block mb-1 font-mono">Chronic Diseases</span>
                  {scannedSummary.chronicDiseases && scannedSummary.chronicDiseases.length > 0 ? (
                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-normal">
                      {scannedSummary.chronicDiseases.join(' • ')}
                    </p>
                  ) : (
                    <span className="text-slate-400 italic">No chronic ailments.</span>
                  )}
                </div>

                {/* Current Medications */}
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[8px] block mb-1 font-mono">Current Medications</span>
                  {scannedSummary.currentMedications && scannedSummary.currentMedications.length > 0 ? (
                    <div className="space-y-1 mt-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                      {scannedSummary.currentMedications.map((m: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-1.5">
                          <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No active medication schedules.</span>
                  )}
                </div>

                {/* Previous Surgeries */}
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[8px] block mb-1 font-mono">Previous Surgeries</span>
                  {scannedSummary.previousSurgeries && scannedSummary.previousSurgeries.length > 0 ? (
                    <p className="text-slate-700 dark:text-slate-300">{scannedSummary.previousSurgeries.join(', ')}</p>
                  ) : (
                    <span className="text-slate-400 italic">No surgical histories.</span>
                  )}
                </div>

                {/* Last Visit Details */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[8px] block font-mono">Last Hospital Admission</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {scannedSummary.lastHospitalVisit || "Unknown"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[8px] block font-mono">Summary Generated</span>
                    <span className="font-mono text-[9px] text-slate-500 block mt-0.5">
                      {scannedSummary.generatedAt ? new Date(scannedSummary.generatedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Emergency Contact */}
                {patients.find(p => p.id === scannedPatientId)?.emergencyContact && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-2 space-y-1.5">
                    <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold uppercase text-[9px] font-mono tracking-wider">Emergency Contact Person</span>
                    </div>
                    {(() => {
                      const ec = patients.find(p => p.id === scannedPatientId)?.emergencyContact;
                      return ec ? (
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{ec.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{ec.relation}</span>
                          </div>
                          <a
                            href={`tel:${ec.phone}`}
                            className="px-3 py-1 bg-[#0046AF] hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg tracking-wide uppercase transition flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Quick Dial</span>
                          </a>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  id="qr-redirect-to-patient-profile"
                  onClick={() => onNavigate('patient-details', scannedPatientId)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 hover:bg-slate-200"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Open Active Patient EHR Chart</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
