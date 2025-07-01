import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, TextField, Button, IconButton, Alert, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiTablePaper, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Grid, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Tooltip from '@mui/material/Tooltip';
import { toPng } from 'html-to-image';

import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [editUserData, setEditUserData] = useState({ name: '', email: '', role: 'user' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('welcome');
  const [admins, setAdmins] = useState([]);
  const svgRefs = useRef([]);

  useEffect(() => {
    const checkRoleAndFetchData = async () => {
      try {
        const roleRes = await axios.get("http://localhost:3001/check-role", { withCredentials: true });
        if (!roleRes.data.role || roleRes.data.role.toLowerCase() !== 'admin') {
          navigate('/home');
          return;
        }
        await fetchUsers();
        await fetchAdmins();
      } catch (err) {
        navigate('/login');
      }
    };
    checkRoleAndFetchData();
  }, [navigate]);
  
  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const response = await axios.get("http://localhost:3001/users", { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users. Please ensure you are logged in as an admin.");
    } finally {
      setUserLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get("http://localhost:3001/admins", { withCredentials: true });
      setAdmins(response.data);
    } catch (error) {
      setAdmins([]);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const response = await axios.get("http://localhost:3001/qrcodes", { withCredentials: true });
      setQrCodes(response.data);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      setError("Failed to fetch QR codes");
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const count = parseInt(inputValue);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    
    if (!selectedUser) {
        alert("Please select a user or 'All Users' to assign QR codes to.");
        return;
    }

    const userSelection = selectedUser; // Capture the selection before state is cleared
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:3001/generate-qrcodes", 
        { count, userId: userSelection }, 
        { withCredentials: true }
      );
      
      const { codes, userCount } = response.data;

      setQrCodes(prevCodes => [...codes, ...prevCodes]);
      setInputValue("");
      setSelectedUser("");

      // Set a descriptive success message
      const generatedCount = codes.length;
      if (userSelection === 'all') {
        setSuccessMessage(`Successfully generated ${generatedCount} QR code(s) for ${userCount} users.`);
      } else {
        const user = users.find(u => u._id === userSelection);
        setSuccessMessage(`Successfully generated ${count} QR code(s) for ${user.name}.`);
      }

    } catch (error) {
      console.error("Error generating QR codes:", error);
      const errorMessage = error.response?.data?.error || "Failed to generate QR codes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllQRCodes = async () => {
    if (window.confirm("Are you sure you want to delete ALL QR codes from the system? This cannot be undone.")) {
        setLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            const response = await axios.delete("http://localhost:3001/qrcodes-all", { withCredentials: true });
            setSuccessMessage(response.data.message);
            setQrCodes([]); // Clear the local state
        } catch (error) {
            console.error("Error clearing all QR codes:", error);
            setError("Failed to clear all QR codes.");
        } finally {
            setLoading(false);
        }
    }
  };

  const handleUpdateQR = async (qrCodeId, newValue) => {
    try {
      await axios.put(`http://localhost:3001/qrcodes/${qrCodeId}`, 
        { qrValue: newValue }, 
        { withCredentials: true }
      );
      
      // Update local state
      setQrCodes(prevCodes => 
        prevCodes.map(code => 
          code._id === qrCodeId ? { ...code, qrValue: newValue } : code
        )
      );
      
      setEditIdx(null);
      setEditValue("");
    } catch (error) {
      console.error("Error updating QR code:", error);
      alert("Failed to update QR code");
    }
  };

  const handleDeleteQR = async (qrCodeId) => {
    try {
      await axios.delete(`http://localhost:3001/qrcodes/${qrCodeId}`, 
        { withCredentials: true }
      );
      
      // Remove from local state
      setQrCodes(prevCodes => prevCodes.filter(code => code._id !== qrCodeId));
    } catch (error) {
      console.error("Error deleting QR code:", error);
      alert("Failed to delete QR code");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.post('http://localhost:3001/add-user', userForm, { withCredentials: true });
      setAddUserOpen(false);
      setUserForm({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
      setSuccessMessage('User added successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditUserDialog = (user) => {
    setSelectedUser(user._id);
    setEditUserData({ name: user.name, email: user.email, role: user.role });
    setEditUserOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`http://localhost:3001/edit-user/${selectedUser}`, editUserData, { withCredentials: true });
      setEditUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
      setSuccessMessage('User updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteUserDialog = (user) => {
    setSelectedUser(user._id);
    setDeleteUserOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/delete-user/${userId}`, { withCredentials: true });
      setDeleteUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
      setSuccessMessage('User deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Example: Replace these with your actual state/data
  const totalUsers = users ? users.length : 0;
  const totalAdmins = admins ? admins.length : 0;
  const totalQRCodes = qrCodes ? qrCodes.length : 0;
  const activeQRCodes = qrCodes ? qrCodes.filter(qr => qr.isActive).length : 0;
  const inactiveQRCodes = qrCodes ? qrCodes.filter(qr => !qr.isActive).length : 0;
  const pendingRequests = 0; // Update if you implement a requests system

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: <GroupIcon />,
      color: '#1976d2'
    },
    {
      label: 'Total Admins',
      value: totalAdmins,
      icon: <PersonIcon />,
      color: '#43a047'
    },
    {
      label: 'Total QR Codes',
      value: totalQRCodes,
      icon: <QrCode2Icon />,
      color: '#fbc02d'
    },
    {
      label: 'Active QRs',
      value: activeQRCodes,
      icon: <CheckCircleIcon />,
      color: '#388e3c'
    },
    {
      label: 'Inactive QRs',
      value: inactiveQRCodes,
      icon: <CancelIcon />,
      color: '#e53935'
    }
  ];

  return (
    <>
      {/* Top bar - full width */}
      <AppBar position="static" sx={{ bgcolor: '#333', width: '100vw', left: 0 }}>
        <Toolbar>
          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, mr: 3 }}>
            AddWise Hub
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mr: 3 }}>
            Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            color={selectedSection === 'qrcodes' ? "secondary" : "primary"}
            startIcon={<QrCode2Icon />}
            sx={{ mr: 2, fontWeight: 700 }}
            onClick={() => setSelectedSection('qrcodes')}
          >
            QR Devices
          </Button>
          <Button
            variant="contained"
            color={selectedSection === 'usermgmt' ? "secondary" : "primary"}
            sx={{ mr: 2, fontWeight: 700 }}
            onClick={() => setSelectedSection('usermgmt')}
          >
            User Management
          </Button>
          <IconButton color="inherit" onClick={() => navigate('/home', { state: { user: { name: 'Admin', role: 'admin' } } })} sx={{ mr: 2 }}>
            <HomeIcon />
          </IconButton>
          <Button
            variant="contained"
            color="error"
            sx={{ fontWeight: 700 }}
            onClick={async () => {
              try {
                await axios.post('http://localhost:3001/logout', {}, { withCredentials: true });
                if (typeof setIsLoggedIn === 'function') setIsLoggedIn(false);
                navigate('/login');
              } catch (err) {
                navigate('/login');
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'linear-gradient(135deg, #1746a2 0%, #5f8fff 100%)',
          py: 6,
          px: { xs: 1, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Admin Insights Summary Section */}
        <Box sx={{ mb: 4, width: '100%', maxWidth: 1200 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#1746a2', letterSpacing: 1 }}>
            Admin Insights
          </Typography>
          <Grid container spacing={3}>
            {stats.map((stat, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={stat.label}>
                <MuiTablePaper
                  elevation={4}
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 3,
                    bgcolor: '#f9fafd',
                    boxShadow: 6,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.03)',
                      boxShadow: 12,
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48, mb: 1 }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#222' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>
                    {stat.label}
                  </Typography>
                </MuiTablePaper>
              </Grid>
            ))}
          </Grid>
        </Box>
        {/* Welcome Card (default) */}
        {selectedSection === 'welcome' && (
          <Box sx={{ width: '100%', maxWidth: 600, mb: 4 }}>
            <MuiTablePaper elevation={6} sx={{ p: 4, borderRadius: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.97)' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  bgcolor: '#1976d2',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  mb: 2,
                  fontWeight: 700,
                  boxShadow: 2,
                }}>
                  A
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Welcome, Admin!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage QR codes and users from your dashboard.
                </Typography>
              </Box>
            </MuiTablePaper>
          </Box>
        )}
        {/* QR Codes Section */}
        {selectedSection === 'qrcodes' && (
          <Box sx={{ width: '100%', maxWidth: 1200, mb: 6 }}>
            <MuiTablePaper elevation={4} sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.97)' }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#1746a2', fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}>
                QR Codes ({qrCodes.length})
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
                gap: 3,
                justifyContent: 'center',
              }}>
                {qrCodes.map((qrCode, idx) => {
                  const handleDownloadQR = async () => {
                    const svg = svgRefs.current[idx];
                    if (!svg) return;
                    try {
                      const dataUrl = await toPng(svg, { backgroundColor: '#fff' });
                      const link = document.createElement('a');
                      link.href = dataUrl;
                      link.download = `QRCode_${qrCode.qrValue}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (err) {
                      alert('Failed to download QR code as PNG.');
                    }
                  };
                  return (
                    <MuiTablePaper key={qrCode._id} elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center', minWidth: 220, maxWidth: 300, mx: 'auto' }}>
                      <div>
                        <QRCodeSVG ref={el => svgRefs.current[idx] = el} value={qrCode.qrValue} size={100} bgColor="#fff" />
                      </div>
                      {editIdx === idx ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            style={{ marginTop: 8, fontSize: '1rem', width: '90%' }}
                          />
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleUpdateQR(qrCode._id, editValue)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              color="inherit"
                              size="small"
                              onClick={() => {
                                setEditIdx(null);
                                setEditValue("");
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontWeight: 600 }}>{qrCode.qrValue}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            Assigned to: {qrCode.createdBy ? `${qrCode.createdBy.name} (${qrCode.createdBy.email})` : 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Download QR Code (PNG)">
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={handleDownloadQR}
                              >
                                Download QR Code
                              </Button>
                            </Tooltip>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => {
                                setEditIdx(idx);
                                setEditValue(qrCode.qrValue);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteQR(qrCode._id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </>
                      )}
                    </MuiTablePaper>
                  );
                })}
              </Box>
            </MuiTablePaper>
          </Box>
        )}
        {/* User Management Section */}
        {selectedSection === 'usermgmt' && (
          <Box sx={{ width: '100%', maxWidth: 900, mb: 4 }}>
            <MuiTablePaper elevation={4} sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.97)' }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#1746a2', fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}>
                User Management
              </Typography>
              <Button variant="contained" color="success" sx={{ mb: 2 }} onClick={() => setAddUserOpen(true)}>
                Add User
              </Button>
              <TableContainer component={MuiTablePaper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userLoading ? (
                      <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                    ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No users found.</TableCell></TableRow>
                    ) : users.map(user => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => openEditUserDialog(user)}>Edit</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => openDeleteUserDialog(user)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MuiTablePaper>
          </Box>
        )}
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 600 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2, width: '100%', maxWidth: 600 }} onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        )}
        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteUserOpen} onClose={() => setDeleteUserOpen(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this user?</Typography>
            {selectedUser && (
              <Typography sx={{ mt: 1, fontWeight: 600 }}>
                {users.find(u => u._id === selectedUser)?.name} ({users.find(u => u._id === selectedUser)?.email})
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteUserOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button onClick={() => handleDeleteUser(selectedUser)} color="error" variant="contained" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Add User Dialog */}
        <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)}>
          <DialogTitle>Add User</DialogTitle>
          <form onSubmit={handleAddUser}>
            <DialogContent sx={{ minWidth: 320 }}>
              <TextField
                label="Name"
                value={userForm.name}
                onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                type="email"
                value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                value={userForm.password}
                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Role"
                value={userForm.role}
                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddUserOpen(false)} disabled={editLoading}>Cancel</Button>
              <Button type="submit" variant="contained" color="success" disabled={editLoading}>
                {editLoading ? 'Adding...' : 'Add User'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)}>
          <DialogTitle>Edit User</DialogTitle>
          <form onSubmit={handleEditUser}>
            <DialogContent sx={{ minWidth: 320 }}>
              <TextField
                label="Name"
                value={editUserData.name}
                onChange={e => setEditUserData({ ...editUserData, name: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                type="email"
                value={editUserData.email}
                onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Role"
                value={editUserData.role}
                onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditUserOpen(false)} disabled={editLoading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </>
  );
};

export default AdminDashboard;
