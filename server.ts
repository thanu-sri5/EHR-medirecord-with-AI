import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const _filename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : __filename;
const _dirname = path.dirname(_filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to resolve db paths
const getDbPath = (filename: string) => {
  const dbDir = path.join(_dirname, "src", "db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, filename);
};

// JSON Database Helper
const readData = (filename: string, defaultVal: any = []) => {
  const filePath = getDbPath(filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultVal;
  }
};

const writeData = (filename: string, data: any) => {
  const filePath = getDbPath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
};

// Initialize logs and notifications if not exists
readData("logs.json", []);
readData("notifications.json", [
  {
    "id": "NOT-001",
    "timestamp": new Date(Date.now() - 3600000).toISOString(),
    "message": "URGENT: Red Emergency Button activated for Robert Johnson (PT-48291) in Room 304 B. Blood Group B+ required.",
    "severity": "emergency",
    "sender": "Nurse Clara Barton",
    "patientId": "PT-48291",
    "readBy": []
  }
]);

// --- API ROUTES ---

// 1. Patient Endpoints
app.get("/api/patients", (req, res) => {
  const patients = readData("patients.json", []);
  res.json(patients);
});

app.post("/api/patients", (req, res) => {
  const patients = readData("patients.json", []);
  const newPatient = {
    ...req.body,
    id: req.body.id || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
    lastUpdated: new Date().toISOString()
  };
  patients.unshift(newPatient);
  writeData("patients.json", patients);

  // Auto Audit Log
  const logs = readData("logs.json", []);
  logs.unshift({
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    userId: req.body.lastUpdatedByStaffId || "SYSTEM",
    userName: req.body.lastUpdatedBy || "System Operator",
    userRole: req.body.lastUpdatedByRole || "ADMIN",
    action: "CREATED patient record",
    patientId: newPatient.id,
    patientName: newPatient.name
  });
  writeData("logs.json", logs);

  res.status(201).json(newPatient);
});

app.put("/api/patients/:id", (req, res) => {
  const patients = readData("patients.json", []);
  const index = patients.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const updatedPatient = {
    ...patients[index],
    ...req.body,
    id: req.params.id, // keep original id
    lastUpdated: new Date().toISOString()
  };

  patients[index] = updatedPatient;
  writeData("patients.json", patients);

  // Auto Audit Log
  const logs = readData("logs.json", []);
  logs.unshift({
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    userId: req.body.lastUpdatedByStaffId || "SYSTEM",
    userName: req.body.lastUpdatedBy || "System Operator",
    userRole: req.body.lastUpdatedByRole || "DOCTOR",
    action: `UPDATED patient record: ${req.body.editNote || "Modified patient details"}`,
    patientId: updatedPatient.id,
    patientName: updatedPatient.name
  });
  writeData("logs.json", logs);

  res.json(updatedPatient);
});

app.delete("/api/patients/:id", (req, res) => {
  const patients = readData("patients.json", []);
  const index = patients.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const deletedPatient = patients[index];
  patients.splice(index, 1);
  writeData("patients.json", patients);

  // Auto Audit Log
  const logs = readData("logs.json", []);
  logs.unshift({
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    userId: (req.query.userId as string) || "SYSTEM",
    userName: (req.query.userName as string) || "System Operator",
    userRole: (req.query.userRole as any) || "ADMIN",
    action: "DELETED patient record",
    patientId: deletedPatient.id,
    patientName: deletedPatient.name
  });
  writeData("logs.json", logs);

  res.json({ success: true, deletedId: req.params.id });
});

// 2. Audit Logs Endpoints
app.get("/api/logs", (req, res) => {
  const logs = readData("logs.json", []);
  res.json(logs);
});

app.post("/api/logs", (req, res) => {
  const logs = readData("logs.json", []);
  const newLog = {
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    ...req.body
  };
  logs.unshift(newLog);
  writeData("logs.json", logs);
  res.status(201).json(newLog);
});

// 3. Notifications Endpoints
app.get("/api/notifications", (req, res) => {
  const notifications = readData("notifications.json", []);
  res.json(notifications);
});

app.post("/api/notifications", (req, res) => {
  const notifications = readData("notifications.json", []);
  const newNotif = {
    id: `NOT-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    message: req.body.message,
    severity: req.body.severity || "info",
    sender: req.body.sender || "System Alert",
    patientId: req.body.patientId,
    readBy: []
  };
  notifications.unshift(newNotif);
  writeData("notifications.json", notifications);

  // Add audit log for emergency trigger
  if (req.body.severity === "emergency") {
    const logs = readData("logs.json", []);
    logs.unshift({
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      userId: req.body.senderId || "SYSTEM",
      userName: req.body.sender || "System Operator",
      userRole: req.body.senderRole || "NURSE",
      action: "TRIGGERED Emergency Broadcast",
      patientId: req.body.patientId,
      patientName: req.body.patientName
    });
    writeData("logs.json", logs);
  }

  res.status(201).json(newNotif);
});

app.post("/api/notifications/read", (req, res) => {
  const notifications = readData("notifications.json", []);
  const { notifId, userId } = req.body;
  const notif = notifications.find((n: any) => n.id === notifId);
  if (notif && !notif.readBy.includes(userId)) {
    notif.readBy.push(userId);
    writeData("notifications.json", notifications);
  }
  res.json({ success: true });
});

// AI Emergency Summary Endpoint (Uses gemini-3.5-flash)
app.post("/api/patients/:id/emergency-summary", async (req, res) => {
  const patients = readData("patients.json", []);
  const patient = patients.find((p: any) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const force = req.query.force === "true" || req.body.force === true;

  if (patient.emergencySummary && !force) {
    return res.json(patient.emergencySummary);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY not configured. Falling back to rule-based summary.");
    const summary = getFallbackSummary(patient);
    patient.emergencySummary = summary;
    writeData("patients.json", patients);
    return res.json(summary);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const prompt = `Generate a highly concise, high-impact clinical Emergency Medical Summary for the following patient record:
    Patient: ${JSON.stringify(patient)}
    
    Format the output exactly as JSON matching this schema:
    {
      "bloodGroup": "string (e.g., O+)",
      "allergies": ["list of severe allergies as strings"],
      "chronicDiseases": ["list of pre-existing chronic conditions as strings"],
      "currentMedications": ["list of medications from active prescriptions as strings"],
      "previousSurgeries": ["list of surgical treatments extracted or inferred from their treatments/history as strings"],
      "lastHospitalVisit": "string (inferred last visit date or reason, e.g., 'July 2026 for TSH bloodwork')",
      "emergencyRiskLevel": "string (one of: 'Low', 'Medium', 'High')",
      "emergencyNotes": "string (concise, high-impact notes for emergency first-responders, max 2 sentences)"
    }
    
    Ensure all fields are realistic, concise, and clinically logical. Return ONLY the raw JSON object. Do not include markdown backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert clinical summarizer. Output a structured medical summary in raw JSON format.",
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const summary = JSON.parse(cleanedText);
    summary.generatedAt = new Date().toISOString();

    patient.emergencySummary = summary;
    writeData("patients.json", patients);

    res.json(summary);
  } catch (error: any) {
    console.error("Gemini Emergency Summary generation failed:", error);
    const summary = getFallbackSummary(patient);
    patient.emergencySummary = summary;
    writeData("patients.json", patients);
    res.json(summary);
  }
});

// Fallback rule-based clinical summary generator
function getFallbackSummary(patient: any) {
  let riskLevel = "Low";
  let notes = "No known active clinical drug allergies. Patient clinically stable. Standard emergency precautions.";

  if (patient.isEmergencyCase) {
    riskLevel = "High";
    notes = "CRITICAL CARE ADMISSION. switched to active emergency status. Monitor respiratory and cardiovascular stability.";
  } else if (patient.allergies && patient.allergies.length > 0) {
    riskLevel = "Medium";
    notes = `ALLERGY WARNING: Known sensitivity to ${patient.allergies.join(", ")}. Keep Epinephrine ready for anaphylaxis prevention.`;
  }

  return {
    bloodGroup: patient.bloodGroup || "O+",
    allergies: patient.allergies || [],
    chronicDiseases: patient.medicalHistory || [],
    currentMedications: patient.medicines || [],
    previousSurgeries: patient.treatments || ["None reported"],
    lastHospitalVisit: "July 2026 (Active EHR Intake)",
    emergencyRiskLevel: riskLevel,
    emergencyNotes: notes,
    generatedAt: new Date().toISOString()
  };
}

// 4. AI Gemini OCR endpoint (Captures image as base64, parses using gemini-3.5-flash)
app.post("/api/ocr", async (req, res) => {
  const { image, mimeType, documentType, prompt: customPrompt } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Missing image base64 data" });
  }

  // Check if GEMINI_API_KEY is available. If not, fallback gracefully!
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY not configured. Falling back to mock OCR analyzer.");
    // Simulate highly professional, smart parsing based on document type
    return res.json({
      isMocked: true,
      data: getMockOcrOutput(documentType)
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const ocrSystemInstruction = `You are an expert clinical informatics system that processes photographed medical documents (prescriptions, lab reports, and billing statements) and converts them into pristine, highly structured JSON profiles for hospital Electronic Health Records (EHR).
Your task is to analyze the text and layout of the image and populate a structured EHR record. Return ONLY a raw JSON object with the fields defined in the schema. Do not enclose it in markdown. Do not include any greeting or conversational text. Use exact technical terminology.`;

    const ocrSchemaPrompt = `Analyze the provided image of a medical ${documentType || "document"} and extract patient information.
Extract the following information in raw JSON format matching this schema exactly:
{
  "name": "Full name of the patient (string, invent a plausible full name if name is missing or blurred based on report hints, e.g. 'William Vance')",
  "age": "Age as an integer (number, e.g. 45)",
  "gender": "Gender (string, e.g. 'Male' or 'Female')",
  "bloodGroup": "Blood Group (string, e.g., 'O+', 'A-', 'AB+', 'B+', etc. or 'Unknown' if not mentioned)",
  "allergies": ["List of extracted drug or food allergies as strings, e.g. ['Sulfa', 'Penicillin'] or empty array if none"],
  "medicines": ["List of active daily medicines with dosages, e.g., ['Aspirin 81mg once daily', 'Atorvastatin 20mg at bedtime']"],
  "medicalHistory": ["Known pre-existing chronic conditions/diseases, e.g., 'Hypertension', 'Asthma'"],
  "treatments": ["Past clinical procedures, surgical treatments, or current therapies with dates if visible"],
  "labReports": [
    {
      "testName": "Name of the lab test, e.g., 'Comprehensive Metabolic Panel'",
      "date": "Date of lab test in YYYY-MM-DD or standard format",
      "result": "Structured test results with numerical values and standard reference ranges, e.g., 'Glucose: 145 mg/dL (Reference: 70-100 mg/dL)'",
      "status": "One of: 'Normal', 'Abnormal', 'Critical' (based on clinical ranges)"
    }
  ],
  "emergencyContact": {
    "name": "Emergency contact person's name (string)",
    "relation": "Relationship to patient (string, e.g., 'Spouse', 'Child')",
    "phone": "Valid phone number (string)"
  }
}

Important Instructions:
- Keep the fields as realistic and complete as possible based on the text found.
- If certain information is completely unmentioned, fill in clinically logical defaults (e.g., Blood Group: 'O+', Allergies: [], Emergency Contact: a standard realistic spouse or sibling name).
- Return ONLY the JSON object. Do not include any markdown backticks or explaining text.`;

    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Clean
      }
    };

    const textPart = {
      text: `${ocrSchemaPrompt}\n${customPrompt || ""}`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: ocrSystemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    // Clean up markdown backticks if any slipped through
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    res.json({
      isMocked: false,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Gemini OCR Processing failed:", error);
    res.status(500).json({
      error: "AI processing failed. Falling back to simulation.",
      details: error.message,
      data: getMockOcrOutput(documentType)
    });
  }
});

// Mock Data generators for fallback
function getMockOcrOutput(docType: string) {
  const randNum = () => Math.floor(1000 + Math.random() * 9000);
  if (docType === "Prescription") {
    return {
      name: "Arthur Pendragon",
      age: 42,
      gender: "Male",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      medicines: [
        "Amoxicillin-Clavulanate 875mg twice daily for 7 days",
        "Ibuprofen 600mg every 6 hours as needed for severe swelling",
        "Omeprazole 20mg once daily before breakfast"
      ],
      medicalHistory: ["Gastroesophageal Reflux Disease (GERD)", "Seasonal Allergies"],
      treatments: ["Dental Crown placement - July 2026"],
      labReports: [],
      emergencyContact: {
        name: "Guinevere Pendragon",
        relation: "Spouse",
        phone: "+1 (555) 782-9111"
      }
    };
  } else if (docType === "LabReport") {
    return {
      name: "Sophia Martinez",
      age: 29,
      gender: "Female",
      bloodGroup: "A+",
      allergies: ["Latex"],
      medicines: ["Synthroid 50mcg once daily"],
      medicalHistory: ["Hypothyroidism", "Mild Iron Deficiency Anemia"],
      treatments: ["None"],
      labReports: [
        {
          testName: "Thyroid Stimulating Hormone (TSH)",
          date: new Date().toISOString().split("T")[0],
          result: "TSH: 5.42 uIU/mL (Elevated reference range: 0.45 - 4.50 uIU/mL)",
          status: "Abnormal"
        },
        {
          testName: "Serum Ferritin Level",
          date: new Date().toISOString().split("T")[0],
          result: "Ferritin: 9 ng/mL (Low reference range: 15 - 150 ng/mL)",
          status: "Abnormal"
        }
      ],
      emergencyContact: {
        name: "Carlos Martinez",
        relation: "Brother",
        phone: "+1 (555) 238-9021"
      }
    };
  } else if (docType === "DischargeSummary") {
    return {
      name: "Marcus Aurelius",
      age: 58,
      gender: "Male",
      bloodGroup: "B+",
      allergies: ["Aspirin", "NSAIDs"],
      medicines: [
        "Metoprolol Succinate 50mg once daily",
        "Clopidogrel 75mg once daily",
        "Atorvastatin 40mg at bedtime"
      ],
      medicalHistory: ["Coronary Artery Disease", "Myocardial Infarction", "Type 2 Diabetes"],
      treatments: ["Percutaneous Coronary Intervention (PCI) with drug-eluting stent - July 10, 2026"],
      labReports: [
        {
          testName: "Troponin I Cardiac Assay",
          date: new Date().toISOString().split("T")[0],
          result: "Troponin I: 0.02 ng/mL (Normal reference range: < 0.04 ng/mL)",
          status: "Normal"
        }
      ],
      emergencyContact: {
        name: "Faustina Aurelius",
        relation: "Spouse",
        phone: "+1 (555) 492-0192"
      }
    };
  } else {
    // MedicalBill
    return {
      name: "George Bailey",
      age: 51,
      gender: "Male",
      bloodGroup: "AB-",
      allergies: ["Sulfa Drugs", "Bee Stings"],
      medicines: ["Lisinopril 20mg", "Amlodipine 5mg"],
      medicalHistory: ["Hypertension", "Hyperlipidemia"],
      treatments: ["Emergency Room Consultation - Acute Bronchitis - July 2026", "Nebulizer Treatment"],
      labReports: [
        {
          testName: "Chest X-Ray 2 Views",
          date: new Date().toISOString().split("T")[0],
          result: "Findings: Hyperinflation, no focal consolidation, clear pleural spaces.",
          status: "Normal"
        }
      ],
      emergencyContact: {
        name: "Mary Bailey",
        relation: "Spouse",
        phone: "+1 (555) 902-1823"
      }
    };
  }
}

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartCare EHR Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
