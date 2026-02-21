import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { CourseInfo } from '../../types/index';
import CourseNFT_JSON from '../../frontend/deployments/abi/CourseNFT.json';

const CourseNFT_ABI = CourseNFT_JSON as unknown as Abi;

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

export function useCourseDetails(
  courseAddresses: `0x${string}`[],
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['course-details', courseAddresses, chainId],
    queryFn: async (): Promise<CourseInfo[]> => {
      if (courseAddresses.length === 0) return [];

      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });

      const fields = ['name', 'symbol', 'mintPrice', 'maxSupply', 'totalSupply', 'canMint'] as const;
      const calls = courseAddresses.flatMap((address) =>
        fields.map((field) => ({
          address,
          abi: CourseNFT_ABI,
          functionName: field,
          args: [] as [],
        })),
      );

      const results = await client.multicall({ contracts: calls, allowFailure: true });

      return courseAddresses.map((address, i) => {
        const base = i * fields.length;
        const get = (j: number) => results[base + j];

        return {
          address,
          name: get(0).status === 'success' ? (get(0).result as string) : '',
          symbol: get(1).status === 'success' ? (get(1).result as string) : '',
          mintPrice: get(2).status === 'success' ? (get(2).result as bigint) : BigInt(0),
          maxSupply: get(3).status === 'success' ? (get(3).result as bigint) : BigInt(0),
          totalSupply: get(4).status === 'success' ? (get(4).result as bigint) : BigInt(0),
          canMint: get(5).status === 'success' ? (get(5).result as boolean) : false,
        };
      });
    },
    enabled: courseAddresses.length > 0,
    staleTime: 1000 * 30,
    retry: 2,
  });
}
