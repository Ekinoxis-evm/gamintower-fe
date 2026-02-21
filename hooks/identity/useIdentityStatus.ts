import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { IdentityStatus } from '../../types/index';
import IdentityNFT_JSON from '../../frontend/deployments/abi/IdentityNFT.json';

const IdentityNFT_ABI = IdentityNFT_JSON as unknown as Abi;

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

const STATUS_MAP: Record<number, 'Active' | 'Expired' | 'Suspended'> = {
  0: 'Active',
  1: 'Expired',
  2: 'Suspended',
};

const DEFAULT_STATUS: IdentityStatus = {
  isValid: false,
  status: 'None',
  expiry: null,
  tokenId: BigInt(0),
};

export function useIdentityStatus(
  userAddress: string | undefined,
  collectionAddress: `0x${string}` | undefined,
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['identity-status', userAddress, collectionAddress, chainId],
    queryFn: async (): Promise<IdentityStatus> => {
      if (!userAddress || !collectionAddress) return DEFAULT_STATUS;

      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });

      const [isValidResult, tokenIdResult, expiryResult] = await client.multicall({
        contracts: [
          {
            address: collectionAddress,
            abi: IdentityNFT_ABI,
            functionName: 'isValid',
            args: [userAddress as `0x${string}`],
          },
          {
            address: collectionAddress,
            abi: IdentityNFT_ABI,
            functionName: 'tokenIdOf',
            args: [userAddress as `0x${string}`],
          },
          {
            address: collectionAddress,
            abi: IdentityNFT_ABI,
            functionName: 'expiryOfUser',
            args: [userAddress as `0x${string}`],
          },
        ],
        allowFailure: true,
      });

      const isValid = isValidResult.status === 'success' ? (isValidResult.result as boolean) : false;
      const tokenId = tokenIdResult.status === 'success' ? (tokenIdResult.result as bigint) : BigInt(0);
      const expiry = expiryResult.status === 'success' ? (expiryResult.result as bigint) : null;

      if (tokenId === BigInt(0)) {
        return DEFAULT_STATUS;
      }

      // Get status of the token
      const statusResult = await client.readContract({
        address: collectionAddress,
        abi: IdentityNFT_ABI,
        functionName: 'statusOf',
        args: [tokenId],
      }).catch(() => null);

      const statusNum = statusResult !== null ? Number(statusResult as bigint) : 0;
      const status = isValid ? (STATUS_MAP[statusNum] ?? 'Active') : 'Expired';

      return {
        isValid,
        status,
        expiry: expiry ?? null,
        tokenId,
      };
    },
    enabled: Boolean(userAddress && collectionAddress),
    staleTime: 1000 * 30,
    retry: 2,
  });
}
