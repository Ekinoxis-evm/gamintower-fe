import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
  validator?: (data: string) => { valid: boolean; error?: string };
  theme?: 'cyan' | 'amber';
  showScanCount?: boolean;
}

const THEME_COLORS = {
  cyan: {
    primary: '#22d3ee',
    primaryRgb: '34, 211, 238',
  },
  amber: {
    primary: '#fbbf24',
    primaryRgb: '251, 191, 36',
  },
};

// Unique ID per mount to avoid conflicts if multiple scanners exist
let scannerInstanceCount = 0;

const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code',
  validator,
  theme = 'cyan',
  showScanCount = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef<string>(`qr-scanner-${++scannerInstanceCount}`);
  const lastScannedRef = useRef<string | null>(null);

  const colors = THEME_COLORS[theme];

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (decodedText === lastScannedRef.current) return;
    lastScannedRef.current = decodedText;
    setScanCount(prev => prev + 1);

    if (validator) {
      const validation = validator(decodedText);
      if (!validation.valid) {
        setError(validation.error || 'Invalid QR code');
        setTimeout(() => {
          setError(null);
          lastScannedRef.current = null;
        }, 3000);
        return;
      }
    }

    setError(null);
    onScan(decodedText);
  }, [validator, onScan]);

  useEffect(() => {
    const containerId = containerIdRef.current;
    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        handleScanSuccess,
        () => { /* per-frame errors are normal — ignore */ }
      )
      .then(() => setCameraReady(true))
      .catch(() => {
        setError('Camera access denied. Please allow camera permissions and try again.');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.isScanning
          ? scannerRef.current.stop().catch(() => {})
          : Promise.resolve();
        scannerRef.current = null;
      }
    };
  }, [handleScanSuccess]);

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="qr-reader-wrapper">
          {/* html5-qrcode injects video into this div */}
          <div id={containerIdRef.current} className="qr-reader-inner" />

          {/* Scan frame overlay */}
          {cameraReady && (
            <div className="scan-frame-overlay">
              <div className="scan-frame">
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
                <div className="scan-line" />
              </div>
            </div>
          )}

          {!cameraReady && !error && (
            <div className="camera-loading">
              <div className="loading-spinner" />
              <span>Starting camera…</span>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="error-close-btn">×</button>
          </div>
        )}

        {showScanCount && scanCount > 0 && (
          <div className="scan-success">
            <span className="scan-indicator">Scanning ({scanCount} attempts)</span>
          </div>
        )}

        <p className="scanner-help">{description}</p>
      </div>

      <style jsx>{`
        .qr-scanner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(10, 10, 20, 0.98));
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          padding: 1rem;
          box-sizing: border-box;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .qr-scanner-container {
          width: 100%;
          max-width: 420px;
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(0, 0, 0, 0.98));
          border: 1px solid rgba(${colors.primaryRgb}, 0.3);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(${colors.primaryRgb}, 0.1);
          margin: auto;
        }

        .qr-scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(${colors.primaryRgb}, 0.2);
        }

        .qr-scanner-header h3 {
          margin: 0;
          font-size: 1rem;
          color: ${colors.primary};
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .close-button {
          background: rgba(${colors.primaryRgb}, 0.1);
          border: 1px solid rgba(${colors.primaryRgb}, 0.3);
          border-radius: 6px;
          color: ${colors.primary};
          font-size: 1.5rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          line-height: 1;
        }

        .close-button:hover {
          background: rgba(${colors.primaryRgb}, 0.2);
          border-color: rgba(${colors.primaryRgb}, 0.5);
          box-shadow: 0 0 12px rgba(${colors.primaryRgb}, 0.3);
        }

        /* Wrapper holds both the html5-qrcode element and our overlay */
        .qr-reader-wrapper {
          position: relative;
          width: 100%;
          background: #000;
          aspect-ratio: 1 / 1;
          overflow: hidden;
        }

        /* html5-qrcode injects its own video + canvas inside this div */
        .qr-reader-inner {
          width: 100%;
          height: 100%;
        }

        /* Force the injected video to fill the wrapper */
        :global(#${containerIdRef.current} video) {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }

        /* Hide html5-qrcode's built-in scan region box — we use our own */
        :global(#${containerIdRef.current} div[style*="border"]) {
          display: none !important;
        }

        /* Scan frame overlay — sits on top of the video */
        .scan-frame-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%),
            linear-gradient(to top,    rgba(0,0,0,0.55) 0%, transparent 30%),
            linear-gradient(to right,  rgba(0,0,0,0.55) 0%, transparent 30%),
            linear-gradient(to left,   rgba(0,0,0,0.55) 0%, transparent 30%);
        }

        .scan-frame {
          position: relative;
          width: 240px;
          height: 240px;
        }

        /* Corner markers */
        .corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: ${colors.primary};
          border-style: solid;
        }

        .corner.tl { top: 0; left: 0;  border-width: 3px 0 0 3px; border-radius: 3px 0 0 0; }
        .corner.tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 3px 0 0; }
        .corner.bl { bottom: 0; left: 0;  border-width: 0 0 3px 3px; border-radius: 0 0 0 3px; }
        .corner.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 3px 0; }

        /* Animated scan line */
        .scan-line {
          position: absolute;
          left: 3px;
          right: 3px;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
          box-shadow: 0 0 8px ${colors.primary};
          animation: scan 2s ease-in-out infinite;
        }

        @keyframes scan {
          0%   { top: 3px;   opacity: 1; }
          50%  { top: calc(100% - 5px); opacity: 1; }
          100% { top: 3px;   opacity: 1; }
        }

        /* Camera loading state */
        .camera-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: #9ca3af;
          font-size: 0.8rem;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          background: rgba(0, 0, 0, 0.8);
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(${colors.primaryRgb}, 0.2);
          border-top-color: ${colors.primary};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .scanner-help {
          text-align: center;
          padding: 0.875rem 1rem;
          color: #9ca3af;
          font-size: 0.78rem;
          margin: 0;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-top: 1px solid rgba(${colors.primaryRgb}, 0.15);
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.75rem 1rem;
          margin: 0.75rem;
          text-align: center;
          font-size: 0.82rem;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .error-close-btn {
          font-size: 1.2rem;
          cursor: pointer;
          background: transparent;
          border: none;
          color: #ef4444;
          line-height: 1;
        }

        .scan-success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 0.5rem 1rem;
          margin: 0.5rem 0.75rem;
          border-radius: 6px;
          text-align: center;
        }

        .scan-indicator {
          color: #22c55e;
          font-size: 0.8rem;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        @media (max-width: 767px) {
          .qr-scanner-overlay {
            padding: 0.5rem;
            align-items: flex-start;
            padding-top: 2rem;
          }

          .qr-scanner-container {
            max-width: 100%;
            border-radius: 12px;
          }

          .qr-scanner-header {
            padding: 0.875rem 1rem;
          }

          .qr-scanner-header h3 {
            font-size: 0.9rem;
          }

          .scan-frame {
            width: 200px;
            height: 200px;
          }

          .scanner-help {
            font-size: 0.7rem;
            padding: 0.75rem;
          }

          .error-message {
            font-size: 0.75rem;
            padding: 0.625rem 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;

// Validators for common use cases
export const ethereumAddressValidator = (data: string) => {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (ethAddressRegex.test(data)) {
    return { valid: true };
  }
  return { valid: false, error: 'Invalid Ethereum address QR code. Please scan a valid wallet address.' };
};
