import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import type { Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getChainRpc } from '../../config/networks';
import { VaultInfo, ChallengeState } from '../../types/index';
import ChallengeVault_JSON from '../../frontend/deployments/abi/ChallengeVault.json';

const ChallengeVault_ABI = ChallengeVault_JSON as unknown as Abi;

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export function useVaultDetails(
  vaultAddresses: `0x${string}`[],
  chainId: number = 8453,
) {
  return useQuery({
    queryKey: ['vault-details', vaultAddresses, chainId],
    queryFn: async (): Promise<VaultInfo[]> => {
      if (vaultAddresses.length === 0) return [];

      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getChainRpc(chainId)),
      });

      const fields = ['asset', 'state', 'player1', 'player2', 'stakeAmount', 'endTime', 'winner', 'metadataURI'] as const;
      const calls = vaultAddresses.flatMap((address) =>
        fields.map((field) => ({
          address,
          abi: ChallengeVault_ABI,
          functionName: field,
          args: [] as [],
        })),
      );

      const results = await client.multicall({ contracts: calls, allowFailure: true });

      return vaultAddresses.map((address, i) => {
        const base = i * fields.length;
        const get = (j: number) => results[base + j];

        const assetResult  = get(0);
        const stateResult  = get(1);
        const player1Result = get(2);
        const player2Result = get(3);
        const stakeResult  = get(4);
        const endTimeResult = get(5);
        const winnerResult = get(6);
        const metaResult   = get(7);

        return {
          address,
          token: (assetResult.status === 'success' ? assetResult.result : ZERO_ADDRESS) as `0x${string}`,
          state: (stateResult.status === 'success' ? Number(stateResult.result as bigint) : 0) as ChallengeState,
          player1: (player1Result.status === 'success' ? player1Result.result : ZERO_ADDRESS) as `0x${string}`,
          player2: (player2Result.status === 'success' ? player2Result.result : ZERO_ADDRESS) as `0x${string}`,
          stakeAmount: stakeResult.status === 'success' ? (stakeResult.result as bigint) : BigInt(0),
          endTime: endTimeResult.status === 'success' ? (endTimeResult.result as bigint) : BigInt(0),
          winner: (winnerResult.status === 'success' ? winnerResult.result : ZERO_ADDRESS) as `0x${string}`,
          metadataURI: metaResult.status === 'success' ? (metaResult.result as string) : '',
        };
      });
    },
    enabled: vaultAddresses.length > 0,
    staleTime: 1000 * 15,
    retry: 2,
  });
}
