import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import CourseNFT_ABI from '../../frontend/deployments/abi/CourseNFT.json';

interface MintCourseParams {
  courseAddress: `0x${string}`;
  mintPrice: bigint;
  chainId: number;
}

export function useMintCourse() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const mintCourse = async (params: MintCourseParams) => {
    const { courseAddress, mintPrice, chainId } = params;

    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'mint',
      args: [],
    });

    await sendTransaction(
      { to: courseAddress, data, value: mintPrice, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['course-details'] });
  };

  return { mintCourse };
}
