import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import IdentityNFT_JSON from '../../frontend/deployments/abi/IdentityNFT.json';

const IdentityNFT_ABI = IdentityNFT_JSON as unknown as Abi;

export interface CollectionInfo {
  name: string;
  city: string;
  soulbound: boolean;
  totalSupply: bigint;
  treasury: `0x${string}`;
}

export function useCollectionInfo(
  collectionAddress: `0x${string}` | undefined,
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['identity-collection-info', collectionAddress, chainId],
    queryFn: async (): Promise<CollectionInfo> => {
      if (!collectionAddress) {
        return { name: '', city: '', soulbound: false, totalSupply: BigInt(0), treasury: '0x0000000000000000000000000000000000000000' };
      }

      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });

      const results = await client.multicall({
        contracts: [
          { address: collectionAddress, abi: IdentityNFT_ABI, functionName: 'name' },
          { address: collectionAddress, abi: IdentityNFT_ABI, functionName: 'city' },
          { address: collectionAddress, abi: IdentityNFT_ABI, functionName: 'soulbound' },
          { address: collectionAddress, abi: IdentityNFT_ABI, functionName: 'totalSupply' },
          { address: collectionAddress, abi: IdentityNFT_ABI, functionName: 'treasury' },
        ],
        allowFailure: true,
      });

      return {
        name: results[0].status === 'success' ? (results[0].result as string) : '',
        city: results[1].status === 'success' ? (results[1].result as string) : '',
        soulbound: results[2].status === 'success' ? (results[2].result as boolean) : false,
        totalSupply: results[3].status === 'success' ? (results[3].result as bigint) : BigInt(0),
        treasury: results[4].status === 'success' ? (results[4].result as `0x${string}`) : '0x0000000000000000000000000000000000000000',
      };
    },
    enabled: Boolean(collectionAddress),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
