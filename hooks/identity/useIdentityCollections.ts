import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { getFactoryAddresses } from '../../config/contracts';
import FactoryABI from '../../frontend/deployments/abi/IdentityNFTFactory.json';

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

export function useIdentityCollections(chainId: number = 8453) {
  return useQuery({
    queryKey: ['identity-collections', chainId],
    queryFn: async (): Promise<`0x${string}`[]> => {
      const addresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });
      const result = await client.readContract({
        address: addresses.identityNFTFactory,
        abi: FactoryABI,
        functionName: 'getAllCollections',
      });
      return result as `0x${string}`[];
    },
    staleTime: 1000 * 60,
    retry: 2,
  });
}
