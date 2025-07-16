import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRef } from 'react';

const GEOAPIFY_API_KEY = '569ad80a20494ff8940773beaf92b414';

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

function MapWithRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map]);
  return null;
}

const QRMap = () => {
  const { qrId } = useParams();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef();

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

  // Track user's live location
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Extract destination
  const destination = qrCode?.destination && typeof qrCode.destination.latitude === 'number' && typeof qrCode.destination.longitude === 'number'
    ? [qrCode.destination.latitude, qrCode.destination.longitude]
    : null;

  const carIcon = L.icon({
    iconUrl: '/car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><Typography color="error">{error}</Typography></Box>;
  if (!userLocation) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><Typography>Getting your live location...</Typography></Box>;
  }

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
        <Typography variant="h5" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
          Your Live Location: {userLocation.latitude}, {userLocation.longitude}
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          Destination: {destination ? (qrCode.destination?.address || `${destination[0]}, ${destination[1]}`) : 'Not set'}
        </Typography>
        <Box sx={{ width: '100vw', height: '85vh' }}>
          <MapContainer
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <MapWithRef mapRef={mapRef} />
            <ResizeMap />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Show user's live location marker */}
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={carIcon}>
              <Popup>
                <b>Your Live Location</b><br />
                {userLocation.latitude}, {userLocation.longitude}
              </Popup>
            </Marker>
            {/* If destination is set, show marker and polyline */}
            {destination && (
              <>
                <Marker position={destination} icon={carIcon}>
                  <Popup>
                    <b>Destination</b><br />
                    {qrCode.destination?.address || `${destination[0]}, ${destination[1]}`}
                  </Popup>
                </Marker>
                <Polyline positions={[[userLocation.latitude, userLocation.longitude], destination]} color="blue" />
              </>
            )}
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default QRMap; 