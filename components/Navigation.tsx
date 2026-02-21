import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getChainRpc } from '../config/networks';
import { logger } from '../utils/logger';

// Icons as simple SVG components for cleaner mobile menu
const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);
const IdentityIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const ChallengesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);
const CoursesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const SUPPORTED_CHAINS = [
  { id: 8453, name: 'Base', logo: '/chains/base.jpeg' },
  { id: 1, name: 'Ethereum', logo: '/chains/ethereum.png' },
  { id: 10, name: 'Optimism', logo: '/chains/op mainnet.png' },
  { id: 130, name: 'Unichain', logo: '/chains/unichain.png' },
];

interface NavigationProps {
  className?: string;
  currentChainId?: number;
  onChainChange?: (chainId: number) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  className = '',
  currentChainId = 8453,
  onChainChange
}) => {
  const router = useRouter();
  const { authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const [displayChainId, setDisplayChainId] = useState(currentChainId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Sync displayChainId with prop
  useEffect(() => {
    setDisplayChainId(currentChainId);
  }, [currentChainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  const userWallet = wallets?.[0];

  const mainNavItems = [
    { href: '/wallet', label: 'Wallet', icon: WalletIcon },
    { href: '/identity', label: 'Identity', icon: IdentityIcon },
    { href: '/challenges', label: 'Challenges', icon: ChallengesIcon },
    { href: '/courses', label: 'Courses', icon: CoursesIcon },
  ];

  // Lock body scroll and signal mobile menu state when open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-mobile-menu-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-menu-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + '/');
  const currentChain = SUPPORTED_CHAINS.find(c => c.id === displayChainId) || SUPPORTED_CHAINS[0];

  // Chain configurations for adding new chains (uses centralized RPC config)
  const CHAIN_CONFIGS: Record<number, any> = {
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(8453)],
      blockExplorerUrls: ['https://basescan.org'],
    },
    1: {
      chainId: '0x1',
      chainName: 'Ethereum',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(1)],
      blockExplorerUrls: ['https://etherscan.io'],
    },
    10: {
      chainId: '0xa',
      chainName: 'Optimism',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(10)],
      blockExplorerUrls: ['https://optimistic.etherscan.io'],
    },
    130: {
      chainId: '0x82',
      chainName: 'Unichain',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(130)],
      blockExplorerUrls: ['https://unichain.blockscout.com'],
    },
  };

  // Helper to check if error indicates chain needs to be added
  const isChainNotFoundError = (error: any): boolean => {
    if (!error) return false;
    // Check common error codes
    if (error.code === 4902 || error.code === -32603) return true;
    // Check error message for common patterns
    const message = (error.message || '').toLowerCase();
    return (
      message.includes('unsupported chainid') ||
      message.includes('unrecognized chain') ||
      message.includes('chain not found') ||
      message.includes('unknown chain') ||
      message.includes('not supported')
    );
  };

  // Switch wallet chain
  const handleChainSwitch = async (chainId: number) => {
    if (!userWallet || isSwitching) return;
    if (chainId === displayChainId) {
      setIsDropdownOpen(false);
      return;
    }

    setIsSwitching(true);
    setIsDropdownOpen(false);

    try {
      const provider = await userWallet.getEthereumProvider();
      const chainHex = `0x${chainId.toString(16)}`;
      const chainConfig = CHAIN_CONFIGS[chainId];

      // For less common chains like Unichain, try adding first
      if (chainId === 130 && chainConfig) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
        } catch (addError: any) {
          // Ignore if chain already exists (some wallets throw, some don't)
          if (addError.code !== 4001) {
            logger.debug('Chain add attempt', { message: addError.message });
          }
        }
      }

      try {
        // Try to switch to the chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        });
      } catch (switchError: any) {
        // If chain doesn't exist, try adding it
        if (isChainNotFoundError(switchError)) {
          if (chainConfig) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig],
            });
            // After adding, some wallets auto-switch, some don't - try switching again
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainHex }],
              });
            } catch {
              // Ignore - chain was added, user may need to switch manually
            }
          } else {
            throw new Error(`Chain configuration not found for chainId ${chainId}`);
          }
        } else {
          throw switchError;
        }
      }

      // Update state after successful switch
      setDisplayChainId(chainId);
      onChainChange?.(chainId);

    } catch (error: any) {
      logger.error('Error switching chain', error);
      // Only show alert for non-user-rejected errors
      if (error.code !== 4001) {
        const chainName = SUPPORTED_CHAINS.find(c => c.id === chainId)?.name || `Chain ${chainId}`;
        // Provide more helpful message for Unichain
        if (chainId === 130) {
          alert(`Unable to switch to Unichain. Your wallet may not support this network yet. Try adding it manually in your wallet settings with RPC: https://rpc.unichain.org`);
        } else {
          alert(`Failed to switch to ${chainName}: ${error.message || 'Unknown error'}`);
        }
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!authenticated) return null;

  return (
    <nav className={`bg-black border-b border-cyan-500/30 sticky top-0 z-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logotethcali.png"
              alt="ETH CALI"
              width={200}
              height={96}
              className="h-7 sm:h-8 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 rounded-lg font-mono text-xs transition-all uppercase
                  ${isActive(item.href)
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side: Chain + Actions */}
          <div className="flex items-center gap-2">

            {/* Chain Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isSwitching}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gray-900 border rounded-lg text-xs font-mono transition-all duration-200 ${
                  isSwitching
                    ? 'border-yellow-500/50 text-yellow-400'
                    : isDropdownOpen
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-gray-700 text-gray-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {isSwitching ? (
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Image src={currentChain.logo} alt={currentChain.name} width={20} height={20} className="w-5 h-5 rounded-full object-contain" unoptimized />
                  )}
                </div>
                <span className="hidden sm:inline">{isSwitching ? 'Switching...' : currentChain.name}</span>
                <span className={`text-gray-500 transition-transform duration-200 text-[10px] ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] overflow-hidden transition-all duration-200 origin-top ${
                  isDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={isSwitching}
                    className={`w-full px-3 py-2.5 text-left text-xs font-mono flex items-center gap-2 transition-all duration-150 ${
                      displayChainId === chain.id
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Image src={chain.logo} alt={chain.name} width={20} height={20} className="w-5 h-5 rounded-full object-contain" unoptimized />
                    </div>
                    <span className="flex-1">{chain.name}</span>
                    {displayChainId === chain.id && (
                      <span className="text-cyan-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout - Desktop */}
            <button
              onClick={logout}
              className="hidden sm:block px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono transition-all"
            >
              EXIT
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Menu - Full screen slide-in drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />

        {/* Drawer Panel */}
        <div
          ref={mobileMenuRef}
          className={`absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-slate-950 flex flex-col shadow-2xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header with close button */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Image
                src={currentChain.logo}
                alt={currentChain.name}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full ring-2 ring-slate-700"
                unoptimized
              />
              <div className="min-w-0">
                <p className="text-xs text-white font-medium">{currentChain.name}</p>
                {userWallet && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {userWallet.address.slice(0, 6)}...{userWallet.address.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 -mr-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/50 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links - Scrollable area */}
          <div className="flex-1 overflow-y-auto overscroll-contain py-2">
            {/* Main Navigation */}
            <div className="px-3 space-y-1">
              {mainNavItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-slate-300 active:bg-slate-800'
                      }
                    `}
                  >
                    <span className={active ? 'text-cyan-400' : 'text-slate-500'}>
                      <IconComponent />
                    </span>
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </Link>
                );
              })}
            </div>

          </div>

          {/* Footer - Always visible logout */}
          <div className="flex-shrink-0 border-t border-slate-800/80 p-3 bg-slate-950/95 backdrop-blur-sm">
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
