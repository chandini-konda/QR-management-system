import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Grid, Link, Button, Paper, TextField, Typography, MenuItem } from "@mui/material";

function Login({ setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        axios.post("http://localhost:3001/login", { email, password, role }, { withCredentials: true })
            .then(result => {
                if (result.data === "Success") {
                    axios.get('http://localhost:3001/user', { withCredentials: true })
                        .then(response => {
                            if (response.data.user) {
                              const user = response.data.user;
                              setUser(user);
                              console.log("User data:", user);
                              if (user.role === 'superadmin') {
                                navigate("/super-admin-dashboard", { state: { user } });
                              } else if (user.role === 'admin') {
                                navigate("/admin-dashboard", { state: { user } });
                              } else {
                                navigate("/user-dashboard", { state: { user } });
                              }
                            }
                        });
                } else {
                    alert("Login failed");
                }
            })
            .catch(err => console.log(err));
    };

    const paperStyle = { padding: "2rem", margin: "100px auto", borderRadius: "1rem", boxShadow: "10px 10px 10px" };
    const heading = { fontSize: "2.5rem", fontWeight: "600" };
    const row = { display: "flex", marginTop: "2rem" };
    const btnStyle={marginTop:"2rem", fontSize:"1.2rem", fontWeight:"700", backgroundColor:"blue", borderRadius:"0.5rem"};
    const label = { fontWeight: "700" };

    return (
        <div>
            <Grid align="center" className="wrapper">
                <Paper 
                    style={paperStyle} 
                    sx={{ 
                        width: { xs: '80vw', sm: '50vw', md: '40vw', lg: '30vw', xl: '20vw' }, 
                        minHeight: { lg: '50vh' },
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Typography component="h1" variant="h5" style={heading}>Login</Typography>
                    <form onSubmit={handleLogin} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={row}>
                            <TextField
                                select
                                label="Select Role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Super Admin</MenuItem>
                            </TextField>
                        </span>
                        <span style={row}>
                            <TextField sx={{ label: { fontWeight: '700', fontSize: "1.3rem" } }} style={label} label="Email" fullWidth variant="outlined" type="email" placeholder="Enter Email" name="email" onChange={(e) => setEmail(e.target.value)} />
                        </span>
                        <span style={row}>
                            <TextField sx={{ label: { fontWeight: '700', fontSize: "1.3rem" } }} label="Password" fullWidth variant="outlined" type="password" placeholder="Enter Password" name="password" onChange={(e) => setPassword(e.target.value)} />
                        </span>
                        <Button style={btnStyle} variant="contained" type="submit">Login</Button>
                    </form>
                    <Typography sx={{ mt: 2 }}>
                        Don't have an account? <Link href="/signup">SignUp</Link>
                    </Typography>
                </Paper>
            </Grid>
        </div>
    );
}

export default Login;
