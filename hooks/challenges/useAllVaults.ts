import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { getFactoryAddresses } from '../../config/contracts';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

export function useAllVaults(chainId: number = 8453) {
  return useQuery({
    queryKey: ['all-vaults', chainId],
    queryFn: async (): Promise<`0x${string}`[]> => {
      const addresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });
      const result = await client.readContract({
        address: addresses.vaultFactory,
        abi: VaultFactory_ABI,
        functionName: 'getAllVaults',
      });
      return result as `0x${string}`[];
    },
    staleTime: 1000 * 30,
    retry: 2,
  });
}
