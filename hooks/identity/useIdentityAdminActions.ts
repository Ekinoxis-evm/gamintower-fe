import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';

export function useIdentityAdminActions() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const suspend = async (
    collectionAddress: `0x${string}`,
    tokenId: bigint,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'suspend',
      args: [tokenId],
    });
    await sendTransaction({ to: collectionAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['identity-status'] });
  };

  const unsuspend = async (
    collectionAddress: `0x${string}`,
    tokenId: bigint,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'unsuspend',
      args: [tokenId],
    });
    await sendTransaction({ to: collectionAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['identity-status'] });
  };

  const setTokenConfig = async (
    collectionAddress: `0x${string}`,
    token: `0x${string}`,
    mintPrice: bigint,
    monthlyPrice: bigint,
    yearlyPrice: bigint,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'setTokenConfig',
      args: [token, mintPrice, monthlyPrice, yearlyPrice],
    });
    await sendTransaction({ to: collectionAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['identity-token-configs'] });
  };

  const setTreasury = async (
    collectionAddress: `0x${string}`,
    newTreasury: `0x${string}`,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'setTreasury',
      args: [newTreasury],
    });
    await sendTransaction({ to: collectionAddress, data, chainId }, { sponsor: true });
  };

  const disableToken = async (
    collectionAddress: `0x${string}`,
    token: `0x${string}`,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'disableToken',
      args: [token],
    });
    await sendTransaction({ to: collectionAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['identity-token-configs'] });
  };

  return { suspend, unsuspend, setTokenConfig, setTreasury, disableToken };
}
