import { React, useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import { Navbar } from "./Components/Navbar";
import AdminDashboard from "./Components/AdminDashboard";
import UserDashboard from "./Components/UserDashboard";
import SuperAdminDashboard from "./Components/SuperAdminDashboard";
// import ProtectedRoute from "./Components/ProtectedRoute";
import axios from "axios";
import { Box } from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const showNavbar = !['/login', '/signup'].includes(location.pathname);
  const featuresRef = useRef(null);

  useEffect(() => {
      axios.get('http://localhost:3001/user', { withCredentials: true })
          .then(response => {
              if (response.data.user) {
                  setUser(response.data.user);
              } else {
                  setUser(null);
              }
          })
          .catch(() => setUser(null));
  }, []);

  const handleFeaturesClick = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'rgb(18, 68, 185)' }}>
          {showNavbar && <Navbar isLoggedIn={!!user} setIsLoggedIn={() => setUser(null)} onFeaturesClick={handleFeaturesClick} />}
          <Box 
              component="main" 
              sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start', // Align content to the top
                  py: 4 // Add some padding
              }}
          >
              <Routes>
                  <Route path="/" element={<Home featuresRef={featuresRef} />} />
                  <Route path="/home" element={<Home featuresRef={featuresRef} />} />
                  <Route path="/super-admin-dashboard" element={<SuperAdminDashboard setIsLoggedIn={() => setUser(null)} />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard setIsLoggedIn={() => setUser(null)} />} />
                  <Route path="/user-dashboard" element={<UserDashboard user={user} setIsLoggedIn={() => setUser(null)} />} />
                  <Route path="/login" element={!user ? <Login setUser={setUser} /> : user.role === 'superadmin' ? <Navigate to="/super-admin-dashboard" /> : user.role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/user-dashboard" />} />
                  <Route path="/signup" element={!user ? <Signup setUser={setUser} /> : user.role === 'superadmin' ? <Navigate to="/super-admin-dashboard" /> : user.role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/user-dashboard" />} />
              </Routes>
          </Box>
      </Box>
  );
}

export default App;
