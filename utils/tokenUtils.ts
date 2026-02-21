
// CoinGecko IDs for tokens
export const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  USDC: 'usd-coin',
  EURC: 'euro-coin',
  USDT: 'tether'
};

// Base URL for CoinGecko images
const COINGECKO_IMAGE_URL = 'https://assets.coingecko.com/coins/images';

export interface TokenMeta {
  symbol: string;
  name: string;
  logoUrl: string;
  decimals: number;
}

// Known token metadata keyed by lowercase address
const TOKEN_META_BY_ADDRESS: Record<string, TokenMeta> = {
  // 1UP — Base Mainnet
  '0xf6813c71e620c654ff6049a485e38d9494efabdf': {
    symbol: '1UP',
    name: '1UP Token',
    logoUrl: '/tokens/1up.png',
    decimals: 18,
  },
  // USDC — Base Mainnet
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    symbol: 'USDC',
    name: 'USD Coin',
    logoUrl: `${COINGECKO_IMAGE_URL}/6319/large/USD_Coin_icon.png`,
    decimals: 6,
  },
  // EURC — Base Mainnet
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': {
    symbol: 'EURC',
    name: 'Euro Coin',
    logoUrl: `${COINGECKO_IMAGE_URL}/26045/large/euro-coin.png`,
    decimals: 6,
  },
};

/**
 * Resolve token metadata (symbol, name, logo, decimals) from a contract address.
 * Falls back to a truncated address display for unknown tokens.
 */
export function getTokenMetaByAddress(address: string): TokenMeta {
  const meta = TOKEN_META_BY_ADDRESS[address.toLowerCase()];
  if (meta) return meta;
  return {
    symbol: `${address.slice(0, 6)}…${address.slice(-4)}`,
    name: 'Unknown Token',
    logoUrl: '/images/token-default.png',
    decimals: 18,
  };
}

// Fallback images in case CoinGecko fails
const FALLBACK_IMAGES: Record<string, string> = {
  ETH: '/images/ethereum.png',
  USDC: '/images/usdc.png',
  EURC: '/images/eurc.png',
  USDT: '/images/usdt.png',
  DEFAULT: '/images/token-default.png'
};

/**
 * Get token logo URL from CoinGecko
 * @param tokenSymbol The token symbol (ETH, USDC, EURC)
 * @returns The URL to the token logo
 */
export function getTokenLogoUrl(tokenSymbol: string): string {
  const symbol = tokenSymbol.toUpperCase();

  switch (symbol) {
    case 'ETH':
      return `${COINGECKO_IMAGE_URL}/279/large/ethereum.png`;
    case 'USDC':
      return `${COINGECKO_IMAGE_URL}/6319/large/USD_Coin_icon.png`;
    case 'EURC':
      return `${COINGECKO_IMAGE_URL}/26045/large/euro-coin.png`;
    case 'USDT':
      return `${COINGECKO_IMAGE_URL}/325/large/Tether.png`;
    case '1UP':
      return '/tokens/1up.png';
    default:
      return FALLBACK_IMAGES[symbol] || FALLBACK_IMAGES.DEFAULT;
  }
}

/**
 * Get network logo URL using local chain logos from public/chains folder
 * @param networkId The network ID (1 for Ethereum, 8453 for Base, 10 for Optimism)
 * @returns The URL to the network logo
 */
export function getNetworkLogoUrl(networkId: number): string {
  switch (networkId) {
    case 1: // Ethereum Mainnet
      return '/chains/ethereum.png';
    case 8453: // Base Mainnet
      return '/chains/base.jpeg';
    case 10: // Optimism Mainnet
      return '/chains/op mainnet.png';
    default:
      // Fallback to default
      return '/images/network-default.png';
  }
}

/**
 * Format token balance for display
 * @param balance The balance as a string
 * @param decimals Number of decimals to display
 * @returns Formatted balance string
 */
export function formatTokenBalance(balance: string, decimals: number = 6): string {
  const value = parseFloat(balance);
  if (isNaN(value)) return '0.00';
  
  // For very small amounts, don't show scientific notation
  if (value < 0.000001 && value > 0) {
    return '< 0.000001';
  }
  
  return value.toFixed(decimals);
}
