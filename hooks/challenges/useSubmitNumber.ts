import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';

interface SubmitNumberParams {
  vaultAddress: `0x${string}`;
  number: bigint;
  chainId: number;
}

export function useSubmitNumber() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const submitNumber = async (params: SubmitNumberParams) => {
    const { vaultAddress, number, chainId } = params;

    const data = encodeFunctionData({
      abi: ChallengeVault_ABI,
      functionName: 'submitNumber',
      args: [number],
    });

    await sendTransaction(
      { to: vaultAddress, data, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
    await queryClient.invalidateQueries({ queryKey: ['vault-submissions'] });
  };

  return { submitNumber };
}
