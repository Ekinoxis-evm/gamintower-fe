import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, type Abi } from 'viem';
import { base } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';

const VAULT_ABI = ChallengeVault_ABI as unknown as Abi;

export interface VaultSubmissions {
  player1Submitted: boolean;
  player2Submitted: boolean;
  player1Number: bigint;
  player2Number: bigint;
  userShares: bigint;
}

export function useVaultSubmissions(
  vaultAddress: `0x${string}`,
  player1: `0x${string}`,
  player2: `0x${string}`,
  userAddress: string | undefined,
  chainId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['vault-submissions', vaultAddress, userAddress, chainId],
    queryFn: async (): Promise<VaultSubmissions> => {
      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(chainId)),
      });

      const contracts: Parameters<typeof client.multicall>[0]['contracts'] = [
        { address: vaultAddress, abi: VAULT_ABI, functionName: 'hasSubmitted', args: [player1] },
        { address: vaultAddress, abi: VAULT_ABI, functionName: 'hasSubmitted', args: [player2] },
        { address: vaultAddress, abi: VAULT_ABI, functionName: 'submittedNumber', args: [player1] },
        { address: vaultAddress, abi: VAULT_ABI, functionName: 'submittedNumber', args: [player2] },
        ...(userAddress
          ? [{ address: vaultAddress, abi: VAULT_ABI, functionName: 'balanceOf', args: [userAddress as `0x${string}`] }]
          : []),
      ];

      const results = await client.multicall({ contracts, allowFailure: true });

      return {
        player1Submitted: results[0].status === 'success' ? (results[0].result as boolean) : false,
        player2Submitted: results[1].status === 'success' ? (results[1].result as boolean) : false,
        player1Number: results[2].status === 'success' ? (results[2].result as bigint) : BigInt(0),
        player2Number: results[3].status === 'success' ? (results[3].result as bigint) : BigInt(0),
        userShares: results[4]?.status === 'success' ? (results[4].result as bigint) : BigInt(0),
      };
    },
    enabled: enabled && Boolean(player1) && Boolean(player2),
    staleTime: 1000 * 10,
    retry: 2,
  });
}
