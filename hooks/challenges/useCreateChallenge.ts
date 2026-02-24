import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, encodeFunctionData, decodeEventLog, type Abi } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction } from '@privy-io/react-auth';
import { getFactoryAddresses } from '../../config/contracts';
import { getChainRpc } from '../../config/networks';
import VaultFactory_ABI from '../../frontend/deployments/abi/VaultFactory.json';
import ChallengeVault_ABI from '../../frontend/deployments/abi/ChallengeVault.json';
import IdentityNFT_ABI from '../../frontend/deployments/abi/IdentityNFT.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  TokenNotAccepted: 'The selected token is not accepted.',
  ZeroStake: 'Stake amount must be greater than zero.',
  ZeroDuration: 'Duration must be greater than zero.',
  ZeroAddress: 'Invalid address provided.',
  EnforcedPause: 'Challenge creation is currently paused.',
  NoActiveIdentity: 'Your identity is not active. Please check the Identity page.',
};

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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

export interface CreateChallengeParams {
  tokenAddress: `0x${string}`;
  stakeAmount: bigint;
  duration: bigint;
  metadataURI: string;
  chainId: number;
  userAddress: `0x${string}`;
}

export type CreateStep = 'creating' | 'approving' | 'depositing';

function friendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  for (const [name, friendly] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (msg.includes(name)) return new Error(friendly);
  }
  return err instanceof Error ? err : new Error(msg);
}

async function checkIdentityEligibility(
  chainId: number,
  vaultFactoryAddress: `0x${string}`,
  userAddress: `0x${string}`,
): Promise<string | null> {
  const client = createPublicClient({
    chain: base,
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
    return "You don't have an identity NFT. Please go to the Identity page and mint one first.";
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

export function useCreateChallenge() {
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  /**
   * Full 3-step create flow:
   *   1. factory.createChallenge()  → deploys vault, returns address via VaultCreated event
   *   2. token.approve(vault, stake)
   *   3. vault.deposit(stake, player1)  → vault state becomes OPEN, player1 is in
   *
   * onStep is called before each on-chain step so the UI can show progress.
   */
  const createChallenge = async (
    params: CreateChallengeParams,
    onStep?: (step: CreateStep) => void,
  ) => {
    const { tokenAddress, stakeAmount, duration, metadataURI, chainId, userAddress } = params;
    const addresses = getFactoryAddresses(chainId);

    const client = createPublicClient({
      chain: base,
      transport: http(getChainRpc(chainId)),
    });

    // ── Pre-flight 1: identity check ──────────────────────────────────────────
    const identityError = await checkIdentityEligibility(chainId, addresses.vaultFactory, userAddress);
    if (identityError) throw new Error(identityError);

    // ── Pre-flight 2: simulate createChallenge ────────────────────────────────
    try {
      await client.simulateContract({
        address: addresses.vaultFactory,
        abi: VaultFactory_ABI as Abi,
        functionName: 'createChallenge',
        args: [tokenAddress, stakeAmount, duration, metadataURI],
        account: userAddress,
      });
    } catch (err) {
      throw friendlyError(err);
    }

    // ── Pre-flight 3: user token balance ──────────────────────────────────────
    const userBalance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }) as bigint;
    if (userBalance < stakeAmount) {
      throw new Error(`Insufficient balance. You need ${stakeAmount} but only have ${userBalance}.`);
    }

    // ── Step 1: Deploy the vault ──────────────────────────────────────────────
    onStep?.('creating');
    const createData = encodeFunctionData({
      abi: VaultFactory_ABI as Abi,
      functionName: 'createChallenge',
      args: [tokenAddress, stakeAmount, duration, metadataURI],
    });
    const { hash: createHash } = await sendTransaction(
      { to: addresses.vaultFactory, data: createData, chainId },
      { sponsor: true },
    );
    const createReceipt = await client.waitForTransactionReceipt({ hash: createHash });
    if (createReceipt.status === 'reverted') {
      throw new Error('Challenge creation reverted on-chain. Please try again.');
    }

    // Extract vault address from VaultCreated event
    let vaultAddress: `0x${string}` | undefined;
    for (const log of createReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: VaultFactory_ABI as Abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'VaultCreated') {
          vaultAddress = (decoded.args as { vault: `0x${string}` }).vault;
          break;
        }
      } catch {
        // Not a VaultCreated log, skip
      }
    }
    if (!vaultAddress) {
      throw new Error('Vault was created but its address could not be read from the transaction. Check the explorer.');
    }

    // ── Step 2: Approve vault to spend player1's tokens ───────────────────────
    onStep?.('approving');
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, stakeAmount],
    });
    const { hash: approveHash } = await sendTransaction(
      { to: tokenAddress, data: approveData, chainId },
      { sponsor: true },
    );
    const approveReceipt = await client.waitForTransactionReceipt({ hash: approveHash });
    if (approveReceipt.status === 'reverted') {
      throw new Error('Token approval failed. The vault was created — retry to deposit your stake.');
    }

    // ── Step 3: Deposit as player1 ────────────────────────────────────────────
    onStep?.('depositing');
    const depositData = encodeFunctionData({
      abi: ChallengeVault_ABI as Abi,
      functionName: 'deposit',
      args: [stakeAmount, userAddress],
    });
    const { hash: depositHash } = await sendTransaction(
      { to: vaultAddress, data: depositData, chainId },
      { sponsor: true },
    );
    const depositReceipt = await client.waitForTransactionReceipt({ hash: depositHash });
    if (depositReceipt.status === 'reverted') {
      throw new Error('Stake deposit reverted. Your approval is set — retry to complete setup.');
    }

    await queryClient.invalidateQueries({ queryKey: ['all-vaults'] });
    await queryClient.invalidateQueries({ queryKey: ['vault-details'] });
  };

  return { createChallenge };
}
