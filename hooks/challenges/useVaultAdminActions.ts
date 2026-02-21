import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData } from 'viem';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';

export function useVaultAdminActions() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const whitelistToken = async (token: `0x${string}`, chainId: number) => {
    const addresses = getFactoryAddresses(chainId);
    const data = encodeFunctionData({
      abi: VaultFactory_ABI,
      functionName: 'whitelistToken',
      args: [token],
    });
    await sendTransaction({ to: addresses.vaultFactory, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['vault-accepted-tokens'] });
  };

  const removeToken = async (token: `0x${string}`, chainId: number) => {
    const addresses = getFactoryAddresses(chainId);
    const data = encodeFunctionData({
      abi: VaultFactory_ABI,
      functionName: 'removeToken',
      args: [token],
    });
    await sendTransaction({ to: addresses.vaultFactory, data, chainId }, { sponsor: true });
    await queryClient.invalidateQueries({ queryKey: ['vault-accepted-tokens'] });
  };

  const setResolver = async (resolver: `0x${string}`, chainId: number) => {
    const addresses = getFactoryAddresses(chainId);
    const data = encodeFunctionData({
      abi: VaultFactory_ABI,
      functionName: 'setResolver',
      args: [resolver],
    });
    await sendTransaction({ to: addresses.vaultFactory, data, chainId }, { sponsor: true });
  };

  return { whitelistToken, removeToken, setResolver };
}
