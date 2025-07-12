import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

const GEOAPIFY_API_KEY = '569ad80a20494ff8940773beaf92b414';

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

const QRMap = () => {
  const { qrId } = useParams();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        console.log("Fetching QR code with ID:", qrId);
        const res = await axios.get(`http://localhost:3001/qrcode/${qrId}`, { withCredentials: true });
        setQrCode(res.data.qrCode);
        setError('');
      } catch (err) {
        setError('Failed to load QR code or location.');
      } finally {
        setLoading(false);
      }
    };
    fetchQRCode();
  }, [qrId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><Typography color="error">{error}</Typography></Box>;
  if (!qrCode || !qrCode.location || !qrCode.location.latitude || !qrCode.location.longitude) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><Typography>No location data for this QR code.</Typography></Box>;
  }

  const { latitude, longitude, address } = qrCode.location;

  const carIcon = L.icon({
    iconUrl: '/car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Box sx={{
      minHeight: '100vh',
      minWidth: '100vw',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#2351c7',
      p: 0,
      m: 0
    }}>
      <Paper sx={{
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        p: 0,
        m: 0
      }} elevation={0}>
        <Typography variant="h4" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>QR Code Location</Typography>
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          Address: {address || 'Unknown'}
        </Typography>
        <Box sx={{ width: '100vw', height: '85vh' }}>
          <MapContainer
            center={[latitude, longitude]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <ResizeMap />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[latitude, longitude]} icon={carIcon}>
              <Popup>
                <b>QR Code Location</b><br />
                {address || `${latitude}, ${longitude}`}
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default QRMap; 