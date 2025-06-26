import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Grid, Link, Button, Paper, TextField, Typography } from "@mui/material";
import { MenuItem } from "@mui/material";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // 👈 New role state

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    axios.post("http://localhost:3001/signup", { name, email, password, role }) // 👈 send role also
      .then(result => {
        if (result.status === 201) {
          navigate("/login");
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 400) {
          window.alert("Email already exists. Please use a different email.");
        } else {
          console.log(err);
        }
      });
  };

  const paperStyle = { padding: "2rem", margin: "100px auto", borderRadius: "1rem", boxShadow: "10px 10px 10px" };
  const heading = { fontSize: "2.5rem", fontWeight: "600" };
  const row = { display: "flex", marginTop: "2rem" };
  const btnStyle = { marginTop: "2rem", fontSize: "1.2rem", fontWeight: "700", backgroundColor: "blue", borderRadius: "0.5rem" };

  return (
    <div>
      <Grid align="center" className="wrapper">
        <Paper style={paperStyle} sx={{
          width: {
            xs: '80vw',
            sm: '50vw',
            md: '40vw',
            lg: '30vw',
            xl: '20vw',
          },
          minHeight: '60vh', // 👈 Use minHeight instead of fixed height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>

          <Typography component="h1" variant="h5" style={heading}> Signup </Typography>
          <form onSubmit={handleSignup}>
            <TextField style={row} sx={{ label: { fontWeight: '700', fontSize: "1.3rem" } }} fullWidth type="text" label="Enter Name" name="name" onChange={(e) => setName(e.target.value)} />
            <TextField style={row} sx={{ label: { fontWeight: '700', fontSize: "1.3rem" } }} fullWidth label="Email" variant="outlined" type="email" placeholder="Enter Email" name="email" onChange={(e) => setEmail(e.target.value)} />
            <TextField style={row} sx={{ label: { fontWeight: '700', fontSize: "1.3rem" } }} fullWidth label="Password" variant="outlined" type="password" placeholder="Enter Password" name="password" onChange={(e) => setPassword(e.target.value)} />

            {/* 👇 Role Dropdown Field */}
            <TextField
              style={row}
              select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              SelectProps={{ native: true }}
              fullWidth
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </TextField>

            <Button style={btnStyle} variant="contained" type="submit">SignUp</Button>
          </form>
          <p>Already have an account?<Link href="/login"> Login</Link></p>
        </Paper>
      </Grid>
    </div>
  )
}

export default SignUp;
