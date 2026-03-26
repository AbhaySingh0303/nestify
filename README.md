# Nestify - PG Management Application

A full-stack, comprehensive web application to manage paying guest operations with role-based dashboard for Admins and Tenants.

## Features
- JWT Authentication & Authorization
- Admin role to manage rooms, tenants, incoming payments, and resolving complaints.
- Tenant role to view room assignments, pay monthly rent, and raise complaints.

## Tech Stack
- Frontend: React (Vite) + TailwindCSS (v4)
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose

## Setup Instructions

### 1. Database Setup
Ensure you have MongoDB installed and running on `mongodb://127.0.0.1:27017/nestify`.

### 2. Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with sample data:
   ```bash
   node seed.js
   ```
   *Seed data credentials:*
   - Admin: `admin@nestify.com` / `123456`
   - Tenant: `tenant@nestify.com` / `123456`
4. Start the server:
   ```bash
   node server.js
   ```
   *Runs on port 5000 by default.*

### 3. Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Runs on port 5173 by default.*
