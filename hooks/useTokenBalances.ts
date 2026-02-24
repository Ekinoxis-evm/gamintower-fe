import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { TokenBalance } from '../types/index';
import { getChainRpc } from '../config/networks';
import { ONEUP_TOKEN_ADDRESS } from '../config/constants';
import { logger } from '../utils/logger';

// Token addresses on Base mainnet
const BASE_TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
};

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const DEFAULT_BALANCES: TokenBalance = {
  ethBalance: '0',
  uscBalance: '0',
  eurcBalance: '0',
  usdtBalance: '0',
  oneUpBalance: '0',
};

/**
 * Custom hook to fetch token balances on Base mainnet using multicall
 * @param address The wallet address
 */
export function useTokenBalances(address: string | undefined) {
  const query = useQuery({
    queryKey: ['token-balances', address],
    queryFn: async (): Promise<TokenBalance> => {
      if (!address) return DEFAULT_BALANCES;

      const client = createPublicClient({
        chain: base,
        transport: http(getChainRpc(8453)),
      });

      const calls: {
        address: `0x${string}`;
        abi: typeof ERC20_ABI;
        functionName: 'balanceOf';
        args: [`0x${string}`];
      }[] = [
        { address: BASE_TOKENS.USDC as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
        { address: BASE_TOKENS.EURC as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
        { address: BASE_TOKENS.USDT as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
        { address: ONEUP_TOKEN_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      ];
      const tokenOrder: ('USDC' | 'EURC' | 'USDT' | '1UP')[] = ['USDC', 'EURC', 'USDT', '1UP'];

      const [ethBalance, tokenResults] = await Promise.all([
        client.getBalance({ address: address as `0x${string}` }),
        client.multicall({ contracts: calls, allowFailure: true }),
      ]);

      const balanceMap: Record<string, bigint> = {
        USDC: BigInt(0),
        EURC: BigInt(0),
        USDT: BigInt(0),
        '1UP': BigInt(0),
      };

      tokenResults.forEach((result, index) => {
        const token = tokenOrder[index];
        if (result.status === 'success' && result.result !== undefined) {
          balanceMap[token] = result.result as bigint;
        } else {
          logger.debug(`Failed to fetch ${token} balance`, result.error);
        }
      });

      return {
        ethBalance: formatUnits(ethBalance, 18),
        uscBalance: formatUnits(balanceMap.USDC, 6),
        eurcBalance: formatUnits(balanceMap.EURC, 6),
        usdtBalance: formatUnits(balanceMap.USDT, 6),
        oneUpBalance: formatUnits(balanceMap['1UP'], 18),
      };
    },
    enabled: Boolean(address),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  return {
    balances: query.data ?? DEFAULT_BALANCES,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
