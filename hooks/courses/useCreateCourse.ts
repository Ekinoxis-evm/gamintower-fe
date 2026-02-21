import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import CourseFactory_ABI from '../../frontend/deployments/abi/CourseFactory.json';

interface CreateCourseParams {
  name: string;
  symbol: string;
  mintPrice: bigint;
  maxSupply: bigint;
  baseURI: string;
  contentURI: string;
  treasury: `0x${string}`;
  royaltyBps: bigint;
  chainId: number;
}

export function useCreateCourse() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const createCourse = async (params: CreateCourseParams) => {
    const { name, symbol, mintPrice, maxSupply, baseURI, contentURI, treasury, royaltyBps, chainId } = params;
    const addresses = getFactoryAddresses(chainId);

    const data = encodeFunctionData({
      abi: CourseFactory_ABI,
      functionName: 'createCourse',
      args: [name, symbol, mintPrice, maxSupply, baseURI, contentURI, treasury, royaltyBps],
    });

    await sendTransaction(
      { to: addresses.courseFactory, data, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['all-courses'] });
  };

  return { createCourse };
}
