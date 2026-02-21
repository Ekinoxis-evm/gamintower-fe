import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData, type Abi } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';

export function useResolveDispute() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const resolveDispute = async (
    vaultAddress: `0x${string}`,
    winner: `0x${string}`,
    chainId: number,
  ) => {
    const data = encodeFunctionData({
      abi: ChallengeVault_ABI as unknown as Abi,
      functionName: 'resolveDispute',
      args: [winner],
    });
    await sendTransaction({ to: vaultAddress, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
    await queryClient.invalidateQueries({ queryKey: ['vault-submissions'] });
  };

  return { resolveDispute };
}
