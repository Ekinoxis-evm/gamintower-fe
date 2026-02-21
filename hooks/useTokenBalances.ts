import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits } from 'viem';
import { base, mainnet, optimism, baseSepolia } from 'viem/chains';
import { TokenBalance } from '../types/index';
import { getChainRpc } from '../config/networks';
import { ONEUP_TOKEN_ADDRESS } from '../config/constants';
import { logger } from '../utils/logger';

// Chain IDs
const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
  OPTIMISM: 10,
  UNICHAIN: 130,
  BASE_SEPOLIA: 84532,
} as const;

// Token addresses by network
const TOKEN_ADDRESSES: Record<number, { USDC: string; EURC?: string; USDT?: string }> = {
  // Base Network
  [CHAIN_IDS.BASE]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    EURC: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  },
  // Ethereum Mainnet
  [CHAIN_IDS.ETHEREUM]: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    EURC: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  // Optimism
  [CHAIN_IDS.OPTIMISM]: {
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
  // Unichain
  [CHAIN_IDS.UNICHAIN]: {
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
  },
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

// Get chain name for logging
const getChainName = (id: number): string => {
  switch (id) {
    case CHAIN_IDS.ETHEREUM: return 'Ethereum';
    case CHAIN_IDS.BASE: return 'Base';
    case CHAIN_IDS.OPTIMISM: return 'Optimism';
    case CHAIN_IDS.UNICHAIN: return 'Unichain';
    case CHAIN_IDS.BASE_SEPOLIA: return 'Base Sepolia';
    default: return `Chain ${id}`;
  }
};

// Get chain config for viem
const getChainForId = (id: number) => {
  switch (id) {
    case CHAIN_IDS.ETHEREUM: return mainnet;
    case CHAIN_IDS.OPTIMISM: return optimism;
    case CHAIN_IDS.BASE_SEPOLIA: return baseSepolia;
    default: return base;
  }
};

const DEFAULT_BALANCES: TokenBalance = {
  ethBalance: '0',
  uscBalance: '0',
  eurcBalance: '0',
  usdtBalance: '0',
  oneUpBalance: '0',
};

/**
 * Custom hook to fetch token balances using multicall for efficiency
 * @param address The wallet address
 * @param chainId The chain ID
 */
export function useTokenBalances(address: string | undefined, chainId: number = CHAIN_IDS.BASE) {
  const query = useQuery({
    queryKey: ['token-balances', address, chainId],
    queryFn: async (): Promise<TokenBalance> => {
      if (!address) return DEFAULT_BALANCES;

      logger.debug(`Fetching balances for ${getChainName(chainId)}`);

      const rpcUrl = getChainRpc(chainId);
      const chain = getChainForId(chainId);

      const client = createPublicClient({
        chain,
        transport: http(rpcUrl),
      });

      // Get token addresses for this network (fallback to Base if not found)
      const tokens = TOKEN_ADDRESSES[chainId] || TOKEN_ADDRESSES[CHAIN_IDS.BASE];

      // Build multicall contracts array for token balances
      const calls: {
        address: `0x${string}`;
        abi: typeof ERC20_ABI;
        functionName: 'balanceOf';
        args: [`0x${string}`];
      }[] = [];
      const tokenOrder: ('USDC' | 'EURC' | 'USDT' | '1UP')[] = [];

      if (tokens.USDC) {
        calls.push({
          address: tokens.USDC as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        tokenOrder.push('USDC');
      }
      if (tokens.EURC) {
        calls.push({
          address: tokens.EURC as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        tokenOrder.push('EURC');
      }
      if (tokens.USDT) {
        calls.push({
          address: tokens.USDT as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        tokenOrder.push('USDT');
      }
      // Add 1UP on Base mainnet only
      if (chainId === CHAIN_IDS.BASE) {
        calls.push({
          address: ONEUP_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        tokenOrder.push('1UP');
      }

      // Fetch ETH balance and token balances in parallel (2 RPC calls instead of 4)
      const [ethBalance, tokenResults] = await Promise.all([
        client.getBalance({ address: address as `0x${string}` }),
        calls.length > 0
          ? client.multicall({ contracts: calls, allowFailure: true })
          : Promise.resolve([]),
      ]);

      // Parse token results
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

      // Format balances (ETH and 1UP have 18 decimals, stablecoins have 6)
      const formattedBalances: TokenBalance = {
        ethBalance: formatUnits(ethBalance, 18),
        uscBalance: formatUnits(balanceMap.USDC, 6),
        eurcBalance: formatUnits(balanceMap.EURC, 6),
        usdtBalance: formatUnits(balanceMap.USDT, 6),
        oneUpBalance: chainId === CHAIN_IDS.BASE ? formatUnits(balanceMap['1UP'], 18) : '0',
      };

      logger.debug(`Balances fetched for ${getChainName(chainId)}`);
      return formattedBalances;
    },
    enabled: Boolean(address),
    staleTime: 1000 * 30, // 30 seconds - balances don't change that often
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
  });

  return {
    balances: query.data ?? DEFAULT_BALANCES,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
