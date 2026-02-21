import React from 'react';
import { useUserENS } from '../../hooks/ens';

interface ENSSectionProps {
  userAddress: string;
  chainId: number;
}

const ENSSection: React.FC<ENSSectionProps> = ({ userAddress, chainId: _chainId }) => {
  const { subdomain, fullName, isLoading } = useUserENS(userAddress);

  if (isLoading) {
    return (
      <div className="ens-section">
        <div className="ens-loading">
          <div className="loading-spinner" />
          <span>Checking ENS...</span>
        </div>

        <style jsx>{`
          .ens-section {
            margin-bottom: 1rem;
          }

          .ens-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(17, 24, 39, 0.6);
            border: 1px solid rgba(75, 85, 99, 0.3);
            border-radius: 12px;
            color: #9ca3af;
            font-size: 0.875rem;
          }

          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(6, 182, 212, 0.3);
            border-top-color: #06b6d4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!subdomain) {
    return null;
  }

  return (
    <div className="ens-section">
      <div className="ens-badge-container">
        <div className="ens-badge">
          <div className="badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="badge-content">
            <span className="badge-label">Your ENS Name</span>
            <span className="badge-name">{fullName}</span>
          </div>
          <div className="verified-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ens-section {
          margin-bottom: 1rem;
        }

        .ens-badge-container {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 12px;
          padding: 1rem;
        }

        .ens-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
          border-radius: 10px;
          color: #06b6d4;
        }

        .badge-icon svg {
          width: 20px;
          height: 20px;
        }

        .badge-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .badge-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-name {
          font-size: 1rem;
          font-weight: 600;
          color: #06b6d4;
          font-family: 'SF Mono', 'Menlo', monospace;
        }

        .verified-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #10b981;
          border-radius: 50%;
          color: white;
        }

        .verified-badge svg {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
};

export default ENSSection;
