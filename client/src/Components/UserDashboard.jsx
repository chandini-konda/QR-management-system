import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, IconButton, Alert, Card, CardContent, Grid, Paper, Chip, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Divider, Fade, TextField, CircularProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import ListItemButton from '@mui/material/ListItemButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from './QRScanner';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import { DialogActions, MenuItem } from '@mui/material';
import dayjs from 'dayjs';

// NOTE: If you haven't already, run:
// npm install @mui/x-date-pickers dayjs

const drawerWidth = 220;

const GEOAPIFY_API_KEY = '569ad80a20494ff8940773beaf92b414';

const UserDashboard = ({ user, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [trackModalOpen, setTrackModalOpen] = useState(null); // 'live' or 'route'
  const [selectedQR, setSelectedQR] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterQR, setFilterQR] = useState('');
  const [filterStart, setFilterStart] = useState(null);
  const [filterEnd, setFilterEnd] = useState(null);
  const [filteredRoute, setFilteredRoute] = useState([]);
  const [filterError, setFilterError] = useState('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState('');
  const [editProfileSuccess, setEditProfileSuccess] = useState('');

  useEffect(() => {
    // Check if user is logged in
    axios.get("http://localhost:3001/check-role", { withCredentials: true })
      .then(res => {
        if (!res.data.role) {
          navigate('/login');
        } else if (res.data.role.toLowerCase() === 'admin') {
          navigate('/admin-dashboard');
        } else {
          // Fetch user's QR codes
          fetchUserQRCodes();
        }
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const fetchUserQRCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/user-qrcodes", { withCredentials: true });
      setQrCodes(response.data);
    } catch (error) {
      console.error("Error fetching user QR codes:", error);
      setError("Failed to fetch your QR codes");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    axios.post("http://localhost:3001/logout", {}, { withCredentials: true })
      .finally(() => {
        setIsLoggedIn(false);
        navigate('/login');
      });
  };

  const handleDeleteQR = async (qrId) => {
    try {
      await axios.delete(`http://localhost:3001/qrcode/${qrId}`, { withCredentials: true });
      fetchUserQRCodes();
    } catch (error) {
      console.error("Error deleting QR code:", error);
      setError("Failed to delete QR code. Please try again.");
    }
  };

  const handleAddDevice = () => {
    setScannerOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleQRScanSuccess = async (qrValue) => {
    try {
      setAssigningDevice(true);
      setScannerOpen(false);

      // 1. Get user location
      const getLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser.'));
        } else {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => reject(error)
          );
        }
      });

      let location = null;
      try {
        const coords = await getLocation();
        // 2. Reverse geocode using Geoapify
        const geoRes = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${GEOAPIFY_API_KEY}`);
        const address = geoRes.data.features?.[0]?.properties?.formatted || '';
        location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address
        };
      } catch (geoError) {
        // If location fails, continue without address
        location = null;
        console.error('Location error:', geoError);
      }

      // 3. Assign QR code with location
      const response = await axios.post(
        "http://localhost:3001/assign-qrcode",
        { qrValue, location },
        { withCredentials: true }
      );

      // Refresh the QR codes list
      await fetchUserQRCodes();

      // Show success message
      setError(""); // Clear any previous errors
      setSuccessMessage("Device successfully added!");

    } catch (error) {
      console.error("Error assigning QR code:", error);
      setError(error.response?.data?.error || "Failed to assign device. Please try again.");
      setSuccessMessage(""); // Clear success message on error
    } finally {
      setAssigningDevice(false);
    }
  };

  const handleScannerClose = () => {
    setScannerOpen(false);
    setError("");
    setSuccessMessage("");
  };

  // Helper: get filtered route points
  const handleApplyFilter = () => {
    setFilterError('');
    if (!filterQR || !filterStart || !filterEnd) {
      setFilterError('Please select QR code and both dates.');
      setFilteredRoute([]);
      return;
    }
    const qr = qrCodes.find(q => q.qrValue === filterQR);
    if (!qr) {
      setFilterError('QR code not found.');
      setFilteredRoute([]);
      return;
    }
    const start = new Date(filterStart);
    const end = new Date(filterEnd);
    end.setHours(23, 59, 59, 999); // inclusive end of day
    // Filter locationHistory
    let routePoints = (qr.locationHistory || []).filter(pt => {
      if (!pt.timestamp) return false;
      const t = new Date(pt.timestamp);
      return t >= start && t <= end;
    }).map(pt => ({ ...pt, _isCurrent: false }));
    // Optionally include current location if timestamp is in range
    if (qr.location && qr.location.timestamp) {
      const t = new Date(qr.location.timestamp);
      if (t >= start && t <= end) {
        routePoints.push({ ...qr.location, _isCurrent: true });
      }
    }
    setFilteredRoute(routePoints);
    if (routePoints.length < 2) {
      setFilterError('Not enough route points in selected range.');
    }
  };

  const carIcon = L.icon({
    iconUrl: '/car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#1746a2' }}>
      {/* Top Navbar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#333' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge="start"
            sx={{ mr: 2, display: { sm: 'block' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AddWise Hub
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/home', { state: { user } })}
            sx={{ mr: 2 }}
          >
            Home
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? drawerWidth : 60,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          [`& .MuiDrawer-paper`]: {
            width: sidebarOpen ? drawerWidth : 60,
            transition: 'width 0.3s',
            boxSizing: 'border-box',
            bgcolor: '#f5f6fa',
            borderRight: '1px solid #e0e0e0',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton selected={selectedSection === 'profile'} onClick={() => setSelectedSection('profile')} sx={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', px: 2 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><AccountCircleIcon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Profile" />}
          </ListItemButton>
          <ListItemButton selected={selectedSection === 'qrcodes'} onClick={() => { setSelectedSection('qrcodes'); setSuccessMessage(""); }} sx={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', px: 2 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><QrCode2Icon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="QR Codes" />}
          </ListItemButton>
          <ListItemButton selected={selectedSection === 'settings'} onClick={() => setSelectedSection('settings')} sx={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', px: 2 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><SettingsIcon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Settings" />}
          </ListItemButton>
        </List>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {selectedSection === 'profile' && (
          <Fade in={true} timeout={600}>
            <Paper elevation={4} sx={{
              p: { xs: 3, sm: 5 },
              mb: 4,
              width: '100%',
              maxWidth: 600,
              mx: 'auto',
              mt: 8,
              borderRadius: 5,
              boxShadow: 6,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-6px) scale(1.02)',
                boxShadow: 12,
              },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: '#f9fafd',
            }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#1976d2', mb: 2, fontSize: 40 }}>
                {user?.name ? user.name[0].toUpperCase() : '?'}
              </Avatar>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, letterSpacing: 1, color: '#222' }}>
                Profile Information
              </Typography>
              <Divider sx={{ width: '100%', mb: 3 }} />
              <Box sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 120 }}>Username:</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#222' }}>{user?.name || '-'}</Typography>
              </Box>
              <Box sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 120 }}>Email:</Typography>
                <Typography sx={{ fontWeight: 500, fontSize: '1.1rem', color: '#1976d2', wordBreak: 'break-all' }}>{user?.email || '-'}</Typography>
              </Box>
              <Box sx={{ width: '100%', mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Typography sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 120 }}>Role:</Typography>
                <Chip label={user?.role || '-'} color={user?.role === 'admin' ? 'primary' : 'success'} size="medium" sx={{ fontWeight: 600, fontSize: '1rem', textTransform: 'capitalize' }} />
              </Box>
              <Button variant="contained" color="primary" fullWidth sx={{ fontWeight: 600, letterSpacing: 1, py: 1, fontSize: '1.1rem', borderRadius: 2 }} onClick={() => setEditProfileOpen(true)}>
                Edit Profile
              </Button>
            </Paper>
          </Fade>
        )}
        {selectedSection === 'qrcodes' && (
          <Box
            sx={{
              minHeight: 'calc(100vh - 64px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'linear-gradient(135deg, #1746a2 0%, #5f8fff 100%)',
              py: 6,
            }}
          >
            {/* Add Filter Route button here */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AltRouteIcon />}
              sx={{ mb: 2, fontWeight: 600, bgcolor: '#1976d2', color: '#fff', alignSelf: 'flex-start' }}
              onClick={() => setFilterModalOpen(true)}
            >
              Filter Route
            </Button>
            <Card
              sx={{
                mb: 4,
                px: 5,
                py: 4,
                minWidth: 340,
                maxWidth: 500,
                borderRadius: 4,
                boxShadow: 6,
                textAlign: 'center',
                bgcolor: 'rgba(255,255,255,0.95)',
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: '#1976d2',
                  mx: 'auto',
                  mb: 2,
                  fontSize: 32,
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : '?'}
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome, {user ? user.name : ''}!
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                Here you can view your QR codes and manage your account.
              </Typography>
            </Card>

            {error && (
              <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
                {successMessage}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography>Loading your QR codes...</Typography>
              </Box>
            ) : qrCodes.length === 0 ? (
              <Card sx={{ maxWidth: 500, minWidth: 340, mx: 'auto', mt: 2, borderRadius: 4, boxShadow: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.97)' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <QrCode2Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No QR Codes Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    QR codes will appear here once they are generated by an administrator.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddDevice}
                    disabled={assigningDevice}
                    sx={{ fontWeight: 600 }}
                  >
                    {assigningDevice ? 'Adding Device...' : 'Add Device'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ width: '100%', maxWidth: 1200, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, letterSpacing: 1 }}>
                    Your QR Codes ({qrCodes.length})
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddDevice}
                    disabled={assigningDevice}
                    sx={{ 
                      fontWeight: 600,
                      bgcolor: '#fff',
                      color: '#1976d2',
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    {assigningDevice ? 'Adding Device...' : 'Add Device'}
                  </Button>
                </Box>
                <Grid container columns={12} spacing={3} justifyContent="center">
                  {qrCodes.map((qrCode, idx) => (
                    <Grid key={qrCode._id} item xs={12} sm={6} md={4} lg={3}>
                      <Card
                        sx={{
                          p: 3,
                          mb: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          borderRadius: 3,
                          boxShadow: 4,
                          bgcolor: "#fff",
                          minHeight: 260,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                          '&:hover': { boxShadow: 8 }
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 1, color: "#1976d2" }}
                        >
                          QR Code #{qrCodes.length - idx}
                        </Typography>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "#f5f5f5",
                            borderRadius: 2,
                            mb: 2,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <QRCodeSVG value={qrCode.qrValue} size={120} bgColor="#fff" level="M" />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.95rem",
                            wordBreak: "break-all",
                            mb: 1,
                          }}
                        >
                          {qrCode.qrValue}
                        </Typography>
                        {/* Show assigned date */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, textAlign: "center" }}
                        >
                          {`Assigned on: ${new Date(qrCode.assignedAt || qrCode.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                          })} (IST)`}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => { setSelectedQR(qrCode); setTrackModalOpen('live'); }}
                            sx={{ fontWeight: 600 }}
                          >
                            Track Now
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AltRouteIcon />}
                            onClick={() => { setSelectedQR(qrCode); setTrackModalOpen('route'); }}
                            sx={{ fontWeight: 600 }}
                          >
                            Show Path
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Box>
      
      {/* QR Scanner Dialog */}
      <QRScanner
        open={scannerOpen}
        onClose={handleScannerClose}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Live Location Tracking Modal */}
      <Dialog open={trackModalOpen === 'live'} onClose={() => setTrackModalOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Live Location Tracking
          <IconButton
            aria-label="close"
            onClick={() => setTrackModalOpen(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <LiveLocationMap />
        </DialogContent>
      </Dialog>

      {/* QR Route Modal */}
      <Dialog open={trackModalOpen === 'route'} onClose={() => setTrackModalOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          QR Route
          <IconButton
            aria-label="close"
            onClick={() => setTrackModalOpen(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedQR && (() => {
            // Merge locationHistory and location into routePoints
            const history = Array.isArray(selectedQR.locationHistory) ? selectedQR.locationHistory : [];
            const currentLoc = selectedQR.location && typeof selectedQR.location.latitude === 'number' && typeof selectedQR.location.longitude === 'number'
              ? [{ latitude: selectedQR.location.latitude, longitude: selectedQR.location.longitude, address: selectedQR.location.address }]
              : [];
            const routePoints = [...history, ...currentLoc];
            if (routePoints.length < 2) {
              return (
                <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No route data found for this QR code.
                  </Typography>
                </Box>
              );
            }
            return (
              <Box sx={{ width: '100%', height: 400 }}>
                <MapContainer
                  center={[routePoints[0].latitude, routePoints[0].longitude]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {/* Polyline for the route */}
                  <Polyline positions={routePoints.map(pt => [pt.latitude, pt.longitude])} color="blue" />
                  {/* Markers for all points except the last */}
                  {routePoints.slice(0, -1).map((pt, idx) => (
                    <Marker key={idx} position={[pt.latitude, pt.longitude]} icon={carIcon}>
                      <Popup>
                        {pt.address || `${pt.latitude}, ${pt.longitude}`}
                      </Popup>
                    </Marker>
                  ))}
                  {/* Marker for the current location (last point) */}
                  <Marker position={[routePoints[routePoints.length-1].latitude, routePoints[routePoints.length-1].longitude]} icon={carIcon}>
                    <Popup>
                      Current Location<br />
                      {routePoints[routePoints.length-1].address || `${routePoints[routePoints.length-1].latitude}, ${routePoints[routePoints.length-1].longitude}`}
                    </Popup>
                  </Marker>
                </MapContainer>
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Filter Route Modal */}
      <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Filter QR Route
          <IconButton
            aria-label="close"
            onClick={() => setFilterModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 2 }}>
            <TextField
              select
              label="QR Code"
              value={filterQR}
              onChange={e => setFilterQR(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              {qrCodes.map(qr => (
                <MenuItem key={qr.qrValue} value={qr.qrValue}>{qr.qrValue}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filterStart || ''}
              onChange={e => setFilterStart(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filterEnd || ''}
              onChange={e => setFilterEnd(e.target.value)}
              sx={{ minWidth: 180 }}
            />
          </Box>
          <DialogActions sx={{ mb: 2 }}>
            <Button onClick={handleApplyFilter} variant="contained" color="success" startIcon={<AltRouteIcon />}>Apply Filter</Button>
            <Button onClick={() => setFilterModalOpen(false)} variant="outlined">Close</Button>
          </DialogActions>
          {filterError && <Alert severity="warning" sx={{ mb: 2 }}>{filterError}</Alert>}
          {/* Map Preview */}
          <Box sx={{ width: '100%', height: 400, mt: 1 }}>
            {filteredRoute.length >= 2 ? (
              <MapContainer
                center={[filteredRoute[0].latitude, filteredRoute[0].longitude]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Polyline positions={filteredRoute.map(pt => [pt.latitude, pt.longitude])} color="red" />
                {filteredRoute.map((pt, idx) => (
                  <Marker key={idx} position={[pt.latitude, pt.longitude]} icon={carIcon}>
                    <Popup>
                      <div>
                        <div>{pt.address || `${pt.latitude}, ${pt.longitude}`}</div>
                        <div>{pt.timestamp ? new Date(pt.timestamp).toLocaleString() : ''}</div>
                        {pt._isCurrent && <div><b>(Current Location)</b></div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {filterError || 'Select QR code and date range to preview route.'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          {editProfileError && <Alert severity="error" sx={{ mb: 2 }}>{editProfileError}</Alert>}
          {editProfileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{editProfileSuccess}</Alert>}
          <TextField
            label="Username"
            value={editProfileData.name}
            onChange={e => setEditProfileData({ ...editProfileData, name: e.target.value })}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            type="email"
            value={editProfileData.email}
            onChange={e => setEditProfileData({ ...editProfileData, email: e.target.value })}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            type="password"
            value={editProfileData.password}
            onChange={e => setEditProfileData({ ...editProfileData, password: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Leave blank to keep current password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileOpen(false)} disabled={editProfileLoading}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={editProfileLoading}
            onClick={async () => {
              setEditProfileLoading(true);
              setEditProfileError('');
              setEditProfileSuccess('');
              try {
                const payload = { name: editProfileData.name, email: editProfileData.email };
                if (editProfileData.password) payload.password = editProfileData.password;
                const res = await axios.put('http://localhost:3001/edit-profile', payload, { withCredentials: true });
                setEditProfileSuccess('Profile updated successfully!');
                setEditProfileError('');
                setEditProfileOpen(false);
                // Update user state in parent if possible
                if (user) {
                  user.name = editProfileData.name;
                  user.email = editProfileData.email;
                }
              } catch (err) {
                setEditProfileError(err.response?.data?.error || 'Failed to update profile');
              } finally {
                setEditProfileLoading(false);
              }
            }}
          >
            {editProfileLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard; 

// LiveLocationMap component
function LiveLocationMap() {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        }
      );
    }
  }, []);

  const carIcon = L.icon({
    iconUrl: '/car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  if (!userLocation) return <Typography>Getting your live location...</Typography>;

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={carIcon} />
      </MapContainer>
      <Typography sx={{ mt: 2 }}>
        <b>Latitude:</b> {userLocation.latitude} <b>Longitude:</b> {userLocation.longitude}
      </Typography>
      <Typography>Location updated!</Typography>
    </Box>
  );
} 