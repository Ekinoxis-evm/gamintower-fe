/**
 * useUserENS - Hook for querying user's ENS subdomain
 *
 * Resolution strategy:
 * 1. Check localStorage cache (instant)
 * 2. Try mainnet ENS reverse resolution
 */
import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { ENS_CONFIG, CHAIN_IDS, getRpcUrl } from '../../config/constants';
import { logger } from '../../utils/logger';

interface UserENSResult {
  subdomain: string | null;
  fullName: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useUserENS(address: string | undefined): UserENSResult {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    if (!address) {
      setSubdomain(null);
      return;
    }

    const fetchUserENS = async () => {
      setIsLoading(true);
      const cacheKey = `ens-subdomain-${address.toLowerCase()}`;

      try {
        // Layer 1: Check localStorage cache
        const cachedSubdomain = localStorage.getItem(cacheKey);
        if (cachedSubdomain) {
          logger.debug('[useUserENS] Found cached subdomain', { subdomain: cachedSubdomain });
          setSubdomain(cachedSubdomain);
          return;
        }

        // Layer 2: Mainnet ENS reverse resolution
        try {
          const mainnetClient = createPublicClient({
            chain: mainnet,
            transport: http(getRpcUrl(CHAIN_IDS.ETHEREUM)),
          });

          const ensName = await mainnetClient.getEnsName({
            address: address as `0x${string}`,
          });

          if (ensName && ensName.endsWith(`.${ENS_CONFIG.parentName}`)) {
            const label = ensName.replace(`.${ENS_CONFIG.parentName}`, '');
            try {
              localStorage.setItem(cacheKey, label);
            } catch {
              // Ignore storage errors
            }
            logger.debug('[useUserENS] Found subdomain via mainnet ENS', { label });
            setSubdomain(label);
            return;
          }
        } catch (mainnetError) {
          logger.debug('[useUserENS] Mainnet ENS resolution failed', mainnetError);
        }

        setSubdomain(null);
      } catch (error) {
        logger.error('[useUserENS] Query failed', error);
        setSubdomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserENS();
  }, [address, fetchTrigger]);

  const refetch = () => setFetchTrigger(prev => prev + 1);

  return {
    subdomain,
    fullName: subdomain ? `${subdomain}.${ENS_CONFIG.parentName}` : null,
    isLoading,
    refetch,
  };
}
