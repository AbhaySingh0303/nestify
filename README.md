# Nestify – PG Management System

A modern full-stack web application designed to simplify Paying Guest (PG) accommodation management for both owners and tenants.

---

## Overview

Nestify streamlines the process of managing PGs by providing features like:

- Tenant onboarding and approval
- Room allocation
- Monthly rent payments
- Complaint management
- Dashboard insights

Built with a scalable architecture, Nestify reduces manual work and improves transparency between owners and tenants.

---

## Tech Stack

### Frontend
- React.js (Vite)
- Material UI
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Deployment
- Frontend: Render (Static Site)
- Backend: Render (Web Service)

---

## Features

### Authentication and Roles
- Secure login and signup using JWT
- Role-based access:
  - Owner
  - Tenant

---

### Owner Features
- Add and manage tenants
- Approve tenant requests using track ID
- Assign rooms
- Upload QR code for payments
- Monitor rent status
- View complaints

---

### Tenant Features
- Join PG using track ID
- View room details
- Pay monthly rent
- Raise complaints
- Track payment history

---

### Payment System
- Monthly rent is automatically assigned
- Owner provides QR code for payment
- Tenants can pay rent using the provided QR

---

### Dashboard
- Overview of:
  - Tenants
  - Rooms
  - Payments
  - Complaints

---

## Project Structure
nestify/
│
├── frontend/ # React (Vite)
│ ├── src/
│ ├── public/
│ └── dist/ # Build output
│
├── backend/ # Node.js + Express
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ └── middleware/
│
└── README.md


---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nestify.git
cd nestify
2. Backend Setup
cd backend
npm install
npm start

Create a .env file in the backend directory:

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
3. Frontend Setup
cd frontend
npm install
npm run dev
Deployment (Render)
Frontend Settings

#Build Command:

cd frontend && npm install && npm run build

#Publish Directory:

frontend/dist
Environment Variables
Backend
MONGO_URI
JWT_SECRET
PORT

##Future Improvements
Integration with payment gateways such as Razorpay or Stripe
Email and SMS notifications
Room availability analytics
Mobile application version
Advanced complaint handling system

##Contributing

Contributions are welcome. Fork the repository and submit a pull request

##Author

Abhay
B.Tech Student | Full Stack Developer


---

If you want next-level polish, I can also:
- Add **live demo + screenshots section**
- Add **API documentation section**
- Or convert this into a **perfect GitHub portfolio README**

Just tell me.
