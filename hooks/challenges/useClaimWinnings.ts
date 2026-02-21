import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData, type Abi } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';

export function useClaimWinnings() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const claimWinnings = async (
    vaultAddress: `0x${string}`,
    shares: bigint,
    userAddress: `0x${string}`,
    chainId: number,
  ) => {
    if (shares === BigInt(0)) throw new Error('No shares to claim.');

    const data = encodeFunctionData({
      abi: ChallengeVault_ABI as unknown as Abi,
      functionName: 'redeem',
      args: [shares, userAddress, userAddress],
    });
    await sendTransaction({ to: vaultAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
    await queryClient.invalidateQueries({ queryKey: ['vault-submissions'] });
  };

  return { claimWinnings };
}
