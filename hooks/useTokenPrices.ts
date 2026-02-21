import { useState, useEffect, useCallback } from 'react';
import { COINGECKO_IDS } from '../utils/tokenUtils';
import { logger } from '../utils/logger';

interface TokenPrices {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    cop: number;
  };
}

/**
 * Custom hook to fetch token prices from CoinGecko API
 * @returns Object containing token prices and loading state
 */
export function useTokenPrices() {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get comma-separated list of tokens to fetch
  const tokenIds = Object.values(COINGECKO_IDS).join(',');

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // CoinGecko API URL for price data (USD + COP)
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd,cop&include_24hr_change=true`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPrices(data);
    } catch (err) {
      logger.error('Error fetching token prices:', err);
      setError('Failed to fetch token prices');
      
      // Set fallback prices (1 USD ≈ 4200 COP, 1 EUR ≈ 4500 COP)
      setPrices({
        [COINGECKO_IDS.ETH]: { usd: 3500, usd_24h_change: 1.5, cop: 3500 * 4200 },
        [COINGECKO_IDS.USDC]: { usd: 1, usd_24h_change: 0.01, cop: 4200 },
        [COINGECKO_IDS.EURC]: { usd: 1.08, usd_24h_change: 0.02, cop: 4500 },
        [COINGECKO_IDS.USDT]: { usd: 1, usd_24h_change: 0.01, cop: 4200 }
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds]);

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 5 minutes
    const intervalId = setInterval(fetchPrices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  // Helper function to get price for a specific token (USD + COP)
  const getPriceForToken = useCallback((tokenSymbol: string): { price: number; change24h: number; cop: number } => {
    const coinId = COINGECKO_IDS[tokenSymbol];
    if (!coinId || !prices[coinId]) {
      // Return approximate fallback values for stablecoins
      if (tokenSymbol === 'EURC') return { price: 1.08, change24h: 0, cop: 4500 };
      if (tokenSymbol === 'USDC' || tokenSymbol === 'USDT') return { price: 1.00, change24h: 0, cop: 4200 };
      return { price: 0, change24h: 0, cop: 0 };
    }

    return {
      price: prices[coinId].usd || 0,
      change24h: prices[coinId].usd_24h_change || 0,
      cop: prices[coinId].cop || 0
    };
  }, [prices]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices,
    getPriceForToken
  };
} 