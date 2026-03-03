import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, encodeFunctionData, maxUint256 } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction } from '@privy-io/react-auth';
import { getRpcUrl, type ChainId } from '../../config/constants';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';

const ERC20_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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
  userAddress: `0x${string}`;
  approvalAmount: bigint;
  metadataURI: string;
  period: MintPeriod;
  chainId: number;
}

export function useIdentityMint() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const mint = async (params: MintParams) => {
    const { collectionAddress, tokenAddress, userAddress, approvalAmount, metadataURI, period, chainId } = params;

    const client = createPublicClient({
      chain: base,
      transport: http(getRpcUrl(chainId as ChainId)),
    });

    // Check existing allowance — skip approve if already sufficient.
    // Approve maxUint256 when needed so future mint/renew ops for this
    // token+collection pair skip this step entirely.
    const currentAllowance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, collectionAddress],
    }) as bigint;

    if (currentAllowance < approvalAmount) {
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [collectionAddress, maxUint256],
      });
      await sendTransaction(
        { to: tokenAddress, data: approveData, chainId },
        { sponsor: true },
      );
    }

    // Mint identity NFT
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
