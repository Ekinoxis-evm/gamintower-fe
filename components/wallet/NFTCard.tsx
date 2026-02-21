import { useState } from 'react';
import Image from 'next/image';
import { UserNFT } from '../../hooks/useUserNFTs';

interface NFTCardProps {
  nft: UserNFT;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="nft-card">
        <div className="nft-card-header">
          <div className="nft-image-wrapper">
            {nft.image ? (
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="nft-image"
                sizes="120px"
                unoptimized
              />
            ) : (
              <div className="nft-image-placeholder" />
            )}
          </div>
          <div className="nft-header-info">
            <h3 className="nft-name">{nft.name}</h3>
            <div className="nft-balance">
              <span className="balance-label">Balance:</span>
              <span className="balance-value">{nft.balance}</span>
            </div>
          </div>
        </div>

        {nft.description && (
          <p className="nft-description">{nft.description}</p>
        )}

        <div className="nft-actions">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="action-btn details-btn"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {isExpanded && (
          <div className="nft-details">
            <div className="detail-row">
              <span className="detail-label">Token ID:</span>
              <span className="detail-value font-mono">#{nft.tokenId.toString()}</span>
            </div>

            {nft.attributes && nft.attributes.length > 0 && (
              <div className="nft-attributes">
                <div className="attributes-header">Attributes</div>
                <div className="attributes-grid">
                  {nft.attributes.map((attr, idx) => (
                    <div key={idx} className="attribute-item">
                      <span className="attribute-type">{attr.trait_type}:</span>
                      <span className="attribute-value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .nft-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s ease;
        }

        .nft-card:hover {
          border-color: rgba(34, 211, 238, 0.4);
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.1);
        }

        .nft-card-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .nft-image-wrapper {
          flex-shrink: 0;
          width: 120px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(75, 85, 99, 0.3);
          background: rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .nft-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }

        .nft-image-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
        }

        .nft-header-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nft-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #e5e7eb;
          margin: 0;
        }

        .nft-balance {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .balance-label {
          color: #9ca3af;
          font-weight: 500;
        }

        .balance-value {
          color: #06b6d4;
          font-weight: 600;
          font-size: 1rem;
        }

        .nft-description {
          font-size: 0.875rem;
          color: #9ca3af;
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }

        .nft-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .details-btn {
          background: rgba(75, 85, 99, 0.2);
          color: #9ca3af;
          border-color: rgba(75, 85, 99, 0.3);
        }

        .details-btn:hover {
          background: rgba(75, 85, 99, 0.3);
          border-color: rgba(75, 85, 99, 0.5);
        }

        .nft-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(75, 85, 99, 0.3);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .detail-value {
          font-size: 0.875rem;
          color: #e5e7eb;
        }

        .nft-attributes {
          margin-top: 1rem;
        }

        .attributes-header {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .attributes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .attribute-item {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 6px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .attribute-type {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .attribute-value {
          font-size: 0.875rem;
          color: #22d3ee;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .nft-card-header {
            flex-direction: column;
          }

          .nft-image-wrapper {
            width: 100%;
            height: 200px;
          }

          .nft-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }

          .attributes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
