import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import CourseNFT_ABI from '../../frontend/deployments/abi/CourseNFT.json';

export function useCourseContent(
  courseAddress: `0x${string}` | undefined,
  tokenId: bigint | undefined,
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['course-content', courseAddress, tokenId?.toString(), chainId],
    queryFn: async (): Promise<string | null> => {
      if (!courseAddress || tokenId === undefined) return null;

      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });

      const result = await client.readContract({
        address: courseAddress,
        abi: CourseNFT_ABI,
        functionName: 'getCourseContent',
        args: [tokenId],
      }).catch(() => null);

      return result as string | null;
    },
    enabled: Boolean(courseAddress && tokenId !== undefined),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
