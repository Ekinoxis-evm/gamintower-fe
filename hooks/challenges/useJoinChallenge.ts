import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, encodeFunctionData, type Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import { getChainRpc } from '../../config/networks';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

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

interface JoinChallengeParams {
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  stakeAmount: bigint;
  receiver: `0x${string}`;
  userAddress: `0x${string}`;
  chainId: number;
}

async function checkIdentityEligibility(
  chainId: number,
  vaultFactoryAddress: `0x${string}`,
  userAddress: `0x${string}`,
): Promise<string | null> {
  const client = createPublicClient({
    chain: getViemChain(chainId),
    transport: http(getChainRpc(chainId)),
  });

  const identityNFTAddr = await client.readContract({
    address: vaultFactoryAddress,
    abi: VaultFactory_ABI as Abi,
    functionName: 'identityNFT',
  }).catch(() => null) as `0x${string}` | null;

  if (!identityNFTAddr || identityNFTAddr === ZERO_ADDRESS) {
    return 'The identity NFT contract is not configured in the VaultFactory. Please contact the admin.';
  }

  const abi = IdentityNFT_ABI as Abi;
  const [validResult, tokenIdResult, expiryResult] = await client.multicall({
    contracts: [
      { address: identityNFTAddr, abi, functionName: 'isValid',      args: [userAddress] },
      { address: identityNFTAddr, abi, functionName: 'tokenIdOf',    args: [userAddress] },
      { address: identityNFTAddr, abi, functionName: 'expiryOfUser', args: [userAddress] },
    ],
    allowFailure: true,
  });

  const isValid = validResult.status   === 'success' ? (validResult.result   as boolean) : false;
  const tokenId = tokenIdResult.status === 'success' ? (tokenIdResult.result as bigint)  : BigInt(0);
  const expiry  = expiryResult.status  === 'success' ? (expiryResult.result  as bigint)  : BigInt(0);

  if (isValid) return null;

  if (tokenId === BigInt(0)) {
    return 'You don\'t have an identity NFT. Please go to the Identity page and mint one first.';
  }

  const nowSecs = BigInt(Math.floor(Date.now() / 1000));
  if (expiry > BigInt(0) && expiry < nowSecs) {
    const expiryDate = new Date(Number(expiry) * 1000).toLocaleDateString();
    return `Your identity NFT expired on ${expiryDate}. Please renew it on the Identity page.`;
  }

  const suspended = await client.readContract({
    address: identityNFTAddr,
    abi,
    functionName: 'suspended',
    args: [tokenId],
  }).catch(() => false) as boolean;

  if (suspended) return 'Your identity NFT has been suspended. Please contact the admin.';

  return 'Your identity is not currently valid. Please check the Identity page.';
}

export function useJoinChallenge() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const joinChallenge = async (params: JoinChallengeParams) => {
    const { vaultAddress, tokenAddress, stakeAmount, receiver, userAddress, chainId } = params;
    const addresses = getFactoryAddresses(chainId);

    const client = createPublicClient({
      chain: getViemChain(chainId),
      transport: http(getChainRpc(chainId)),
    });

    // ── Pre-flight 1: identity check ──────────────────────────────────────────
    const identityError = await checkIdentityEligibility(chainId, addresses.vaultFactory, userAddress);
    if (identityError) throw new Error(identityError);

    // ── Pre-flight 2: vault state checks (no allowance needed) ───────────────
    // simulateContract would always fail here because the approve hasn't run yet.
    // Instead we read each condition individually and surface a clear error.
    const vaultAbi = ChallengeVault_ABI as Abi;
    const [stateResult, player1Result, player2Result, vaultStakeResult, balanceResult] =
      await client.multicall({
        contracts: [
          { address: vaultAddress, abi: vaultAbi, functionName: 'state' },
          { address: vaultAddress, abi: vaultAbi, functionName: 'player1' },
          { address: vaultAddress, abi: vaultAbi, functionName: 'player2' },
          { address: vaultAddress, abi: vaultAbi, functionName: 'stakeAmount' },
          { address: tokenAddress, abi: ERC20_BALANCE_ABI, functionName: 'balanceOf', args: [userAddress] },
        ],
        allowFailure: true,
      });

    const vaultState   = stateResult.status   === 'success' ? Number(stateResult.result as bigint)   : -1;
    const player1      = player1Result.status  === 'success' ? (player1Result.result  as string)      : '';
    const player2      = player2Result.status  === 'success' ? (player2Result.result  as string)      : '';
    const vaultStake   = vaultStakeResult.status === 'success' ? (vaultStakeResult.result as bigint)  : BigInt(0);
    const userBalance  = balanceResult.status  === 'success' ? (balanceResult.result  as bigint)      : BigInt(0);

    if (vaultState !== 0) {
      throw new Error('This challenge is no longer open for joining.');
    }
    if (player2.toLowerCase() !== ZERO_ADDRESS) {
      throw new Error('This challenge already has two players.');
    }
    if (player1.toLowerCase() === userAddress.toLowerCase()) {
      throw new Error('You cannot join your own challenge.');
    }
    if (vaultStake !== stakeAmount) {
      throw new Error('Stake amount mismatch — please refresh and try again.');
    }
    if (userBalance < stakeAmount) {
      throw new Error(
        `Insufficient token balance. You need ${stakeAmount} but only have ${userBalance}.`,
      );
    }

    // ── 1. Approve ERC20 spend on the vault ───────────────────────────────────
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, stakeAmount],
    });
    await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );

    // ── 2. Deposit to join as player2 ─────────────────────────────────────────
    const depositData = encodeFunctionData({
      abi: ChallengeVault_ABI as Abi,
      functionName: 'deposit',
      args: [stakeAmount, receiver],
    });
    await sendTransaction(
      { to: vaultAddress, data: depositData, chainId },
      { sponsor: true },
    );

    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
  };

  return { joinChallenge };
}
