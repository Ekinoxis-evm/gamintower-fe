import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, encodeFunctionData, type Abi } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import { getChainRpc } from '../../config/networks';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const getViemChain = (chainId: number) => {
  if (chainId === 84532) return baseSepolia;
  return base;
};

// Human-readable messages for remaining VaultFactory custom errors
// (identity errors are handled by the dedicated pre-flight below)
const VAULT_ERROR_MESSAGES: Record<string, string> = {
  TokenNotAccepted: 'The selected token is not accepted by this vault.',
  ZeroStake: 'Stake amount must be greater than zero.',
  ZeroDuration: 'Duration must be greater than zero.',
  ZeroAddress: 'Invalid address provided.',
  EnforcedPause: 'Challenge creation is currently paused.',
  NoActiveIdentity: 'Your identity is not active. Please check the Identity page.',
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

interface CreateChallengeParams {
  tokenAddress: `0x${string}`;
  stakeAmount: bigint;
  duration: bigint;
  metadataURI: string;
  chainId: number;
  userAddress: `0x${string}`;
}

function friendlySimulationError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  for (const [name, friendly] of Object.entries(VAULT_ERROR_MESSAGES)) {
    if (message.includes(name)) return new Error(friendly);
  }
  return err instanceof Error ? err : new Error(message);
}

/** Reads the IdentityNFT linked to the VaultFactory and returns a human-readable
 *  reason if the user is not eligible to create a challenge, or null if they are. */
async function checkIdentityEligibility(
  chainId: number,
  vaultFactoryAddress: `0x${string}`,
  userAddress: `0x${string}`,
): Promise<string | null> {
  const client = createPublicClient({
    chain: getViemChain(chainId),
    transport: http(getChainRpc(chainId)),
  });

  // 1. Get the identityNFT address baked into the VaultFactory
  const identityNFTAddr = await client.readContract({
    address: vaultFactoryAddress,
    abi: VaultFactory_ABI as Abi,
    functionName: 'identityNFT',
  }).catch(() => null) as `0x${string}` | null;

  if (!identityNFTAddr || identityNFTAddr === ZERO_ADDRESS) {
    return 'The identity NFT contract is not configured in the VaultFactory. Please contact the admin.';
  }

  // 2. Multicall: isValid + tokenIdOf + expiryOfUser — all in one round-trip
  const abi = IdentityNFT_ABI as Abi;
  const [validResult, tokenIdResult, expiryResult] = await client.multicall({
    contracts: [
      { address: identityNFTAddr, abi, functionName: 'isValid',      args: [userAddress] },
      { address: identityNFTAddr, abi, functionName: 'tokenIdOf',    args: [userAddress] },
      { address: identityNFTAddr, abi, functionName: 'expiryOfUser', args: [userAddress] },
    ],
    allowFailure: true,
  });

  const isValid  = validResult.status   === 'success' ? (validResult.result   as boolean) : false;
  const tokenId  = tokenIdResult.status === 'success' ? (tokenIdResult.result as bigint)  : BigInt(0);
  const expiry   = expiryResult.status  === 'success' ? (expiryResult.result  as bigint)  : BigInt(0);

  if (isValid) return null; // all good

  // 3. Diagnose the exact reason
  if (tokenId === BigInt(0)) {
    return 'You don\'t have an identity NFT. Please go to the Identity page and mint one first.';
  }

  const nowSecs = BigInt(Math.floor(Date.now() / 1000));
  if (expiry > BigInt(0) && expiry < nowSecs) {
    const expiryDate = new Date(Number(expiry) * 1000).toLocaleDateString();
    return `Your identity NFT expired on ${expiryDate}. Please renew it on the Identity page.`;
  }

  // 4. Check suspension as a last resort
  const suspendedResult = await client.readContract({
    address: identityNFTAddr,
    abi,
    functionName: 'suspended',
    args: [tokenId],
  }).catch(() => false) as boolean;

  if (suspendedResult) {
    return 'Your identity NFT has been suspended. Please contact the admin.';
  }

  return 'Your identity is not currently valid. Please check the Identity page.';
}

export function useCreateChallenge() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const createChallenge = async (params: CreateChallengeParams) => {
    const { tokenAddress, stakeAmount, duration, metadataURI, chainId, userAddress } = params;
    const addresses = getFactoryAddresses(chainId);

    const client = createPublicClient({
      chain: getViemChain(chainId),
      transport: http(getChainRpc(chainId)),
    });

    // ── Pre-flight 1: identity check with actionable diagnosis ────────────────
    const identityError = await checkIdentityEligibility(chainId, addresses.vaultFactory, userAddress);
    if (identityError) throw new Error(identityError);

    // ── Pre-flight 2: simulate createChallenge to catch remaining errors ──────
    try {
      await client.simulateContract({
        address: addresses.vaultFactory,
        abi: VaultFactory_ABI as Abi,
        functionName: 'createChallenge',
        args: [tokenAddress, stakeAmount, duration, metadataURI],
        account: userAddress,
      });
    } catch (err) {
      throw friendlySimulationError(err);
    }

    // ── 1. Approve ERC20 spend ────────────────────────────────────────────────
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [addresses.vaultFactory, stakeAmount],
    });
    await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );

    // ── 2. Create challenge vault ─────────────────────────────────────────────
    const createData = encodeFunctionData({
      abi: VaultFactory_ABI as Abi,
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
