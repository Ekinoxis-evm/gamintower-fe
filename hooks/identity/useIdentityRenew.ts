import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';
import type { MintPeriod } from './useIdentityMint';

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

interface RenewParams {
  collectionAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  approvalAmount: bigint;
  tokenId: bigint;
  period: MintPeriod;
  chainId: number;
}

export function useIdentityRenew() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const renew = async (params: RenewParams) => {
    const { collectionAddress, tokenAddress, approvalAmount, tokenId, period, chainId } = params;

    // 1. Approve ERC20 spend
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [collectionAddress, approvalAmount],
    });
    await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );

    // 2. Renew identity NFT
    const renewData = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'renew',
      args: [tokenId, period, tokenAddress],
    });
    await sendTransaction(
      { to: collectionAddress, data: renewData, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['identity-status'] });
  };

  return { renew };
}
