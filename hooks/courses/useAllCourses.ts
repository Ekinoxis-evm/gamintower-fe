import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { getFactoryAddresses } from '../../config/contracts';
import CourseFactory_ABI from '../../frontend/deployments/abi/CourseFactory.json';

export function useAllCourses(chainId: number = 8453) {
  return useQuery({
    queryKey: ['all-courses', chainId],
    queryFn: async (): Promise<`0x${string}`[]> => {
      const addresses = getFactoryAddresses(chainId);
      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });
      const result = await client.readContract({
        address: addresses.courseFactory,
        abi: CourseFactory_ABI,
        functionName: 'getAllCourses',
      });
      return result as `0x${string}`[];
    },
    staleTime: 1000 * 60,
    retry: 2,
  });
}
