import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';

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

interface CreateChallengeParams {
  tokenAddress: `0x${string}`;
  stakeAmount: bigint;
  duration: bigint;
  metadataURI: string;
  chainId: number;
}

export function useCreateChallenge() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const createChallenge = async (params: CreateChallengeParams) => {
    const { tokenAddress, stakeAmount, duration, metadataURI, chainId } = params;
    const addresses = getFactoryAddresses(chainId);

    // 1. Approve ERC20 spend
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [addresses.vaultFactory, stakeAmount],
    });
    await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );

    // 2. Create challenge vault
    const createData = encodeFunctionData({
      abi: VaultFactory_ABI,
      functionName: 'createChallenge',
      args: [tokenAddress, stakeAmount, duration, metadataURI],
    });
    await sendTransaction(
      { to: addresses.vaultFactory, data: createData, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['all-vaults'] });
  };

  return { createChallenge };
}
