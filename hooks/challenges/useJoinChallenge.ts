import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';

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

interface JoinChallengeParams {
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  stakeAmount: bigint;
  receiver: `0x${string}`;
  chainId: number;
}

export function useJoinChallenge() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const joinChallenge = async (params: JoinChallengeParams) => {
    const { vaultAddress, tokenAddress, stakeAmount, receiver, chainId } = params;

    // 1. Approve ERC20 spend on the vault
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, stakeAmount],
    });
    await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );

    // 2. Deposit to join as player2
    const depositData = encodeFunctionData({
      abi: ChallengeVault_ABI,
      functionName: 'deposit',
      args: [stakeAmount, receiver],
    });
    await sendTransaction(
      { to: vaultAddress, data: depositData, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
  };

  return { joinChallenge };
}
