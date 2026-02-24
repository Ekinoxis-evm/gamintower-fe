import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { getFactoryAddresses } from '../../config/contracts';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';

export function useAllVaults(chainId: number = 8453) {
  return useQuery({
    queryKey: ['all-vaults', chainId],
    queryFn: async (): Promise<`0x${string}`[]> => {
      const addresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });
      const result = await client.readContract({
        address: addresses.vaultFactory,
        abi: VaultFactory_ABI,
        functionName: 'getAllVaults',
      });
      return result as `0x${string}`[];
    },
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
