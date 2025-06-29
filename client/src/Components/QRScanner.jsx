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

const QRScanner = ({ open, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Wait for the dialog and #qr-reader to be in the DOM
      const timer = setTimeout(() => {
        if (!scannerRef.current && document.getElementById('qr-reader')) {
          initializeScanner();
        }
      }, 100); // 100ms delay

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      };
    }
  }, [open]);

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
          // Success callback
          console.log("QR Code detected:", decodedText);
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - we'll ignore most errors as they're just "no QR found"
          console.log("Scanner error:", errorMessage);
        }
      );

      scannerRef.current = scanner;
      setScanning(false);
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      setError("Failed to access camera. Please ensure camera permissions are granted.");
      setScanning(false);
    }
  };

  const handleScanSuccess = (qrValue) => {
    // Validate QR code format (16-digit number)
    const qrRegex = /^\d{16}$/;
    if (!qrRegex.test(qrValue)) {
      setError("Invalid QR code format. Please scan a valid 16-digit QR code.");
      return;
    }

    // Stop scanning
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }

    // Call the success callback
    onScanSuccess(qrValue);
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setError('');
    setScanning(false);
    onClose();
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
        color: 'white'
      }}>
        <QrCodeScannerIcon />
        <Typography variant="h6" component="span">Scan QR Code</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
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