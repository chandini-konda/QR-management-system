import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Logout from './Logout';

export const Navbar = ({ isLoggedIn, setIsLoggedIn, onFeaturesClick }) => {
    const buttonStyles = {
        margin: '0 10px',
        fontSize: '1.2rem',
        fontWeight: '700',
        padding: '0.3rem 1.4rem',
        borderRadius: '4px'
    };

    return (
        <AppBar position="static" sx={{ bgcolor: '#333' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h4" component="div" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
                   AddWise Hub 
                </Typography>
                {!isLoggedIn ? (
                    <>
                        <Button
                            variant="contained"
                            style={buttonStyles}
                            color="primary"
                            onClick={onFeaturesClick}
                        >
                            Features
                        </Button>
                        <Button
                            variant="contained"
                            style={buttonStyles}
                            color="error"
                            component={Link}
                            to="/login"
                        >
                            Login 
                        </Button>
                        <Button
                            variant="contained"
                            style={buttonStyles}
                            color="success"
                            component={Link}
                            to="/signup"
                        >
                            Signup
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onFeaturesClick}
                            sx={{ mr: 2 }}
                        >
                            Features
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            component={Link}
                            to="/home"
                            sx={{ mr: 2 }}
                        >
                            Home
                        </Button>
                        <Logout setIsLoggedIn={setIsLoggedIn} />
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};
