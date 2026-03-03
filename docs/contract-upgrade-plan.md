# Contract Upgrade Plan — Transaction Reduction

## Current state

| Action | Txs | Bottleneck |
|---|---|---|
| Mint game pass | 1–2 | `approve` skipped if allowance is sufficient (already implemented) |
| Renew game pass | 1–2 | Same |
| Create challenge | 3 | Vault address only known after tx 1 — inherent limitation |
| Join challenge | 2 | `approve` to vault, then `deposit` |

## Remaining improvements (require contract changes)

---

### 1. `VaultFactory.createAndDeposit()` — 3 → 1 tx for create challenge

**Problem**: Creating a challenge requires 3 transactions because the vault address is
only known after the factory deploys it. Steps 2 (approve) and 3 (deposit) depend on
that address, so they cannot be batched with step 1.

**Solution**: Add a new factory function that handles all three steps atomically:

```solidity
function createAndDeposit(
    address token,
    uint256 stakeAmount,
    uint256 duration,
    string calldata metadataURI
) external returns (address vault) {
    // 1. Deploy the vault
    vault = _deployVault(token, stakeAmount, duration, metadataURI);
    // 2. Pull tokens from msg.sender into the vault (requires prior approve to factory)
    IERC20(token).transferFrom(msg.sender, vault, stakeAmount);
    // 3. Register player1 inside the vault
    IChallengeVault(vault).depositFrom(msg.sender, stakeAmount);
}
```

The user pre-approves the **factory** (not the vault) once with `maxUint256`. All
subsequent `createAndDeposit` calls skip the approve step.

**Vault changes required**: Add `depositFrom(address player, uint256 amount)` that
can only be called by the factory.

**Net result**: 3 txs → 1 tx (after the one-time factory approval).

---

### 2. `ChallengeVault.depositWithPermit()` — 2 → 1 tx for join challenge

**Problem**: Joining requires `approve(vault, stakeAmount)` then `deposit()`.

**Solution**: Accept an EIP-2612 permit signature in the deposit call:

```solidity
function depositWithPermit(
    uint256 amount,
    address receiver,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    IERC20Permit(asset()).permit(msg.sender, address(this), amount, deadline, v, r, s);
    deposit(amount, receiver);
}
```

The user signs the permit off-chain (no tx), then calls `depositWithPermit` — 1 tx total.

**Prerequisite**: The ERC20 tokens accepted by the vault must implement EIP-2612
(`permit()`). USDC on Base does support this. EURC on Base also supports it.
Verify each accepted token before enabling this path.

**Frontend changes**: Use `useSignTypedData` from Privy to sign the permit, then
encode and pass the `v, r, s` to `depositWithPermit`.

**Net result**: 2 txs → 1 tx for join challenge.

---

### 3. `IdentityNFT.mintWithPermit()` / `renewWithPermit()` — 2 → 1 tx (first time)

**Problem**: First-time mint/renew still requires an `approve` if no prior allowance
exists (already optimised with `maxUint256` — subsequent ops skip approve). But the
very first transaction remains 2 steps.

**Solution**: Add permit-aware variants:

```solidity
function mintWithPermit(
    string calldata metadataURI,
    uint8 period,
    address tokenAddress,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    TokenConfig storage cfg = _tokenConfigs[tokenAddress];
    uint256 total = cfg.mintPrice + (period == 0 ? cfg.monthlyPrice : cfg.yearlyPrice);
    IERC20Permit(tokenAddress).permit(msg.sender, address(this), total, deadline, v, r, s);
    _mint(msg.sender, metadataURI, period, tokenAddress);
}
```

Same pattern for `renewWithPermit`.

**Prerequisite**: Same as above — token must implement EIP-2612.

**Net result**: 2 txs → 1 tx even on first use.

---

### 4. Privy `useSendCalls` for EIP-5792 batching (no contract changes)

**Problem**: Privy v3.13.0 only exposes `useSendTransaction` (single tx). EIP-5792
`wallet_sendCalls` — which allows atomic batching of multiple calls for smart wallet
users — is not yet exposed.

**Solution**: Upgrade Privy SDK when `useSendCalls` becomes available in the v3 branch.

```typescript
// Future API (approximate)
const { sendCalls } = useSendCalls();

await sendCalls({
  calls: [
    { to: tokenAddress, data: approveCalldata },
    { to: collectionAddress, data: mintCalldata },
  ],
  chainId,
}, { sponsor: true });
```

This batches approve + mint into a single user confirmation for embedded wallet users.
External wallets (MetaMask, etc.) may not support EIP-5792 and would fall back to
sequential transactions.

**Risk**: Privy major version upgrades can break auth configuration and wallet
session handling. Verify changelog and test in staging before upgrading.

**Net result**: approve + action collapses into 1 confirmation for smart wallet users,
regardless of token permit support.

---

## Priority order

| Priority | Item | Impact | Effort |
|---|---|---|---|
| 1 | `createAndDeposit` in VaultFactory | Create challenge: 3→1 tx | Medium |
| 2 | `depositWithPermit` in ChallengeVault | Join challenge: 2→1 tx | Low |
| 3 | `mintWithPermit` / `renewWithPermit` in IdentityNFT | Mint/renew: always 1 tx | Low |
| 4 | Privy `useSendCalls` upgrade | All flows: 1 confirmation | Medium (upgrade risk) |

Items 2 and 3 share the same prerequisite (EIP-2612 on accepted tokens) and can be
done in a single contract deployment pass.
