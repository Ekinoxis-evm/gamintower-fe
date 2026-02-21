import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { resolveIpfsUrl } from '../../utils/ipfs';
import IdentityNFT_JSON from '../../frontend/deployments/abi/IdentityNFT.json';

const IdentityNFT_ABI = IdentityNFT_JSON as unknown as Abi;

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  name?: string;
  image?: string;
  external_url?: string;
  description?: string;
  attributes?: NFTAttribute[];
}

export function useIdentityMetadata(
  collectionAddress: `0x${string}` | undefined,
  tokenId: bigint | undefined,
  chainId: number = 8453,
) {
  const hasToken = Boolean(
    collectionAddress && tokenId !== undefined && tokenId > BigInt(0),
  );

  return useQuery({
    queryKey: ['identity-metadata', collectionAddress, tokenId?.toString(), chainId],
    queryFn: async (): Promise<NFTMetadata | null> => {
      if (!collectionAddress || tokenId === undefined || tokenId === BigInt(0)) return null;

      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });

      // 1. Read tokenURI from contract
      const tokenUri = await client.readContract({
        address: collectionAddress,
        abi: IdentityNFT_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }).catch(() => null) as string | null;

      if (!tokenUri) return null;

      // 2. Resolve IPFS → HTTP and fetch metadata JSON
      const url = resolveIpfsUrl(tokenUri);
      const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      if (!res.ok) return null;

      const metadata = await res.json() as NFTMetadata;
      return metadata;
    },
    enabled: hasToken,
    staleTime: 1000 * 60 * 10, // metadata rarely changes
    retry: 1,
  });
}
