# MediRecord 🏥

Cloud-Based Electronic Health Record (EHR) & Hospital Management System

## 📌 Overview

MediRecord is a secure Electronic Health Record (EHR) platform designed for hospitals, clinics, doctors, and patients. It helps healthcare providers manage patient records, appointments, prescriptions, medical history, billing, and laboratory reports in a centralized cloud-based system.

The platform improves healthcare efficiency, reduces paperwork, and enables secure access to patient information anytime and anywhere.

---

## ✨ Features

### 👤 Patient Management

* Patient Registration
* Patient Profile Management
* Medical History Tracking
* Patient Search & Filtering
* Emergency Contact Information

### 👨‍⚕️ Doctor Management

* Doctor Profiles
* Department Management
* Doctor Availability Scheduling
* Consultation Records

### 📅 Appointment Management

* Book Appointments
* Reschedule Appointments
* Appointment Status Tracking
* Appointment Notifications

### 📋 Electronic Medical Records (EMR)

* Digital Patient Records
* Diagnosis Management
* Treatment History
* Clinical Notes
* Health Reports Storage

### 💊 Prescription Management

* Create Prescriptions
* Medication History
* Prescription Tracking
* Download Prescription Reports

### 🧪 Laboratory Management

* Upload Lab Reports
* Test Result Tracking
* Patient Access to Reports

### 💳 Billing & Payments

* Invoice Generation
* Payment Tracking
* Billing History
* Financial Reports

### 🔔 Notifications

* Appointment Reminders
* Prescription Alerts
* Report Availability Notifications

---

## 🏗️ System Architecture

Frontend → React.js + TypeScript + Tailwind CSS

Backend → Spring Boot (Java)

Database → MySQL

Authentication → JWT + Role-Based Access Control

File Storage → AWS S3 / Cloudinary

Deployment → Docker + Cloud Cloud Deployment

---

## 🛠️ Tech Stack

### Frontend

* React.js
* TypeScript
* Tailwind CSS
* Vite
* Axios
* React Query

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* Hibernate

### Database

* MySQL

### Cloud & DevOps

* Docker
* AWS
* GitHub Actions

### Tools

* Git
* GitHub
* Postman
* VS Code
* IntelliJ IDEA

---

## 📂 Project Structure

```text
medirecord/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   └── assets/
│
├── backend/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── security/
│   └── config/
│
├── database/
├── docs/
└── README.md
```

---

## 🗄️ Database Tables

### Users

```sql
user_id
name
email
password
role
created_at
```

### Patients

```sql
patient_id
name
date_of_birth
gender
phone
address
blood_group
emergency_contact
```

### Doctors

```sql
doctor_id
name
specialization
department
phone
email
```

### Appointments

```sql
appointment_id
patient_id
doctor_id
appointment_date
status
remarks
```

### Medical Records

```sql
record_id
patient_id
doctor_id
diagnosis
treatment
notes
created_at
```

### Prescriptions

```sql
prescription_id
patient_id
doctor_id
medications
dosage
instructions
```

### Billing

```sql
bill_id
patient_id
amount
payment_status
generated_date
```

---

## 🔐 Security Features

* JWT Authentication
* Password Encryption (BCrypt)
* Role-Based Access Control
* Secure REST APIs
* Audit Logging
* Patient Data Protection

---

## 🚀 Installation

### Clone Repository

```bash
git clone <repository-url>
cd medirecord
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
mvn spring-boot:run
```

### Database

```sql
CREATE DATABASE medirecord;
```

Update database credentials in:

```properties
application.properties
```

---

## 👥 User Roles

### Admin

* Manage Doctors
* Manage Patients
* Manage Departments
* View Reports

### Doctor

* View Assigned Patients
* Create Prescriptions
* Update Medical Records

### Receptionist

* Register Patients
* Schedule Appointments
* Generate Bills

### Patient

* View Appointments
* Access Medical Records
* Download Reports

---

## 🎯 Future Enhancements

* Telemedicine Video Consultation
* AI Disease Prediction
* AI Prescription Suggestions
* Voice-Based Medical Notes
* Mobile Application
* Insurance Integration
* Multi-Hospital Support
* Wearable Device Integration

---

## 👩‍💻 Developed By

Dhanushree P

B.Tech Artificial Intelligence & Data Science

2023 – 2027

---

## 📄 License

This project is developed for educational, research, and healthcare management purposes.

