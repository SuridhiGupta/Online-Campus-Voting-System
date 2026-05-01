# 🗳️ DYP-SST Campus Voting System (Institutional Security Grid)

Most college voting systems are simple forms wrapped in a basic login screen. They are vulnerable to link-sharing, voting from dorm rooms, and unauthorized access. 

This project was built to solve a specific problem: **How do we run a 100% secure, transparent, and strictly controlled digital election inside a physical college campus?**

The answer is the **Institutional Security Grid**—a robust, LAN-based architecture that introduces hardware-level access controls, completely separating the Master Server from the Student Terminals.

---

## 📖 The Story Behind the Architecture

### **The "Why" (The Problem)**
Traditional web-based voting systems fail in physical campus environments because any student with a URL and an ERP ID can vote from anywhere. We needed a system that mathematically guaranteed a student was physically present in the authorized computer lab to cast their vote, while preventing any unauthorized devices (like personal mobile phones) from intercepting the election.

### **The "What" (The Solution)**
I designed a custom **Hardware Access Control Grid**. Rather than just authenticating *users*, this system authenticates *hardware*. 
When a device connects to the network, it is intercepted by the "Security Gate". It is held in a "Pending" state and assigned a physical terminal number (e.g., DEVICE 1, DEVICE 2). The Master Admin must physically approve the terminal before it is allowed to see the voting portal. 

### **The "How" (The Engineering)**
*   **Zero-Trust Networking:** If the Admin initiates an active election ("Election Live"), the backend initiates a **Network Lockdown**. Any new device attempting to join the network mid-election is hit with a strict HTTP 403 Forbidden rejection.
*   **Dual-Port LAN Strategy:** The system runs an automated `.bat` script that deploys a dual-environment on a single machine. Port `3000` is reserved exclusively for local Master Admin access, while Port `5000` serves a highly-optimized, compiled React production build to the rest of the campus LAN (`192.168.x.x`). 
*   **Deterministic Sequence IDs:** Instead of relying on unpredictable database constraints, the backend uses pure mathematical array indexing to guarantee that lab terminals are always sequentially numbered (1, 2, 3...) regardless of connection dropouts or database resets.

---

## 🌟 What Makes This Stand Out?

1.  **Hardware-Level Security over Password Security:** You cannot hack what you cannot access. The Security Gate prevents unauthorized devices from even downloading the voting payload.
2.  **Live Election Lockdown:** The network actively refuses new connections while polls are open, guaranteeing absolute network stability.
3.  **Premium Institutional Aesthetic:** Built from scratch using Tailwind CSS. No generic Bootstrap templates. It uses official maroon/gold institutional colors, custom glass-morphism, and sophisticated micro-animations.
4.  **Idiot-Proof Deployment:** A custom `START_VOTING_SYSTEM.bat` script automatically checks for dependencies, installs missing Node modules, and boots the entire dual-port LAN infrastructure with a single double-click.

---

## 🛠️ Technical Stack
*   **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Axios.
*   **Backend:** Node.js, Express.js, PostgreSQL (pg).
*   **Architecture:** Single-Page Application (SPA) with Role-Based Routing (Admin, Teacher, Student).
*   **Deployment:** Custom Windows Batch Automation for Local Area Networks (LAN).

## 🚀 Quick Start
1. Ensure PostgreSQL is running and `backup.sql` is restored.
2. Double-click `START_VOTING_SYSTEM.bat`.
3. The Admin panel opens on the Master Server (`localhost:3000`).
4. Students connect via the server's IPv4 address (`http://<SERVER_IP>:5000`).

---
*Built for security, transparency, and architectural excellence.*
