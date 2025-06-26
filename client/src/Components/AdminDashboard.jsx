import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, TextField, Button, IconButton, Alert, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiTablePaper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

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

  useEffect(() => {
    const checkRoleAndFetchData = async () => {
      try {
        const roleRes = await axios.get("http://localhost:3001/check-role", { withCredentials: true });
        if (!roleRes.data.role || roleRes.data.role.toLowerCase() !== 'admin') {
          navigate('/home');
          return;
        }
        await fetchUsers();
        await fetchQRCodes();
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

  const fetchQRCodes = async () => {
    try {
      const response = await axios.get("http://localhost:3001/qrcodes", { withCredentials: true });
      setQrCodes(response.data);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      setError("Failed to fetch QR codes");
    }
  };

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

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/delete-user/${selectedUser}`, { withCredentials: true });
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

  return (
    <div>
      {/* Top bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 2 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/home', { state: { user: { name: 'Admin', role: 'admin' } } })}>
            <HomeIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h5">Welcome, Admin!</Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          Only Super Admins can generate QR codes. You can view and manage existing QR codes below.
        </Alert>

        <Box sx={{
          mt: 4,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxHeight: 500,
          overflowY: 'auto',
          border: '1px solid #ccc',
          p: 4,
          bgcolor: '#fff',
          borderRadius: 4,
          boxShadow: 3
        }}>
          {qrCodes.map((qrCode, idx) => (
            <Box key={qrCode._id} sx={{ textAlign: 'center' }}>
              <QRCodeSVG value={qrCode.qrValue} size={128} bgColor="#fff" />
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
                  <Typography variant="body2" sx={{ mt: 1 }}>{qrCode.qrValue}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Assigned to: {qrCode.createdBy ? `${qrCode.createdBy.name} (${qrCode.createdBy.email})` : 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
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
            </Box>
          ))}
        </Box>

        {/* User Management Section */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>User Management</Typography>
          <Button variant="contained" color="success" sx={{ mb: 2 }} onClick={() => setAddUserOpen(true)}>
            Add User
          </Button>
          <TableContainer component={MuiTablePaper}>
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
        </Box>

        {/* Add User Dialog */}
        <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)}>
          <DialogTitle>Add User</DialogTitle>
          <form onSubmit={handleAddUser}>
            <DialogContent sx={{ minWidth: 320 }}>
              <TextField label="Name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} fullWidth required sx={{ mb: 2 }} />
              <TextField label="Email" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} fullWidth required sx={{ mb: 2 }} />
              <TextField label="Password" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} fullWidth required sx={{ mb: 2 }} />
              <TextField
                select
                label="Role"
                value="user"
                fullWidth
                required
                sx={{ mb: 2 }}
                disabled
              >
                <MenuItem value="user">User</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddUserOpen(false)} disabled={editLoading}>Cancel</Button>
              <Button type="submit" variant="contained" color="success" disabled={editLoading}>{editLoading ? 'Adding...' : 'Add User'}</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)}>
          <DialogTitle>Edit User</DialogTitle>
          <form onSubmit={handleEditUser}>
            <DialogContent sx={{ minWidth: 320 }}>
              <TextField label="Name" value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} fullWidth required sx={{ mb: 2 }} />
              <TextField label="Email" type="email" value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} fullWidth required sx={{ mb: 2 }} />
              <TextField select label="Role" value={editUserData.role} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })} fullWidth required sx={{ mb: 2 }}>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditUserOpen(false)} disabled={editLoading}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteUserOpen} onClose={() => setDeleteUserOpen(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent sx={{ minWidth: 320 }}>
            <Typography>Are you sure you want to delete this user?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteUserOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button onClick={handleDeleteUser} variant="contained" color="error" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete User'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default AdminDashboard;
