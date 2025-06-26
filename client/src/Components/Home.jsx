import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Box, Typography, Container, Grid, Paper } from "@mui/material";
import axios from "axios";
import { Fade } from "react-awesome-reveal";
import GroupIcon from '@mui/icons-material/Group';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';

function Home({ featuresRef }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(location.state?.user);
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        if (!user) {
            axios.get('http://localhost:3001/user', { withCredentials: true })
                .then(response => {
                    if (response.data.user) {
                        setUser(response.data.user);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <center><h1 style={{ color: 'white' }}>Loading...</h1></center>;
    }
    
    return (
        <>
            <Container>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        minHeight: 'calc(100vh - 100px)', // Adjust based on your navbar height
                        color: 'white'
                    }}
                >
                    <Fade direction="down" triggerOnce>
                        <Typography
                            variant="h2"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                mb: 2,
                                letterSpacing: '-1px',
                            }}
                        >
                            Master Your Workflow.
                            <br />
                            Elevate Your Results.
                        </Typography>
                    </Fade>
                    <Fade direction="up" delay={200} triggerOnce>
                        <Typography variant="h6" sx={{ mb: 4, maxWidth: '600px', fontWeight: 300 }}>
                            AddWise Hub is the all-in-one solution for seamless project management, QR code integration, and secure team collaboration.
                        </Typography>
                    </Fade>
                    {user && (
                      <Fade direction="up" delay={300} triggerOnce>
                        <Typography variant="h4" sx={{ mt: 4, color: 'white', fontWeight: 500 }}>
                          Welcome, {user.role === 'admin' ? 'Admin ' : ''}{user.name}!
                        </Typography>
                      </Fade>
                    )}
                    {!user && (
                        <Fade direction="up" delay={400} triggerOnce>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/signup')}
                                sx={{
                                    bgcolor: '#ffc107',
                                    color: 'black',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    px: 5,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: '#ffa000',
                                    }
                                }}
                            >
                                Get Started for Free
                            </Button>
                        </Fade>
                    )}
                </Box>
                {/* Features Section */}
                <Box ref={featuresRef} sx={{ mt: 8 }}>
                    <Typography variant="h4" sx={{ color: 'white', mb: 4, fontWeight: 600, textAlign: 'center' }}>
                        Why Choose AddWise Hub?
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        <Grid item xs={12} md={4}>
                            <Fade direction="up" delay={100} triggerOnce>
                                <Paper elevation={3} sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    minHeight: 220,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: 6,
                                    }
                                }}>
                                    <GroupIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Seamless Collaboration</Typography>
                                    <Typography>Work together in real-time with your team, share tasks, and track progress easily.</Typography>
                                </Paper>
                            </Fade>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Fade direction="up" delay={250} triggerOnce>
                                <Paper elevation={3} sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    minHeight: 220,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: 6,
                                    }
                                }}>
                                    <QrCode2Icon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Integrated QR Codes</Typography>
                                    <Typography>Generate and manage QR codes for your projects, events, or inventory with a click.</Typography>
                                </Paper>
                            </Fade>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Fade direction="up" delay={400} triggerOnce>
                                <Paper elevation={3} sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    minHeight: 220,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: 6,
                                    }
                                }}>
                                    <SecurityIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Secure & Reliable</Typography>
                                    <Typography>Your data is protected with industry-standard security and regular backups.</Typography>
                                </Paper>
                            </Fade>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
            {/* Custom Footer - full width */}
            <Box sx={{
                width: '100%',
                bgcolor: '#222',
                color: '#fff',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                px: { xs: 2, sm: 8 },
                py: 2,
                mt: 8,
                fontSize: '1rem',
                gap: 2,
                alignSelf: 'stretch',
            }}>
                <Box sx={{ mb: { xs: 1, sm: 0 } }}>
                    &copy; {new Date().getFullYear()} AddWise Hub. All Rights Reserved.
                </Box>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Terms</a>
                    <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>About/Contact</a>
                </Box>
            </Box>
        </>
    );
}

export default Home;
