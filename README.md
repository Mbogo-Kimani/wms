# Workforce Management System (WMS)

A robust, enterprise-grade solution for tracking employee attendance, managing shifts, handling leaves, and monitoring workforce reliability with real-time analytics.

## 🚀 Live Demo
Access the production environment here: **[WMS Live Portal](https://evowms.vercel.app)**  
*Use the "Auto-Fill & Access Demo" button on the login page to login as System Administrator.*

---

## 🛠 Features

### 🏢 For Administrators & Managers
- **Real-time Attendance Dashboard**: Monitor present, late, and absent employees at a glance.
- **Onboarding Management**: Review and verify new employee registrations with Cloudinary-hosted profile photo support.
- **Smart Shift Scheduling**: Define recurring shifts with grace periods and flexible timing.
- **Leave Management Flow**: Process leave requests and track yearly resets automatically.
- **Worker Reliability Scoring**: AI-driven scores based on punctuality and attendance patterns.
- **Global Memos**: Broadcast messages to specific roles or the entire workforce.

### 👷 For Workers
- **Self-Service Dashboard**: Clock-in/Clock-out with delay detection and late penalty tracking.
- **Profile Management**: Update contact details and upload profile photos securely.
- **Security**: Full email verification and password reset workflows.
- **Activity Timeline**: Review historical attendance and shift performance.

---

## 🏗 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Storage** | Cloudinary (Images & Documents) |
| **Email** | Brevo (SMTP & Transactional API) |
| **Scheduling** | node-cron |
| **Real-time** | REST API with JWT Authentication |

---

## 📦 Deployment Architecture

- **Backend**: Hosted on **Render** (Free Tier with anti-sleep bot integration).
- **Frontend**: Hosted on **Vercel** with custom SPA routing via `vercel.json`.
- **Database**: **MongoDB Atlas** (Cloud-hosted).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js v18+
- MongoDB Atlas Account
- Cloudinary & Brevo API Keys

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in credentials
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Configure VITE_API_URL in your environment
npm run dev
```

---

## 🛡 Security & Reliability
- **Rate Limiting**: Protected against brute-force attacks on sensitive endpoints.
- **Role-Based Access Control (RBAC)**: Distinct permissions for System Admins, Managers, and Supervisors.
- **Atomic Employee IDs**: Custom `EMP-XXXX` generation with race-condition prevention.
- **Anti-Sleep Bot**: Maintains 24/7 availability on Render's free tier via self-pinging cron jobs.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
