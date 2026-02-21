import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import FactoryABI from '../../frontend/deployments/abi/IdentityNFTFactory.json';

interface InitialTokenConfig {
  token: `0x${string}`;
  mintPrice: bigint;
  monthlyPrice: bigint;
  yearlyPrice: bigint;
}

interface DeployParams {
  name: string;
  symbol: string;
  city: string;
  treasury: `0x${string}`;
  soulbound: boolean;
  initialTokens: InitialTokenConfig[];
  chainId: number;
}

export function useDeployCollection() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const deployCollection = async (params: DeployParams) => {
    const { name, symbol, city, treasury, soulbound, initialTokens, chainId } = params;
    const addresses = getFactoryAddresses(chainId);

    const data = encodeFunctionData({
      abi: FactoryABI,
      functionName: 'deployCollection',
      args: [name, symbol, city, treasury, soulbound, initialTokens],
    });

    await sendTransaction(
      { to: addresses.identityNFTFactory, data, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['identity-collections'] });
  };

  return { deployCollection };
}
