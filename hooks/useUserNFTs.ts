import { useQuery } from '@tanstack/react-query';
import { useWallets } from '@privy-io/react-auth';

export interface UserNFT {
  tokenId: bigint;
  balance: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  chainId?: number;
}

export function useUserNFTs(_overrideChainId?: number) {
  const { wallets } = useWallets();
  const userAddress = wallets?.[0]?.address;

  const query = useQuery({
    queryKey: ['user-nfts', userAddress],
    queryFn: async (): Promise<UserNFT[]> => {
      return [];
    },
    enabled: Boolean(userAddress),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    refetch: query.refetch,
  };
}
