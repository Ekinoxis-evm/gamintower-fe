import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Button from '../shared/Button';
import Loading from '../shared/Loading';
import QRScanner from './QRScanner';
import { getTokenLogoUrl } from '../../utils/tokenUtils';

interface TokenOption {
  symbol: string;
  balance: string;
  name: string;
}

interface SendTokenModalProps {
  onClose: () => void;
  onSend: (recipient: string, amount: string, tokenType: string) => Promise<void>;
  onSendAnother: () => void;
  availableTokens: TokenOption[];
  isSending: boolean;
  txHash?: string | null;
  initialRecipient?: string;
  chainId?: number;
}

const SendTokenModal: React.FC<SendTokenModalProps> = ({
  onClose,
  onSend,
  onSendAnother,
  availableTokens,
  isSending,
  txHash = null,
  initialRecipient = '',
  chainId,
}) => {
  const explorerBase = (() => {
    switch (chainId) {
      case 1:
        return 'https://etherscan.io';
      case 10:
        return 'https://optimism.etherscan.io';
      case 8453:
        return 'https://basescan.org';
      case 130:
        return 'https://unichain.blockscout.com';
      default:
        return undefined;
    }
  })();

  const getInitialToken = (): TokenOption | null => {
    if (availableTokens.length === 0) return null;
    return availableTokens.find(t => t.symbol === 'ETH') || availableTokens[0];
  };

  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(getInitialToken());
  const [recipient, setRecipient] = useState<string>(initialRecipient);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const [recipientError, setRecipientError] = useState<string>('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
    }
  }, [initialRecipient]);

  useEffect(() => {
    if (availableTokens.length > 0) {
      const currentToken = selectedToken;
      if (!currentToken || !availableTokens.find(t => t.symbol === currentToken.symbol)) {
        const newToken = availableTokens.find(t => t.symbol === 'ETH') || availableTokens[0];
        setSelectedToken(newToken);
      }
    } else {
      setSelectedToken(null);
    }
  }, [availableTokens, selectedToken]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!recipient) {
      setRecipientError('');
      return;
    }
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setRecipientError('Invalid Ethereum address format');
    } else {
      setRecipientError('');
    }
  }, [recipient]);

  useEffect(() => {
    if (!amount) {
      setAmountError('');
      return;
    }
    if (!selectedToken) {
      setAmountError('');
      return;
    }
    const amountNum = Number(amount);
    const balanceNum = Number(selectedToken.balance);
    if (balanceNum === 0) {
      setAmountError(`You have 0 ${selectedToken.symbol} balance. Cannot send.`);
    } else if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Please enter a valid amount');
    } else if (amountNum > balanceNum) {
      setAmountError(`Insufficient balance. Max: ${selectedToken.balance} ${selectedToken.symbol}`);
    } else {
      setAmountError('');
    }
  }, [amount, selectedToken]);

  const handleSend = async () => {
    if (!selectedToken) {
      setError('No token selected');
      return;
    }
    if (recipientError || amountError) {
      setError('Please fix the errors above before sending');
      return;
    }
    if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
      setRecipientError('Please enter a valid Ethereum address');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (Number(amount) > Number(selectedToken.balance)) {
      setAmountError(`Insufficient balance. Max: ${selectedToken.balance} ${selectedToken.symbol}`);
      return;
    }
    setError('');
    setRecipientError('');
    setAmountError('');
    try {
      await onSend(recipient, amount, selectedToken.symbol);
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setError('');
    setAmountError('');
    setRecipientError('');
    onClose();
  };

  const handleSetMaxAmount = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('0x') && text.length === 42) {
        setRecipient(text);
        setError('');
      } else {
        setError('Invalid address in clipboard. Please paste a valid Ethereum address.');
      }
    } catch (_err) {
      setError('Failed to read from clipboard. Please paste the address manually.');
    }
  };

  const handleQRScan = (address: string) => {
    setRecipient(address);
    setIsQRScannerOpen(false);
    setError('');
  };

  // Success screen shown after tx is submitted
  if (txHash) {
    const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>Transaction Sent</h3>
            <button onClick={handleClose} className="close-button">&times;</button>
          </div>

          <div className="success-body">
            <div className="success-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-svg">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l3.5 3.5L17 9" />
              </svg>
            </div>
            <p className="success-title">Transfer submitted</p>
            <p className="success-subtitle">Your transaction is being processed on the network</p>

            <div className="tx-box">
              <span className="tx-box-label">TX Hash</span>
              <code className="tx-box-hash">{shortHash}</code>
            </div>

            {explorerBase && (
              <a
                href={`${explorerBase}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View on Explorer
              </a>
            )}
          </div>

          <div className="success-footer">
            <button className="btn-secondary" onClick={handleClose}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setRecipient('');
                setAmount('');
                setError('');
                setAmountError('');
                setRecipientError('');
                onSendAnother();
              }}
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Send Token</h3>
          <button onClick={handleClose} className="close-button">&times;</button>
        </div>

        <div className="modal-body">
          {/* Token Selection — Dropdown */}
          <div className="form-group">
            <label>Select Token</label>
            {availableTokens.length > 0 ? (
              <div className="token-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="token-dropdown-trigger"
                  onClick={() => setIsDropdownOpen((o) => !o)}
                  disabled={isSending}
                >
                  {selectedToken ? (
                    <>
                      <Image
                        src={getTokenLogoUrl(selectedToken.symbol)}
                        alt={selectedToken.symbol}
                        width={24}
                        height={24}
                        className="token-logo"
                        unoptimized
                      />
                      <span className="dropdown-symbol">{selectedToken.symbol}</span>
                      <span className="dropdown-name">{selectedToken.name}</span>
                      <span className="dropdown-balance">{parseFloat(selectedToken.balance).toFixed(4)}</span>
                    </>
                  ) : (
                    <span className="dropdown-placeholder">Select token...</span>
                  )}
                  <svg
                    className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="token-dropdown-menu">
                    {availableTokens.map((token) => {
                      const hasBalance = parseFloat(token.balance) > 0;
                      const isSelected = selectedToken?.symbol === token.symbol;
                      return (
                        <button
                          key={token.symbol}
                          type="button"
                          className={`token-dropdown-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedToken(token);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Image
                            src={getTokenLogoUrl(token.symbol)}
                            alt={token.symbol}
                            width={28}
                            height={28}
                            className="token-logo"
                            unoptimized
                          />
                          <div className="dropdown-item-info">
                            <span className="dropdown-item-symbol">{token.symbol}</span>
                            <span className="dropdown-item-name">{token.name}</span>
                          </div>
                          <div className="dropdown-item-balance">
                            <span className={hasBalance ? 'has-balance' : 'no-balance-text'}>
                              {parseFloat(token.balance).toFixed(4)}
                            </span>
                          </div>
                          {isSelected && (
                            <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-tokens-message">
                <p>Loading tokens...</p>
              </div>
            )}
          </div>

          {selectedToken && parseFloat(selectedToken.balance) === 0 && (
            <div className="warning-message">
              <span className="warning-icon">⚠</span>
              <span>You have 0 {selectedToken.symbol} balance. You cannot send this token.</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <div className="recipient-input-container">
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="scan-button"
                disabled={isSending}
                title="Scan QR Code"
              >
                📷
              </button>
              <button
                onClick={handlePaste}
                className="paste-button"
                disabled={isSending}
                title="Paste Address"
              >
                📋
              </button>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                disabled={isSending}
                className={recipientError ? 'input-error' : ''}
              />
            </div>
            {recipientError && <div className="field-error-message">{recipientError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            {selectedToken && (
              <div className="balance-info-top">
                Available: <span className="balance-amount">{selectedToken.balance}</span> {selectedToken.symbol}
              </div>
            )}
            <div className="amount-input-container">
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={isSending || !selectedToken}
                className={amountError ? 'input-error' : ''}
              />
              <button
                onClick={handleSetMaxAmount}
                className="max-button"
                disabled={isSending || !selectedToken}
              >
                MAX
              </button>
            </div>
            {amountError && <div className="field-error-message">{amountError}</div>}
            {selectedToken && !amountError && amount && Number(amount) > 0 && Number(amount) <= Number(selectedToken.balance) && (
              <div className="amount-preview">
                ≈ {((Number(amount) / Number(selectedToken.balance)) * 100).toFixed(2)}% of balance
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <Button
            onClick={handleClose}
            variant="secondary"
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            variant="primary"
            disabled={isSending || !selectedToken || !recipient || !amount || !!recipientError || !!amountError || (selectedToken !== null && parseFloat(selectedToken.balance) === 0)}
          >
            {isSending ? (
              <span className="sending-indicator">
                <Loading size="small" text="" /> Sending...
              </span>
            ) : selectedToken && parseFloat(selectedToken.balance) === 0 ? (
              `No ${selectedToken.symbol} Balance`
            ) : (
              selectedToken ? `Send ${selectedToken.symbol}` : 'No Token Selected'
            )}
          </Button>
        </div>
      </div>

      {isQRScannerOpen && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setIsQRScannerOpen(false)}
        />
      )}

      <style jsx>{`
        .modal-overlay {
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
          z-index: 1000;
          padding: 1rem;
        }

        .modal-container {
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(0, 0, 0, 0.98));
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(34, 211, 238, 0.1);
          color: #e5e7eb;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(34, 211, 238, 0.2);
          background: rgba(0, 0, 0, 0.3);
        }

        .modal-header h3 {
          margin: 0;
          color: #22d3ee;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .close-button {
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 6px;
          font-size: 1.5rem;
          cursor: pointer;
          color: #22d3ee;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          line-height: 1;
        }

        .close-button:hover {
          background: rgba(34, 211, 238, 0.2);
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.3);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid rgba(34, 211, 238, 0.2);
          background: rgba(0, 0, 0, 0.2);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        input {
          width: 100%;
          padding: 0.875rem;
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
          font-size: 0.95rem;
          background: rgba(0, 0, 0, 0.5);
          color: #e5e7eb;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #22d3ee;
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1), 0 0 12px rgba(34, 211, 238, 0.2);
          background: rgba(0, 0, 0, 0.7);
        }

        input::placeholder {
          color: #6b7280;
        }

        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        input.input-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1), 0 0 12px rgba(239, 68, 68, 0.2);
        }

        .field-error-message {
          color: #ef4444;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          padding-left: 0.25rem;
        }

        .balance-info-top {
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .balance-info-top .balance-amount {
          color: #22d3ee;
          font-weight: 600;
        }

        .amount-preview {
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: #6b7280;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          padding-left: 0.25rem;
        }

        /* Token Dropdown */
        .token-dropdown {
          position: relative;
        }

        .token-dropdown-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: all 0.2s;
          color: #e5e7eb;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          text-align: left;
        }

        .token-dropdown-trigger:hover:not(:disabled) {
          border-color: #22d3ee;
          background: rgba(34, 211, 238, 0.05);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.15);
        }

        .token-dropdown-trigger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .token-logo {
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dropdown-symbol {
          font-weight: 700;
          font-size: 0.95rem;
          color: #22d3ee;
        }

        .dropdown-name {
          font-size: 0.75rem;
          color: #9ca3af;
          flex: 1;
        }

        .dropdown-balance {
          font-size: 0.8rem;
          color: #9ca3af;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .dropdown-placeholder {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .dropdown-chevron {
          margin-left: auto;
          flex-shrink: 0;
          color: #6b7280;
          transition: transform 0.2s;
        }

        .dropdown-chevron.open {
          transform: rotate(180deg);
        }

        .token-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 20;
          background: rgba(10, 10, 20, 0.98);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
        }

        .token-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(34, 211, 238, 0.1);
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }

        .token-dropdown-item:last-child {
          border-bottom: none;
        }

        .token-dropdown-item:hover {
          background: rgba(34, 211, 238, 0.08);
        }

        .token-dropdown-item.selected {
          background: rgba(34, 211, 238, 0.12);
        }

        .dropdown-item-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          flex: 1;
          min-width: 0;
        }

        .dropdown-item-symbol {
          font-size: 0.875rem;
          font-weight: 700;
          color: #e5e7eb;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .dropdown-item-name {
          font-size: 0.7rem;
          color: #9ca3af;
        }

        .dropdown-item-balance {
          text-align: right;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .dropdown-item-balance .has-balance {
          font-size: 0.8rem;
          color: #22d3ee;
          font-weight: 600;
        }

        .dropdown-item-balance .no-balance-text {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .check-icon {
          color: #22d3ee;
          flex-shrink: 0;
        }

        .no-tokens-message {
          padding: 2rem;
          text-align: center;
          color: #9ca3af;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .no-tokens-message p {
          margin: 0;
          font-size: 0.85rem;
        }

        .warning-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          color: #fbbf24;
          font-size: 0.8rem;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          margin-bottom: 1rem;
        }

        .warning-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .recipient-input-container {
          display: flex;
          gap: 0.5rem;
        }

        .recipient-input-container input {
          flex: 1;
        }

        .paste-button,
        .scan-button {
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          color: #22d3ee;
          min-width: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .paste-button:hover:not(:disabled),
        .scan-button:hover:not(:disabled) {
          background: rgba(34, 211, 238, 0.2);
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.3);
        }

        .paste-button:disabled,
        .scan-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .amount-input-container {
          display: flex;
          gap: 0.5rem;
        }

        .max-button {
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          padding: 0 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          color: #22d3ee;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }

        .max-button:hover:not(:disabled) {
          background: rgba(34, 211, 238, 0.2);
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.3);
        }

        .max-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .transaction-info {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
        }

        .transaction-info p {
          margin: 0.5rem 0;
          color: #22d3ee;
        }

        .tx-hash {
          word-break: break-all;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          font-size: 0.85rem;
          margin: 0.5rem 0;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 6px;
          color: #22d3ee;
        }

        .block-explorer-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #22d3ee;
          text-decoration: none;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(34, 211, 238, 0.5);
          transition: all 0.2s;
        }

        .block-explorer-link:hover {
          color: #67e8f9;
          border-color: rgba(34, 211, 238, 0.8);
        }

        .error-message {
          color: #ef4444;
          margin-top: 1rem;
          font-size: 0.85rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }

        .sending-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Success screen */
        .success-body {
          padding: 2rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
        }

        .success-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.15);
          border: 2px solid rgba(34, 197, 94, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
        }

        .success-svg {
          width: 32px;
          height: 32px;
          stroke: #4ade80;
        }

        .success-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #e5e7eb;
        }

        .success-subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .tx-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding: 0.875rem 1rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .tx-box-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .tx-box-hash {
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          font-size: 0.8rem;
          color: #22d3ee;
          word-break: break-all;
        }

        .explorer-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #22d3ee;
          text-decoration: none;
          border-bottom: 1px solid rgba(34, 211, 238, 0.4);
          padding-bottom: 1px;
          transition: all 0.2s;
        }

        .explorer-link:hover {
          color: #67e8f9;
          border-color: rgba(34, 211, 238, 0.8);
        }

        .success-footer {
          padding: 1rem 1.5rem;
          display: flex;
          gap: 0.75rem;
          border-top: 1px solid rgba(34, 211, 238, 0.15);
        }

        .btn-secondary {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(55, 65, 81, 0.4);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(75, 85, 99, 0.5);
          color: #e5e7eb;
        }

        .btn-primary {
          flex: 1;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(34, 211, 238, 0.4);
          border-radius: 8px;
          color: #22d3ee;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3));
          border-color: rgba(34, 211, 238, 0.6);
          box-shadow: 0 0 16px rgba(34, 211, 238, 0.2);
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 0.5rem;
            align-items: flex-end;
          }

          .modal-container {
            max-width: 100%;
            border-radius: 16px 16px 0 0;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .modal-footer {
            padding: 1rem;
            flex-direction: column;
          }

          .success-footer {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SendTokenModal;
