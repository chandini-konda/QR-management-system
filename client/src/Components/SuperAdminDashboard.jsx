import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Divider, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, List, ListItem, ListItemText, CircularProgress, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiTablePaper, Drawer, ListItemIcon, Toolbar, AppBar, IconButton } from '@mui/material';
import axios from 'axios';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import GroupIcon from '@mui/icons-material/Group';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MenuIcon from '@mui/icons-material/Menu';
import AdbIcon from '@mui/icons-material/Adb';
import { useNavigate } from 'react-router-dom';

function SuperAdminDashboard({ user, setIsLoggedIn }) {
  // State for Add Admin dialog
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [deleteAdminOpen, setDeleteAdminOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userLoading, setUserLoading] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ name: '', email: '', role: 'user' });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generateQROpen, setGenerateQROpen] = useState(false);
  const [qrUser, setQrUser] = useState('all');
  const [qrCount, setQrCount] = useState(1);
  const [qrUsers, setQrUsers] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  // Add state for QR Assignment dialogs
  const [viewQRAssignmentsOpen, setViewQRAssignmentsOpen] = useState(false);
  const [manageQRAssignmentsOpen, setManageQRAssignmentsOpen] = useState(false);
  const [qrAssignments, setQRAssignments] = useState([]);
  const [qrAssignmentsLoading, setQRAssignmentsLoading] = useState(false);
  const [qrAssignmentsError, setQRAssignmentsError] = useState("");
  // Add state for Manage QR Assignments dialog
  const [manageQRCodes, setManageQRCodes] = useState([]);
  const [manageUsers, setManageUsers] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState("");
  const [manageSavingId, setManageSavingId] = useState(null);
  const [manageSuccess, setManageSuccess] = useState("");
  const [qrManagementCodes, setQrManagementCodes] = useState([]);
  const [qrManagementLoading, setQrManagementLoading] = useState(false);
  const [qrDeleteDialogOpen, setQrDeleteDialogOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);
  const [qrDeleteLoading, setQrDeleteLoading] = useState(false);
  const [qrDeleteError, setQrDeleteError] = useState("");
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState("");
  const [deleteAllSuccess, setDeleteAllSuccess] = useState("");
  const [showQRManagement, setShowQRManagement] = useState(false);
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const drawerWidth = 220;
  const navigate = useNavigate();

  // Always show dashboard section on mount
  useEffect(() => {
    setSelectedSection('dashboard');
  }, []);

  // Fetch QR assignments when dialog opens
  useEffect(() => {
    if (viewQRAssignmentsOpen) {
      setQRAssignmentsLoading(true);
      setQRAssignmentsError("");
      axios.get('http://localhost:3001/qrcodes', { withCredentials: true })
        .then(res => {
          setQRAssignments(res.data);
        })
        .catch(err => {
          setQRAssignmentsError(err.response?.data?.error || 'Failed to load QR assignments');
        })
        .finally(() => setQRAssignmentsLoading(false));
    }
  }, [viewQRAssignmentsOpen]);

  // Fetch QR codes and users when Manage dialog opens
  useEffect(() => {
    if (manageQRAssignmentsOpen) {
      setManageLoading(true);
      setManageError("");
      setManageSuccess("");
      Promise.all([
        axios.get('http://localhost:3001/qrcodes', { withCredentials: true }),
        axios.get('http://localhost:3001/users', { withCredentials: true })
      ])
        .then(([qrRes, userRes]) => {
          setManageQRCodes(qrRes.data);
          setManageUsers(userRes.data);
        })
        .catch(err => {
          setManageError('Failed to load QR codes or users');
        })
        .finally(() => setManageLoading(false));
    }
  }, [manageQRAssignmentsOpen]);

  // Fetch all QR codes for management
  const fetchQrManagementCodes = async () => {
    setQrManagementLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/qrcodes', { withCredentials: true });
      setQrManagementCodes(res.data);
    } catch (err) {
      setQrManagementCodes([]);
    } finally {
      setQrManagementLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchQrManagementCodes();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/add-admin', {
        name: adminName,
        email: adminEmail,
        password: adminPassword
      }, { withCredentials: true });
      setSnackbar({ open: true, message: 'Admin added successfully!', severity: 'success' });
      setAddAdminOpen(false);
      setAdminName(''); setAdminEmail(''); setAdminPassword('');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add admin', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteAdminDialog = async () => {
    setDeleteAdminOpen(true);
    setLoadingAdmins(true);
    try {
      const res = await axios.get('http://localhost:3001/admins', { withCredentials: true });
      setAdmins(res.data.filter(a => a.email !== user?.email)); // Exclude self
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load admins', severity: 'error' });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3001/delete-admin/${selectedAdmin}`, { withCredentials: true });
      setSnackbar({ open: true, message: 'Admin deleted successfully!', severity: 'success' });
      setAdmins(admins.filter(a => a._id !== selectedAdmin));
      setSelectedAdmin(null);
      setDeleteAdminOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete admin', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    try {
      await axios.post('http://localhost:3001/add-user', {
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole
      }, { withCredentials: true });
      setSnackbar({ open: true, message: 'User added successfully!', severity: 'success' });
      setAddUserOpen(false);
      setUserName(''); setUserEmail(''); setUserPassword(''); setUserRole('user');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add user', severity: 'error' });
    } finally {
      setUserLoading(false);
    }
  };

  const openEditUserDialog = async () => {
    setEditUserOpen(true);
    setLoadingUsers(true);
    try {
      const res = await axios.get('http://localhost:3001/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const openDeleteUserDialog = async () => {
    setDeleteUserOpen(true);
    setLoadingUsers(true);
    try {
      const res = await axios.get('http://localhost:3001/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUserToEdit = (user) => {
    setSelectedUser(user._id);
    setEditUserData({ name: user.name, email: user.email, role: user.role });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`http://localhost:3001/edit-user/${selectedUser}`, editUserData, { withCredentials: true });
      setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
      setEditUserOpen(false);
      setSelectedUser(null);
      setEditUserData({ name: '', email: '', role: 'user' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to update user', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleSelectUserToDelete = (user) => {
    setSelectedUser(user._id);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/delete-user/${selectedUser}`, { withCredentials: true });
      setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'success' });
      setDeleteUserOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete user', severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openGenerateQRDialog = async () => {
    setGenerateQROpen(true);
    setQrLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/users', { withCredentials: true });
      setQrUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setQrLoading(false);
    }
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setQrLoading(true);
    try {
      await axios.post('http://localhost:3001/generate-qrcodes', {
        count: qrCount,
        userId: qrUser
      }, { withCredentials: true });
      setSnackbar({ open: true, message: 'QR codes generated successfully!', severity: 'success' });
      setGenerateQROpen(false);
      setQrUser('all'); setQrCount(1);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to generate QR codes', severity: 'error' });
    } finally {
      setQrLoading(false);
    }
  };

  // Handle assignment change
  const handleAssignmentChange = (qrId, newUserId) => {
    setManageSavingId(qrId);
    axios.put(`http://localhost:3001/qrcodes/${qrId}`, { qrValue: undefined, createdBy: newUserId }, { withCredentials: true })
      .then(res => {
        setManageQRCodes(prev => prev.map(qr => qr._id === qrId ? { ...qr, createdBy: manageUsers.find(u => u._id === newUserId) } : qr));
        setManageSuccess('Assignment updated successfully');
      })
      .catch(err => {
        setManageError('Failed to update assignment');
      })
      .finally(() => setManageSavingId(null));
  };

  const openQrDeleteDialog = (qr) => {
    setQrToDelete(qr);
    setQrDeleteDialogOpen(true);
    setQrDeleteError("");
  };

  const handleQrDelete = async () => {
    if (!qrToDelete) return;
    setQrDeleteLoading(true);
    setQrDeleteError("");
    try {
      await axios.delete(`http://localhost:3001/qrcodes/${qrToDelete._id}`, { withCredentials: true });
      setQrDeleteDialogOpen(false);
      setQrToDelete(null);
      fetchQrManagementCodes();
    } catch (err) {
      setQrDeleteError('Failed to delete QR code.');
    } finally {
      setQrDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#1746a2' }}>
      {/* AppBar: Only one, with branding */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#333' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            AddWise Hub
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 2, fontWeight: 700 }}
            onClick={() => navigate('/home')}
          >
            Home
          </Button>
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
                // fallback: still redirect
                navigate('/login');
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {/* Sidebar Drawer: No branding, no extra gap */}
      <Drawer
        variant="permanent"
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
            pt: 0, // Remove any top padding
          },
        }}
      >
        <Toolbar />
        {/* Only navigation, no branding */}
        <List sx={{ pt: 2 }}>
          <ListItem 
            button 
            selected={selectedSection === 'dashboard'} 
            onClick={() => setSelectedSection('dashboard')}
            sx={{ 
              justifyContent: sidebarOpen ? 'flex-start' : 'center', 
              px: 2,
              my: 0.5,
              borderRadius: 2,
              transition: 'background 0.2s',
              ...(selectedSection === 'dashboard' && {
                bgcolor: '#1976d2',
                color: '#fff',
                boxShadow: 2,
                borderLeft: '5px solid #1746a2',
                '& .MuiListItemIcon-root': { color: '#fff' },
              }),
              '&:hover': {
                bgcolor: selectedSection === 'dashboard' ? '#1565c0' : '#e3e8f0',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><DashboardIcon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Dashboard" />}
          </ListItem>
          <ListItem 
            button 
            selected={selectedSection === 'generateqr'} 
            onClick={() => setSelectedSection('generateqr')}
            sx={{ 
              justifyContent: sidebarOpen ? 'flex-start' : 'center', 
              px: 2,
              my: 0.5,
              borderRadius: 2,
              transition: 'background 0.2s',
              ...(selectedSection === 'generateqr' && {
                bgcolor: '#1976d2',
                color: '#fff',
                boxShadow: 2,
                borderLeft: '5px solid #1746a2',
                '& .MuiListItemIcon-root': { color: '#fff' },
              }),
              '&:hover': {
                bgcolor: selectedSection === 'generateqr' ? '#1565c0' : '#e3e8f0',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><QrCode2Icon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Generate QR Code" />}
          </ListItem>
          <ListItem 
            button 
            selected={selectedSection === 'adminmgmt'} 
            onClick={() => setSelectedSection('adminmgmt')}
            sx={{ 
              justifyContent: sidebarOpen ? 'flex-start' : 'center', 
              px: 2,
              my: 0.5,
              borderRadius: 2,
              transition: 'background 0.2s',
              ...(selectedSection === 'adminmgmt' && {
                bgcolor: '#1976d2',
                color: '#fff',
                boxShadow: 2,
                borderLeft: '5px solid #1746a2',
                '& .MuiListItemIcon-root': { color: '#fff' },
              }),
              '&:hover': {
                bgcolor: selectedSection === 'adminmgmt' ? '#1565c0' : '#e3e8f0',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><ManageAccountsIcon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Admin Management" />}
          </ListItem>
          <ListItem 
            button 
            selected={selectedSection === 'qrmgmt'} 
            onClick={() => setSelectedSection('qrmgmt')}
            sx={{ 
              justifyContent: sidebarOpen ? 'flex-start' : 'center', 
              px: 2,
              my: 0.5,
              borderRadius: 2,
              transition: 'background 0.2s',
              ...(selectedSection === 'qrmgmt' && {
                bgcolor: '#1976d2',
                color: '#fff',
                boxShadow: 2,
                borderLeft: '5px solid #1746a2',
                '& .MuiListItemIcon-root': { color: '#fff' },
              }),
              '&:hover': {
                bgcolor: selectedSection === 'qrmgmt' ? '#1565c0' : '#e3e8f0',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: sidebarOpen ? 2 : 'auto', justifyContent: 'center' }}><GroupIcon /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="QR Management" />}
          </ListItem>
        </List>
      </Drawer>
      {/* Main Content: Only offset by AppBar height, no extra containers */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8, width: `calc(100% - ${sidebarOpen ? drawerWidth : 60}px)` }}>
        {/* Dashboard/Overview Section */}
        {selectedSection === 'dashboard' && (
          <Box sx={{ mt: 8, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: { xs: 4, sm: 6 }, borderRadius: 4, width: '100%', maxWidth: 900, bgcolor: 'rgba(255,255,255,0.98)', boxShadow: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#1746a2', letterSpacing: 1 }}>
                Super Admin Dashboard
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, color: '#222', fontWeight: 500 }}>
                Welcome, Super Admin! Here you can manage all aspects of the system.
              </Typography>
              <Divider sx={{ width: '80%', my: 3, mx: 'auto', borderColor: '#e0e0e0' }} />
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.15rem', fontWeight: 400, maxWidth: 700 }}>
                Use the sidebar to navigate between QR code generation, admin management, and QR management features.
              </Typography>
            </Paper>
          </Box>
        )}
        {/* Generate QR Code Section */}
        {selectedSection === 'generateqr' && (
          <Paper elevation={4} sx={{ p: 5, maxWidth: 600, width: '100%', textAlign: 'center', borderRadius: 4, mx: 'auto' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Generate QR Codes</Typography>
            <Button variant="contained" color="primary" fullWidth sx={{ mb: 2 }} onClick={openGenerateQRDialog}>
                Generate QR Code
              </Button>
              <Typography variant="body2" color="text.secondary">
                Only Super Admins can generate QR codes for the system.
              </Typography>
            </Paper>
        )}
        {/* Admin Management Section */}
        {selectedSection === 'adminmgmt' && (
          <Box sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, width: '100%', maxWidth: 420, bgcolor: 'rgba(255,255,255,0.98)', boxShadow: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#1746a2', letterSpacing: 1 }}>
                Admin Management
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                sx={{ mb: 2, py: 1.2, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, boxShadow: 2 }}
                onClick={() => setAddAdminOpen(true)}
              >
                Add Admin
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                fullWidth 
                sx={{ mb: 3, py: 1.2, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, boxShadow: 1, borderWidth: 2 }}
                onClick={openDeleteAdminDialog}
              >
                Delete Admin
              </Button>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: '1rem', fontWeight: 400 }}>
                Super Admins can add or remove admins.
              </Typography>
            </Paper>
          </Box>
        )}
        {/* QR Management Section */}
        {selectedSection === 'qrmgmt' && (
          <Box sx={{ mt: 2, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, width: '100%', maxWidth: 1100, bgcolor: 'rgba(255,255,255,0.98)', boxShadow: 8 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', letterSpacing: 1, color: '#1746a2' }}>
                QR Code Management
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button variant="contained" color="error" sx={{ fontWeight: 700, px: 3, py: 1, borderRadius: 2, fontSize: '1rem' }} onClick={() => setDeleteAllDialogOpen(true)}>
                  Delete All QR Codes
                </Button>
              </Box>
              <TableContainer component={Box} sx={{ borderRadius: 3, overflow: 'auto', boxShadow: 2 }}>
                <Table sx={{ minWidth: 700, borderRadius: 3, overflow: 'hidden' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e3e8f0' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1746a2', borderTopLeftRadius: 12 }}>QR Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1746a2' }}>Assigned User</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1746a2' }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1746a2' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1746a2', borderTopRightRadius: 12 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrManagementLoading ? (
                      <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                    ) : qrManagementCodes.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">No QR codes found.</TableCell></TableRow>
                    ) : qrManagementCodes.map((qr, idx) => (
                      <TableRow key={qr._id} sx={{ bgcolor: idx % 2 === 0 ? '#f7fafd' : '#e9f0fb', transition: 'background 0.2s' }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{qr.qrValue}</TableCell>
                        <TableCell>{qr.createdBy ? `${qr.createdBy.name} (${qr.createdBy.email})` : <span style={{ color: '#888' }}>Unassigned</span>}</TableCell>
                        <TableCell>{new Date(qr.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 12px',
                            borderRadius: 12,
                            fontWeight: 600,
                            color: qr.isActive ? '#fff' : '#fff',
                            background: qr.isActive ? '#43a047' : '#bdbdbd',
                            fontSize: '0.95rem',
                          }}>{qr.isActive ? 'Active' : 'Inactive'}</span>
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" color="error" sx={{ fontWeight: 700, borderRadius: 2, px: 2, py: 0.5 }} onClick={() => openQrDeleteDialog(qr)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onClose={() => setAddAdminOpen(false)}>
        <DialogTitle>Add Admin</DialogTitle>
        <form onSubmit={handleAddAdmin}>
          <DialogContent sx={{ minWidth: 320 }}>
            <TextField
              label="Name"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddAdminOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={loading}>
              {loading ? 'Adding...' : 'Add Admin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Delete Admin Dialog */}
      <Dialog open={deleteAdminOpen} onClose={() => setDeleteAdminOpen(false)}>
        <DialogTitle>Delete Admin</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          {loadingAdmins ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {admins.length === 0 && <ListItem><ListItemText primary="No other admins found." /></ListItem>}
              {admins.map(admin => (
                <ListItem
                  button
                  key={admin._id}
                  selected={selectedAdmin === admin._id}
                  onClick={() => setSelectedAdmin(admin._id)}
                  sx={{ borderRadius: 2, mb: 1, bgcolor: selectedAdmin === admin._id ? '#f5f5f5' : undefined }}
                >
                  <ListItemText primary={admin.name} secondary={admin.email} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAdminOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDeleteAdmin}
            variant="contained"
            color="error"
            disabled={!selectedAdmin || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Admin'}
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
              value={userName}
              onChange={e => setUserName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={userPassword}
              onChange={e => setUserPassword(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Role"
              value={userRole}
              onChange={e => setUserRole(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUserOpen(false)} disabled={userLoading}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={userLoading}>
              {userLoading ? 'Adding...' : 'Add User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <List>
                {users.length === 0 && <ListItem><ListItemText primary="No users found." /></ListItem>}
                {users.map(user => (
                  <ListItem
                    button
                    key={user._id}
                    selected={selectedUser === user._id}
                    onClick={() => handleSelectUserToEdit(user)}
                    sx={{ borderRadius: 2, mb: 1, bgcolor: selectedUser === user._id ? '#f5f5f5' : undefined }}
                  >
                    <ListItemText primary={user.name} secondary={user.email} />
                  </ListItem>
                ))}
              </List>
              {selectedUser && (
                <form onSubmit={handleEditUser}>
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
                  <DialogActions>
                    <Button onClick={() => setEditUserOpen(false)} disabled={editLoading}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={editLoading}>
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogActions>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete User Dialog */}
      <Dialog open={deleteUserOpen} onClose={() => setDeleteUserOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {users.length === 0 && <ListItem><ListItemText primary="No users found." /></ListItem>}
              {users.map(user => (
                <ListItem
                  button
                  key={user._id}
                  selected={selectedUser === user._id}
                  onClick={() => handleSelectUserToDelete(user)}
                  sx={{ borderRadius: 2, mb: 1, bgcolor: selectedUser === user._id ? '#f5f5f5' : undefined }}
                >
                  <ListItemText primary={user.name} secondary={user.email} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={!selectedUser || deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Generate QR Code Dialog */}
      <Dialog open={generateQROpen} onClose={() => setGenerateQROpen(false)}>
        <DialogTitle>Generate QR Codes</DialogTitle>
        <form onSubmit={handleGenerateQR}>
          <DialogContent sx={{ minWidth: 320 }}>
            {qrLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TextField
                  select
                  label="Assign to User"
                  value={qrUser}
                  onChange={e => setQrUser(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {qrUsers.map(user => (
                    <MenuItem key={user._id} value={user._id}>{user.name} ({user.email})</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Number of QR Codes"
                  type="number"
                  value={qrCount}
                  onChange={e => setQrCount(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateQROpen(false)} disabled={qrLoading}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={qrLoading || !qrCount}>
              {qrLoading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* View QR Assignments Dialog */}
      <Dialog open={viewQRAssignmentsOpen} onClose={() => setViewQRAssignmentsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>View QR Assignments</DialogTitle>
        <DialogContent sx={{ minWidth: 500 }}>
          {qrAssignmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress />
            </Box>
          ) : qrAssignmentsError ? (
            <Alert severity="error">{qrAssignmentsError}</Alert>
          ) : qrAssignments.length === 0 ? (
            <Typography>No QR assignments found.</Typography>
          ) : (
            <TableContainer component={MuiTablePaper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>QR Code</TableCell>
                    <TableCell>Assigned User</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qrAssignments.map((qr) => (
                    <TableRow key={qr._id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{qr.qrValue}</TableCell>
                      <TableCell>
                        {qr.createdBy ? `${qr.createdBy.name} (${qr.createdBy.email})` : 'Unassigned'}
                      </TableCell>
                      <TableCell>{new Date(qr.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{qr.isActive ? 'Active' : 'Inactive'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewQRAssignmentsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Manage QR Assignments Dialog */}
      <Dialog open={manageQRAssignmentsOpen} onClose={() => setManageQRAssignmentsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage QR Assignments</DialogTitle>
        <DialogContent sx={{ minWidth: 500 }}>
          {manageLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress />
            </Box>
          ) : manageError ? (
            <Alert severity="error">{manageError}</Alert>
          ) : (
            <>
              {manageSuccess && <Alert severity="success" sx={{ mb: 2 }}>{manageSuccess}</Alert>}
              <TableContainer component={MuiTablePaper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>QR Code</TableCell>
                      <TableCell>Assigned User</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manageQRCodes.map((qr) => (
                      <TableRow key={qr._id}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{qr.qrValue}</TableCell>
                        <TableCell>
                          <TextField
                            select
                            value={qr.createdBy?._id || ''}
                            onChange={e => handleAssignmentChange(qr._id, e.target.value)}
                            size="small"
                            disabled={manageSavingId === qr._id}
                            sx={{ minWidth: 180 }}
                          >
                            <MenuItem value="">Unassigned</MenuItem>
                            {manageUsers.map(user => (
                              <MenuItem key={user._id} value={user._id}>{user.name} ({user.email})</MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>{new Date(qr.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{qr.isActive ? 'Active' : 'Inactive'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageQRAssignmentsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* QR Code Delete Confirmation Dialog */}
      <Dialog open={qrDeleteDialogOpen} onClose={() => setQrDeleteDialogOpen(false)}>
        <DialogTitle>Delete QR Code</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <Typography>Are you sure you want to delete this QR code?</Typography>
          {qrToDelete && (
            <Typography sx={{ mt: 2, fontFamily: 'monospace' }}>{qrToDelete.qrValue}</Typography>
          )}
          {qrDeleteError && <Alert severity="error" sx={{ mt: 2 }}>{qrDeleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDeleteDialogOpen(false)} disabled={qrDeleteLoading}>Cancel</Button>
          <Button onClick={handleQrDelete} variant="contained" color="error" disabled={qrDeleteLoading}>{qrDeleteLoading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
      {/* Delete All QR Codes Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
        <DialogTitle>Delete All QR Codes</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <Typography>Are you sure you want to delete <b>ALL</b> QR codes? This cannot be undone.</Typography>
          {deleteAllError && <Alert severity="error" sx={{ mt: 2 }}>{deleteAllError}</Alert>}
          {deleteAllSuccess && <Alert severity="success" sx={{ mt: 2 }}>{deleteAllSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)} disabled={deleteAllLoading}>Cancel</Button>
          <Button
            onClick={async () => {
              setDeleteAllLoading(true);
              setDeleteAllError("");
              setDeleteAllSuccess("");
              try {
                const res = await axios.delete('http://localhost:3001/qrcodes-all', { withCredentials: true });
                setDeleteAllSuccess(res.data.message || 'All QR codes deleted successfully!');
                fetchQrManagementCodes();
              } catch (err) {
                setDeleteAllError('Failed to delete all QR codes.');
              } finally {
                setDeleteAllLoading(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={deleteAllLoading}
          >
            {deleteAllLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
}

export default SuperAdminDashboard; 