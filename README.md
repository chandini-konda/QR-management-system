# QR Code Management & Tracking System

A full-stack MERN application for QR code generation, assignment, live tracking, and management, with role-based dashboards and real-time QR code scanning.

---

## Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [License](#license)

---

## Features

### Authentication & Roles
- User registration and login
- Role-based access: **User**, **Admin**, **SuperAdmin**
- Session management

### QR Code Management
- **Admin Dashboard**: Generate, edit, and delete QR codes
- **User Dashboard**: View and track assigned QR codes
- **SuperAdmin Dashboard**: (if implemented) for higher-level management
- All QR codes stored in MongoDB with unique 16-digit values

### QR Code Assignment & Scanning
- Users can scan QR codes using their device camera
- QR codes are validated and assigned to the user in real-time
- Error handling for invalid, duplicate, or unassigned codes

### Live Location Tracking & Route Visualization
- Track the live location of devices (cars) associated with QR codes
- View historical routes on an interactive map
- Custom car icon markers on all maps

### Modern UI
- Built with React and Material-UI for a responsive, user-friendly experience

---

## Screenshots

- **User Dashboard**: View and track your QR codes, scan new devices, see live location and routes
- **Admin Dashboard**: Generate and manage QR codes, assign to users
- **QR Code Map**: Interactive map with car icons for live and historical locations

---

## Tech Stack

- **Frontend**: React, Vite, Material-UI, React-Leaflet, qrcode.react, html5-qrcode
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB
- **Authentication**: express-session, MongoDB session store
- **Other Tools**: ESLint, Postman (for API testing)

---

## Project Structure

```
loginreg/
  ├── client/                # React frontend
  │   ├── src/Components/    # All React components (Dashboards, QRMap, QRScanner, etc.)
  │   ├── public/            # Static assets (car.png, etc.)
  │   └── ...                # Vite, ESLint, etc.
  ├── server/                # Node.js/Express backend
  │   ├── model/             # Mongoose models (User.js, QRCode.js)
  │   └── index.js           # Main server file
  ├── README.md              # Project documentation
  └── loginreg.postman_collection.json # Postman API collection
```

---

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd loginreg
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

3. **Environment variables**
   - Create a `.env` file in the `server/` directory:
     ```
     MONGO_URI=your_mongodb_connection_string
     SESSION_SECRET=your_session_secret
     PORT=3001
     ```

4. **Start the application**
   ```bash
   # Start backend (from server/)
   npm start

   # Start frontend (from client/)
   npm run dev
   ```

---

## Usage Guide

### For Users
- Register or log in
- Go to the User Dashboard
- View your assigned QR codes
- Click "Add Device" to scan a new QR code (using your camera)
- Track your devices live on a map, or view their historical routes

### For Admins
- Log in as an admin
- Generate new QR codes
- Distribute QR codes to users
- View, edit, or delete QR codes

### QR Code Format
- Must be a 16-digit unique number (e.g., `1234567890123456`)
- The system validates format and uniqueness

---

## API Endpoints

### Authentication
- `POST /signup` — Register a new user
- `POST /login` — User login
- `POST /logout` — User logout
- `GET /user` — Get current user info
- `GET /check-role` — Check user role

### QR Code Management
- `POST /generate-qrcodes` — Generate new QR codes (Admin)
- `GET /qrcodes` — Get all QR codes (Admin)
- `GET /user-qrcodes` — Get QR codes for current user
- `POST /assign-qrcode` — Assign QR code to user
- `PUT /qrcodes/:id` — Update QR code value
- `DELETE /qrcodes/:id` — Soft delete QR code

---

## Database Models

### User
```js
{
  name: String,
  email: String,
  password: String (hashed),
  role: String ("admin" | "user" | "superadmin")
}
```

### QRCode
```js
{
  qrValue: String, // 16-digit unique
  createdBy: ObjectId (ref: users),
  createdAt: Date,
  isActive: Boolean,
  assignedTo: ObjectId (ref: users),
  location: { latitude, longitude, address, timestamp },
  locationHistory: [ { latitude, longitude, address, timestamp } ]
}
```

---

## License

This project is for educational and demonstration purposes. 