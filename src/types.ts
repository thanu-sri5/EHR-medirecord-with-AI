export type Role = 'DOCTOR' | 'NURSE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: Role;
  staffId: string;
  department: string;
  phone: string;
  status: 'Active' | 'On Call' | 'Off Duty';
  shift: string;
  avatarUrl?: string;
}

export interface LabReport {
  id: string;
  date: string;
  testName: string;
  result: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface EmergencySummary {
  bloodGroup: string;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  previousSurgeries: string[];
  lastHospitalVisit: string;
  emergencyRiskLevel: 'Low' | 'Medium' | 'High';
  emergencyNotes: string;
  generatedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup: string;
  allergies: string[];
  medicines: string[];
  medicalHistory: string[];
  treatments: string[];
  labReports: LabReport[];
  emergencyContact: EmergencyContact;
  lastUpdated: string;
  lastUpdatedBy: string;
  isEmergencyCase?: boolean;
  emergencySummary?: EmergencySummary;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  patientId?: string;
  patientName?: string;
}

export interface EmergencyNotification {
  id: string;
  timestamp: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  sender: string;
  patientId?: string;
  readBy: string[];
}
