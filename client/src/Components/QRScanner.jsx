import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import jsQR from 'jsqr';

const QRScanner = ({ open, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' or 'file'

  useEffect(() => {
    if (open && mode === 'camera') {
      const timer = setTimeout(() => {
        if (!scannerRef.current && document.getElementById('qr-reader')) {
          initializeScanner();
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      };
    }
  }, [open, mode]);

  const initializeScanner = () => {
    try {
      setScanning(true);
      setError('');
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );
      scanner.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore most errors
        }
      );
      scannerRef.current = scanner;
      setScanning(false);
    } catch (err) {
      setError("Failed to access camera. Please ensure camera permissions are granted.");
      setScanning(false);
    }
  };

  const handleScanSuccess = (qrValue) => {
    const qrRegex = /^\d{16}$/;
    if (!qrRegex.test(qrValue)) {
      setError("Invalid QR code format. Please scan a valid 16-digit QR code.");
      return;
    }
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    onScanSuccess(qrValue);
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setError('');
    setScanning(false);
    setMode('camera');
    onClose();
  };

  // File upload QR scan
  const handleFileChange = async (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, img.width, img.height);
        if (code && code.data) {
          handleScanSuccess(code.data);
        } else {
          setError('No valid QR code found in the image.');
        }
      };
      img.onerror = () => setError('Failed to load image.');
      img.src = event.target.result;
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 500
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: '#1976d2',
        color: 'white',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon />
          <Typography variant="h6" component="span">Scan QR Code</Typography>
        </Box>
        <Box>
          <Button
            variant={mode === 'camera' ? 'contained' : 'outlined'}
            color="inherit"
            size="small"
            sx={{ mr: 1, bgcolor: mode === 'camera' ? '#fff' : 'inherit', color: mode === 'camera' ? '#1976d2' : 'white' }}
            onClick={() => setMode('camera')}
            startIcon={<QrCodeScannerIcon />}
          >
            Camera
          </Button>
          <Button
            variant={mode === 'file' ? 'contained' : 'outlined'}
            color="inherit"
            size="small"
            sx={{ bgcolor: mode === 'file' ? '#fff' : 'inherit', color: mode === 'file' ? '#1976d2' : 'white' }}
            onClick={() => setMode('file')}
            startIcon={<PhotoLibraryIcon />}
          >
            File
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {mode === 'camera' && (
          <>
            {scanning && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Initializing camera...</Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Position the QR code within the scanner frame
            </Typography>
            <Box 
              id="qr-reader" 
              sx={{ 
                width: '100%',
                minHeight: 300,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            />
          </>
        )}
        {mode === 'file' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoLibraryIcon />}
              sx={{ mb: 2 }}
            >
              Upload QR Image
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Select a QR code image from your device (e.g., from Downloads)
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner; 