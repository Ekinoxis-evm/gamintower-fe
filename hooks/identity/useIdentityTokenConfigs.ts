import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import IdentityNFT_JSON from '../../frontend/deployments/abi/IdentityNFT.json';

const IdentityNFT_ABI = IdentityNFT_JSON as unknown as Abi;

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

export interface TokenConfig {
  token: `0x${string}`;
  mintPrice: bigint;
  monthlyPrice: bigint;
  yearlyPrice: bigint;
  enabled: boolean;
}

export function useIdentityTokenConfigs(
  collectionAddress: `0x${string}` | undefined,
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['identity-token-configs', collectionAddress, chainId],
    queryFn: async (): Promise<TokenConfig[]> => {
      if (!collectionAddress) return [];

      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });

      const tokens = await client.readContract({
        address: collectionAddress,
        abi: IdentityNFT_ABI,
        functionName: 'getAcceptedTokens',
      }) as `0x${string}`[];

      if (tokens.length === 0) return [];

      const configs = await client.multicall({
        contracts: tokens.map((token) => ({
          address: collectionAddress,
          abi: IdentityNFT_ABI,
          functionName: 'tokenConfigs',
          args: [token],
        })),
        allowFailure: true,
      });

      return configs.map((result, i) => {
        if (result.status !== 'success') {
          return {
            token: tokens[i],
            mintPrice: BigInt(0),
            monthlyPrice: BigInt(0),
            yearlyPrice: BigInt(0),
            enabled: false,
          };
        }
        const [mintPrice, monthlyPrice, yearlyPrice, enabled] = result.result as [bigint, bigint, bigint, boolean];
        return {
          token: tokens[i],
          mintPrice,
          monthlyPrice,
          yearlyPrice,
          enabled,
        };
      });
    },
    enabled: Boolean(collectionAddress),
    staleTime: 1000 * 60,
    retry: 2,
  });
}
