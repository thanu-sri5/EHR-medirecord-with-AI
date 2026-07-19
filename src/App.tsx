import React, { useState, useEffect, useRef } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetails from './components/PatientDetails';
import EmergencyPage from './components/EmergencyPage';
import CameraScanner from './components/CameraScanner';
import StaffProfile from './components/StaffProfile';
import { Patient, EmergencyNotification, User as StaffUser } from './types';
import { Home, Users, Camera, ShieldAlert, Settings, ShieldCheck, Lock, Activity, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<string>('splash');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<StaffUser | null>(null);
  
  // Clinical state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<EmergencyNotification[]>([]);
  
  // Offline and Synchronization state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    try {
      const q = localStorage.getItem('pending_sync_queue');
      return q ? JSON.parse(q).length : 0;
    } catch {
      return 0;
    }
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('last_synced_time') || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [syncing, setSyncing] = useState<boolean>(false);

  const queueOfflineUpdate = (type: string, url: string, method: string, body: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
      queue.push({
        id: `SYNC-${Math.floor(100000 + Math.random() * 900000)}`,
        type,
        url,
        method,
        body,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pending_sync_queue', JSON.stringify(queue));
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.error("Failed to queue offline update:", err);
    }
  };

  const triggerAutoSync = async () => {
    if (syncing) return;
    const queue = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
    if (queue.length === 0) return;

    setSyncing(true);
    let successCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body)
        });
        if (res.ok) {
          successCount++;
        } else {
          break;
        }
      } catch (err) {
        console.error("Sync item failed:", err);
        break;
      }
    }

    if (successCount > 0) {
      const remaining = queue.slice(successCount);
      localStorage.setItem('pending_sync_queue', JSON.stringify(remaining));
      setPendingSyncCount(remaining.length);
      
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowStr);
      localStorage.setItem('last_synced_time', nowStr);

      await fetchPatientsInternal();
      await fetchNotificationsInternal();
    }
    setSyncing(false);
  };

  const fetchPatientsInternal = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatients(data);
      localStorage.setItem('cached_patients', JSON.stringify(data));
      setIsOnline(true);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowStr);
      localStorage.setItem('last_synced_time', nowStr);
    } catch (err) {
      console.error("Failed to load patient directories:", err);
      setIsOnline(false);
      const cached = localStorage.getItem('cached_patients');
      if (cached) {
        setPatients(JSON.parse(cached));
      }
    }
  };

  const fetchNotificationsInternal = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
      localStorage.setItem('cached_notifications', JSON.stringify(data));
    } catch (err) {
      console.error("Failed to load clinical alert log:", err);
      const cached = localStorage.getItem('cached_notifications');
      if (cached) {
        setNotifications(JSON.parse(cached));
      }
    }
  };

  const fetchPatients = fetchPatientsInternal;
  const fetchNotifications = fetchNotificationsInternal;

  // Sync state event registrations
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic synchronization check
    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerAutoSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncing]);

  // Security session states
  const [sessionTimeout, setSessionTimeout] = useState<number>(180); // 3 mins default
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [sessionWarning, setSessionWarning] = useState<boolean>(false);
  
  // Clock ticker state
  const [systemTime, setSystemTime] = useState<string>('');

  const activityTimeoutRef = useRef<any>(null);

  // Initialize clock and timers
  useEffect(() => {
    // Dynamic system clock ticker
    const clockInterval = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  // Sync session seconds with the active threshold
  useEffect(() => {
    setSecondsRemaining(sessionTimeout);
  }, [sessionTimeout]);

  // Session countdown ticker (HIPAA Auto-lockout)
  useEffect(() => {
    if (activePage === 'splash' || activePage === 'login' || !user) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleAutoLogout();
          return sessionTimeout;
        }
        if (prev <= 31) {
          setSessionWarning(true);
        } else {
          setSessionWarning(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePage, user, sessionTimeout]);

  // Fetch directory list and active alerts on boot
  useEffect(() => {
    fetchPatients();
    fetchNotifications();

    // Long poll alerts every 10 seconds for real-time patient syncing
    const alertPoll = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(alertPoll);
  }, []);

  // Reset inactive countdown timer on clinician mouse move, scroll, or tap
  const handleUserActivity = () => {
    if (activePage !== 'splash' && activePage !== 'login' && user) {
      setSecondsRemaining(sessionTimeout);
      setSessionWarning(false);
    }
  };

  const handleAutoLogout = () => {
    // Log final session termination on server
    if (user) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.staffId,
          userName: user.name,
          userRole: user.role,
          action: "SESSION AUTO-LOCKED due to operational terminal inactivity"
        })
      }).catch(err => console.error(err));
    }
    
    setUser(null);
    setSelectedPatientId(null);
    setSessionWarning(false);
    setActivePage('login');
    alert("SECURITY LOCKOUT:\nYour session has expired for patient record protection. Re-enter authorization PIN.");
  };

  const handleManualLogout = () => {
    if (user) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.staffId,
          userName: user.name,
          userRole: user.role,
          action: "LOGGED OUT - Closed terminal session safely"
        })
      }).catch(err => console.error(err));
    }
    setUser(null);
    setSelectedPatientId(null);
    setActivePage('login');
  };

  // Create Patient API
  const handleAddPatient = async (patientData: Partial<Patient>) => {
    const tempId = patientData.id || `PT-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPatient: Patient = {
      id: tempId,
      name: patientData.name || 'New Patient File',
      age: Number(patientData.age) || 30,
      gender: patientData.gender || 'Unknown',
      phone: patientData.phone || '+1 (555) 019-0000',
      bloodGroup: patientData.bloodGroup || 'O+',
      allergies: patientData.allergies || [],
      medicines: patientData.medicines || [],
      medicalHistory: patientData.medicalHistory || [],
      treatments: patientData.treatments || [],
      labReports: patientData.labReports || [],
      emergencyContact: patientData.emergencyContact || { name: 'Mary Contact', relation: 'Spouse', phone: '+1 (555) 019-0001' },
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: user?.name || "Clinic Operator",
      isEmergencyCase: !!patientData.isEmergencyCase
    };

    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);
    localStorage.setItem('cached_patients', JSON.stringify(updatedPatients));

    const payload = {
      ...patientData,
      id: tempId,
      lastUpdatedBy: user?.name || "Clinic Operator",
      lastUpdatedByStaffId: user?.staffId || "STF-SYS",
      lastUpdatedByRole: user?.role || "ADMIN",
    };

    if (!navigator.onLine) {
      queueOfflineUpdate('CREATE', '/api/patients', 'POST', payload);
      return;
    }

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchPatients();
      } else {
        queueOfflineUpdate('CREATE', '/api/patients', 'POST', payload);
      }
    } catch (err) {
      console.error("Online creation failed, queueing offline:", err);
      queueOfflineUpdate('CREATE', '/api/patients', 'POST', payload);
    }
  };

  // Update Patient API
  const handleUpdatePatient = async (id: string, updatedData: Partial<Patient> & { editNote?: string }) => {
    const updatedPatients = patients.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...updatedData,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: user?.name || "Clinic Operator"
        };
      }
      return p;
    });
    setPatients(updatedPatients);
    localStorage.setItem('cached_patients', JSON.stringify(updatedPatients));

    const payload = {
      ...updatedData,
      lastUpdatedBy: user?.name || "Clinic Operator",
      lastUpdatedByStaffId: user?.staffId || "STF-SYS",
      lastUpdatedByRole: user?.role || "DOCTOR",
    };

    if (!navigator.onLine) {
      queueOfflineUpdate('UPDATE', `/api/patients/${id}`, 'PUT', payload);
      return;
    }

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchPatients();
      } else {
        queueOfflineUpdate('UPDATE', `/api/patients/${id}`, 'PUT', payload);
      }
    } catch (err) {
      console.error("Online update failed, queueing offline:", err);
      queueOfflineUpdate('UPDATE', `/api/patients/${id}`, 'PUT', payload);
    }
  };

  // Delete Patient API
  const handleDeletePatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}?userId=${user?.staffId}&userName=${user?.name}&userRole=${user?.role}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedPatientId(null);
        setActivePage('patient-list');
        await fetchPatients();
      } else {
        throw new Error("EHR deletion failure");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Trigger Emergency Alert API
  const handleTriggerEmergency = async (patientId: string, message: string) => {
    try {
      const patient = patients.find((p) => p.id === patientId);
      
      // 1. Send active broadcast notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          severity: 'emergency',
          sender: user?.name || 'Authorized Nurse',
          senderId: user?.staffId || 'STF-NUR',
          senderRole: user?.role || 'NURSE',
          patientId: patientId,
          patientName: patient?.name
        })
      });

      // 2. Mark patient as active emergency case in local database
      await handleUpdatePatient(patientId, {
        isEmergencyCase: true,
        editNote: "CRITICAL: Switched status to Emergency Case (ER Ward)"
      });

      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark alerts as read
  const handleReadNotification = async (notifId: string) => {
    if (!user) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId, userId: user.staffId })
      });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToDetails = (id: string) => {
    setSelectedPatientId(id);
    setActivePage('patient-details');
  };

  // Inactivity tracking wrapper
  const pageContainerClass = `${darkMode ? 'dark' : ''} flex-1 flex flex-col overflow-hidden`;

  return (
    <div
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onKeyPress={handleUserActivity}
      onTouchStart={handleUserActivity}
      className={pageContainerClass}
    >
      <PhoneSimulator darkMode={darkMode} setDarkMode={setDarkMode} systemTime={systemTime}>
        
        {/* SECURE SESSION EXPIRING NOTICING OVERLAY */}
        {sessionWarning && (
          <div className="absolute top-10 left-4 right-4 bg-rose-600 text-white p-3 rounded-2xl shadow-xl z-50 flex items-center justify-between border border-white/20 animate-pulse text-xs">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-white" />
              <span>
                <strong>Terminal Auto-Locking:</strong> {secondsRemaining}s
              </span>
            </div>
            <button
              onClick={handleUserActivity}
              className="px-2.5 py-1 bg-white text-rose-600 font-extrabold rounded-lg hover:bg-slate-50 transition uppercase tracking-wider text-[10px]"
            >
              Extend Session
            </button>
          </div>
        )}

        {/* SCREEN ROUTING CONTROL PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* OFFLINE / SYNC CAPSULE BANNER */}
          {(!isOnline || pendingSyncCount > 0 || syncing) && (
            <div id="offline-sync-indicator-banner" className={`text-[10px] py-1.5 px-3 flex items-center justify-between font-mono font-bold shrink-0 border-b transition-colors duration-300 z-50 select-none ${
              !isOnline 
                ? 'bg-amber-100 dark:bg-amber-950/45 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/40' 
                : syncing
                  ? 'bg-blue-100 dark:bg-blue-950/45 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
            }`}>
              <div className="flex items-center space-x-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${!isOnline ? 'bg-amber-500 animate-pulse' : syncing ? 'bg-blue-500 animate-spin' : 'bg-emerald-500'}`}></span>
                <span>
                  {!isOnline 
                    ? 'OFFLINE MODE • CACHED CHARTS' 
                    : syncing 
                      ? 'SYNCING PENDING CHANGES...' 
                      : 'ONLINE • EHR SYNCED'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[9px] opacity-90">
                {pendingSyncCount > 0 && (
                  <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1 py-0.5 rounded-md text-[8px] tracking-tight font-bold">
                    {pendingSyncCount} PENDING
                  </span>
                )}
                {lastSyncedTime && <span>{lastSyncedTime}</span>}
              </div>
            </div>
          )}
          
          {/* Splash Screen page */}
          {activePage === 'splash' && (
            <SplashScreen onEnter={() => setActivePage('login')} />
          )}

          {/* Secure login view */}
          {activePage === 'login' && (
            <LoginScreen
              onLoginSuccess={(staffUser) => {
                setUser(staffUser);
                setSecondsRemaining(sessionTimeout);
                setActivePage('dashboard');
              }}
              onGoBackToSplash={() => setActivePage('splash')}
            />
          )}

          {/* Core Authorized clinical view */}
          {user && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Main routing views */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activePage === 'dashboard' && (
                  <Dashboard
                    user={user}
                    patients={patients}
                    notifications={notifications}
                    onNavigate={(page, targetId) => {
                      if (targetId) {
                        setSelectedPatientId(targetId);
                        setActivePage('patient-details');
                      } else {
                        setActivePage(page);
                      }
                    }}
                    onReadNotification={handleReadNotification}
                  />
                )}

                {activePage === 'patient-list' && (
                  <PatientList
                    patients={patients}
                    onSelectPatient={(id) => {
                      setSelectedPatientId(id);
                      setActivePage('patient-details');
                    }}
                    onAddPatient={handleAddPatient}
                    userRole={user.role}
                    userName={user.name}
                  />
                )}

                {activePage === 'patient-details' && selectedPatientId && (
                  <PatientDetails
                    patient={patients.find((p) => p.id === selectedPatientId) || patients[0]}
                    onBack={() => {
                      setSelectedPatientId(null);
                      setActivePage('patient-list');
                    }}
                    onUpdatePatient={handleUpdatePatient}
                    onDeletePatient={handleDeletePatient}
                    userRole={user.role}
                    userName={user.name}
                    userStaffId={user.staffId}
                  />
                )}

                {activePage === 'emergency' && (
                  <EmergencyPage
                    patients={patients}
                    onTriggerEmergency={handleTriggerEmergency}
                    onNavigateToDetails={handleNavigateToDetails}
                    userRole={user.role}
                    userName={user.name}
                  />
                )}

                {activePage === 'scanner' && (
                  <CameraScanner
                    patients={patients}
                    onAddPatient={handleAddPatient}
                    onUpdatePatient={handleUpdatePatient}
                    onNavigate={(page, id) => {
                      if (id) setSelectedPatientId(id);
                      setActivePage(page);
                    }}
                  />
                )}

                {activePage === 'settings' && (
                  <StaffProfile
                    user={user}
                    onLogout={handleManualLogout}
                    sessionTimeout={sessionTimeout}
                    setSessionTimeout={setSessionTimeout}
                  />
                )}
              </div>

              {/* Bottom Mobile Navigation Tabs */}
              {activePage !== 'splash' && activePage !== 'login' && (
                <div id="mobile-nav-bar" className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/60 flex justify-around items-center select-none shrink-0 z-40">
                  
                  {/* Tab: Home */}
                  <button
                    id="nav-tab-dashboard"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setActivePage('dashboard');
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 w-14 transition ${
                      activePage === 'dashboard'
                        ? 'text-[#0046AF] dark:text-blue-400'
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[9px] font-bold tracking-tight">Home</span>
                  </button>

                  {/* Tab: Patients Directory */}
                  <button
                    id="nav-tab-patients"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setActivePage('patient-list');
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 w-14 transition ${
                      activePage === 'patient-list' || activePage === 'patient-details'
                        ? 'text-[#0046AF] dark:text-blue-400'
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-[9px] font-bold tracking-tight font-sans">Patients</span>
                  </button>

                  {/* Tab: AI OCR Scanner */}
                  <button
                    id="nav-tab-scanner"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setActivePage('scanner');
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 w-14 transition ${
                      activePage === 'scanner'
                        ? 'text-emerald-500'
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <div className="relative">
                      <Camera className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </div>
                    <span className="text-[9px] font-bold tracking-tight">Scanner</span>
                  </button>

                  {/* Tab: Emergency Panel */}
                  <button
                    id="nav-tab-emergency"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setActivePage('emergency');
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 w-14 transition ${
                      activePage === 'emergency'
                        ? 'text-rose-500'
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-tight text-rose-500 font-sans">Alerts</span>
                  </button>

                  {/* Tab: Settings & Profile */}
                  <button
                    id="nav-tab-settings"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setActivePage('settings');
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 w-14 transition ${
                      activePage === 'settings'
                        ? 'text-[#0046AF] dark:text-blue-400'
                        : 'text-slate-400 hover:text-slate-500'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-[9px] font-bold tracking-tight">Settings</span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

      </PhoneSimulator>
    </div>
  );
}
