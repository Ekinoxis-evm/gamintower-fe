import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import CourseNFT_ABI from '../../frontend/deployments/abi/CourseNFT.json';

export function useCourseAdminActions() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const setMintPrice = async (courseAddress: `0x${string}`, newPrice: bigint, chainId: number) => {
    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'setMintPrice',
      args: [newPrice],
    });
    await sendTransaction({ to: courseAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['course-details'] });
  };

  const setPrivateContentURI = async (courseAddress: `0x${string}`, newURI: string, chainId: number) => {
    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'setPrivateContentURI',
      args: [newURI],
    });
    await sendTransaction({ to: courseAddress, data, chainId }, { sponsor: true });
  };

  const setBaseURI = async (courseAddress: `0x${string}`, newURI: string, chainId: number) => {
    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'setBaseURI',
      args: [newURI],
    });
    await sendTransaction({ to: courseAddress, data, chainId }, { sponsor: true });
  };

  const setTreasury = async (courseAddress: `0x${string}`, newTreasury: `0x${string}`, chainId: number) => {
    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'setTreasury',
      args: [newTreasury],
    });
    await sendTransaction({ to: courseAddress, data, chainId }, { sponsor: true });
  };

  const withdraw = async (courseAddress: `0x${string}`, chainId: number) => {
    const data = encodeFunctionData({
      abi: CourseNFT_ABI,
      functionName: 'withdraw',
      args: [],
    });
    await sendTransaction({ to: courseAddress, data, chainId }, { sponsor: true });
  };

  return { setMintPrice, setPrivateContentURI, setBaseURI, setTreasury, withdraw };
}
