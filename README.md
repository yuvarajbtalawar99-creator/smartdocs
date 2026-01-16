# 📂 SmartDocs Hub

> **SmartDocs Hub** is a secure, production-ready SaaS web application that acts as a **digital vault for personal documents** and an **intelligent bill management system**. It is designed with modern cloud architecture, strong security practices, and a polished user experience.

---

## 🚀 Overview

SmartDocs Hub allows users to:

* Securely upload, store, and manage important personal documents
* Track recurring utility bills with intelligent due-date handling
* Access files safely using time-limited secure links
* Sync data seamlessly across devices using cloud storage

The project evolved from a simple prototype into a **scalable, real-world SaaS application**.

---

## 🛠️ Technology Stack

| Layer                     | Technology                           |
| ------------------------- | ------------------------------------ |
| **Frontend**              | React 18 + Vite                      |
| **Language**              | TypeScript (Strict Mode)             |
| **Styling**               | Tailwind CSS + Lucide Icons          |
| **UI Components**         | Radix UI + Shadcn UI                 |
| **State & Data Fetching** | TanStack React Query (v5)            |
| **Backend as a Service**  | Supabase (Auth, PostgreSQL, Storage) |
| **Build & Deployment**    | Production-optimized Vite build      |

---

## ✨ Core Features

### 📄 Document Vault

* Secure cloud storage for personal documents
* Supports multiple document types (Aadhaar, PAN, certificates, etc.)
* In-browser preview for images and PDF files
* Server-side pagination with infinite scrolling
* Secure access via short-lived **Signed URLs**

---

### 💸 Bill Management

* Centralized tracking for utility and recurring bills
* Automatic calculation of days remaining until due date
* Intelligent status tagging: **Paid / Pending / Overdue**
* Upload and store bill receipts permanently
* Background data refresh to keep bill statuses accurate

---

## 🧠 Architectural Evolution

### 🔁 From Prototype to Production

#### Data Layer

* **Before**: Browser `localStorage`
* **After**: Supabase PostgreSQL with cloud sync and encryption

#### Data Fetching

* **Before**: Manual `useEffect` calls
* **After**: TanStack React Query with caching and background refresh

#### File Security

* **Before**: Public file URLs
* **After**: Time-limited **Signed URLs** (60-second expiry)

#### UX Resilience

* Global error boundaries
* Graceful empty states for new users
* Retry mechanisms for network failures

---

## 🔒 Security Model

* **Row-Level Security (RLS)** ensures strict user data isolation
* Each user can access only their own database records
* Supabase Storage protected with RLS-based access rules
* No public access to sensitive files

---

## 🗺️ Future Roadmap

* 🔔 Automated email / push bill reminders using Supabase Edge Functions
* 🧾 AI-powered OCR for bill data extraction
* 📁 Custom folders and document organization
* 📱 PWA offline support for document thumbnails
* 📊 Audit logs and document access tracking

---

## ✅ Project Status

* **Build**: Stable
* **Security**: Enforced with RLS & Signed URLs
* **Performance**: Optimized with caching & pagination
* **Stage**: Production-ready

---

## 🧑‍💻 Developer Notes

This project follows real-world SaaS best practices:

* Stateless frontend architecture
* Secure multi-tenant backend
* Scalable cloud-first design
* Clean, maintainable TypeScript codebase

---

## 📌 License

This project is licensed under the **MIT License**.

---

⭐ If you like this project, consider giving it a star!
