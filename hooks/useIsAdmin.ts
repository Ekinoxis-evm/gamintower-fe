import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../config/networks';
import { getFactoryAddresses } from '../config/contracts';
import { useActiveWallet } from './useActiveWallet';

const OWNER_ABI = [
  {
    type: 'function' as const,
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view' as const,
  },
] as const;

/**
 * Checks whether the connected wallet is the owner of any factory contract.
 * Uses multicall to batch all 3 owner() reads into a single RPC request.
 */
export function useIsAdmin(chainId: number = 8453) {
  const { address } = useActiveWallet();

  return useQuery({
    queryKey: ['is-admin', address, chainId],
    queryFn: async (): Promise<boolean> => {
      if (!address) return false;

      const factoryAddresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });

      const results = await client.multicall({
        contracts: [
          { address: factoryAddresses.identityNFTFactory, abi: OWNER_ABI, functionName: 'owner' },
          { address: factoryAddresses.vaultFactory, abi: OWNER_ABI, functionName: 'owner' },
          { address: factoryAddresses.courseFactory, abi: OWNER_ABI, functionName: 'owner' },
        ],
      });

      const normalizedAddress = address.toLowerCase();
      return results.some(
        (r) =>
          r.status === 'success' &&
          typeof r.result === 'string' &&
          r.result.toLowerCase() === normalizedAddress
      );
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes — ownership rarely changes
    retry: 2,
  });
}
