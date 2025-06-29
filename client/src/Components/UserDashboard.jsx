import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, IconButton, Alert, Card, CardContent, Grid, Paper, Chip, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Divider, Fade, TextField, CircularProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import ListItemButton from '@mui/material/ListItemButton';

import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const drawerWidth = 220;

const UserDashboard = ({ user, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          <ListItemButton selected={selectedSection === 'qrcodes'} onClick={() => setSelectedSection('qrcodes')} sx={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', px: 2 }}>
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
              <Button variant="contained" color="primary" fullWidth sx={{ fontWeight: 600, letterSpacing: 1, py: 1, fontSize: '1.1rem', borderRadius: 2 }}>
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
                  <Typography variant="body2" color="text.secondary">
                    QR codes will appear here once they are generated by an administrator.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ width: '100%', maxWidth: 1200, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#fff', textAlign: 'center', fontWeight: 600, letterSpacing: 1 }}>
                  Your QR Codes ({qrCodes.length})
                </Typography>
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
                        {/* Show created date */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, textAlign: "center" }}
                        >
                          Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserDashboard; 