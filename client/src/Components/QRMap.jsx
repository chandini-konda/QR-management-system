import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GEOAPIFY_API_KEY = '569ad80a20494ff8940773beaf92b414';

const QRMap = () => {
  const { qrId } = useParams();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
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

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3, mb: 2 }} elevation={4}>
        <Typography variant="h5" sx={{ mb: 1 }}>QR Code Location</Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>QR Value: <b>{qrCode.qrValue}</b></Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Address: {address || 'Unknown'}</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <MapContainer center={[latitude, longitude]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[latitude, longitude]}>
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