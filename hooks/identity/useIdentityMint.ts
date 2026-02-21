import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';

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

// Period enum: 0 = Monthly, 1 = Yearly
export type MintPeriod = 0 | 1;

interface MintParams {
  collectionAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  approvalAmount: bigint;
  metadataURI: string;
  period: MintPeriod;
  chainId: number;
}

export function useIdentityMint() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const mint = async (params: MintParams) => {
    const { collectionAddress, tokenAddress, approvalAmount, metadataURI, period, chainId } = params;

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

    // 2. Mint identity NFT
    const mintData = encodeFunctionData({
      abi: IdentityNFT_ABI,
      functionName: 'mint',
      args: [metadataURI, period, tokenAddress],
    });
    await sendTransaction(
      { to: collectionAddress, data: mintData, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['identity-status'] });
  };

  return { mint };
}
