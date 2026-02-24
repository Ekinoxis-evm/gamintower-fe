# 1UP Gaming Tower — Product Valuation Overview

> **Prepared by:** Ekinoxis Engineering
> **Product:** 1UP Gaming Tower — Web3 Wallet & Community Platform
> **Date:** February 2026
> **Stage:** Production-Ready MVP (Mainnet Deployed)

---

## Executive Summary

1UP Gaming Tower is a fully functional, production-deployed Web3 community platform built for the ETH Cali ecosystem. It combines a multi-network crypto wallet, an on-chain identity system, a peer-to-peer gaming layer, and an educational NFT marketplace — all delivered as a Progressive Web App (PWA) with gasless transactions and passkey-based login.

This is not a prototype. It is live on Base mainnet with deployed smart contracts, real users, and a complete frontend stack engineered to production standards.

---

## What We Built

### 1. Multi-Network Web3 Wallet

A non-custodial wallet interface supporting **5 networks** simultaneously:

| Network | Chain ID | Use Case |
|---|---|---|
| Base | 8453 | Primary (1UP token, identity, challenges) |
| Ethereum | 1 | ENS, bridged assets |
| Optimism | 10 | OP ecosystem tokens |
| Unichain | 130 | Emerging L2 |
| Base Sepolia | 84532 | Testnet / QA |

**Token support out of the box:**
- Native ETH on all networks
- USDC (official Circle deployment per chain)
- EURC (Euro stablecoin)
- USDT
- 1UP (community token — `0xF6813C71e620c654Ff6049a485E38D9494eFABdf` on Base)

**Core wallet features:**
- Real-time balances pulled directly from chain via `viem` public clients
- Live USD/EUR pricing via CoinGecko API integration
- Send tokens with wallet address input or QR code scan
- Receive: address display + QR code generation
- Token swap via LiFi aggregator integration (best route across DEXes)
- NFT collectibles gallery with per-user filtering
- **100% gas-sponsored transactions** — users never pay gas fees

---

### 2. On-Chain Identity System

A soulbound (non-transferable) NFT identity layer that gates participation across the platform.

**Smart contracts deployed:**
- `IdentityNFTFactory` — deploys city/community-specific identity collections
- `IdentityNFT` — individual collection contract per city

**Contract addresses (Base Mainnet):**
```
IdentityNFTFactory: 0xa5806b4f9faac539803bc03e09294ccf4688c663
```

**Features:**
- Mint identity NFTs with metadata pinned to IPFS (name, attributes, profile)
- Multiple subscription periods (monthly, yearly)
- Multi-token payment support (USDC, EURC, etc.)
- Status tracking: `Active`, `Expired`, `Suspended`
- Renewals without re-minting
- ZKPassport integration for personhood verification (anti-Sybil)
- Admin tooling: deploy collections, manage accepted tokens, suspend/revoke tokens
- Metadata storage: server-side Pinata IPFS pinning via secure API routes

---

### 3. Peer-to-Peer Challenge Game

A blockchain-enforced 2-player staking game built on a custom vault architecture.

**Smart contracts deployed:**
- `VaultFactory` — creates isolated vault contracts per challenge
- `ChallengeVault` — holds stakes, manages game state, distributes winnings

**Contract addresses (Base Mainnet):**
```
VaultFactory: 0x16Dd1c94afc8045ED1785811C33E3a17a94c978d
```

**Game flow:**
1. Player 1 creates a challenge → deposits stake → vault deployed on-chain
2. Player 2 joins → deposits matching stake
3. Both players submit secret numbers
4. Winner determined on-chain → winnings claimable instantly
5. Admin dispute resolution for edge cases

**Supported stake tokens:** USDC, EURC (whitelisted per vault factory)
**All transactions:** gas-sponsored, zero friction for end users

---

### 4. Educational Course Marketplace

An NFT-gated course system where minting an NFT unlocks private content.

**Smart contracts deployed:**
- `CourseFactory` — deploys individual course NFT contracts
- `CourseNFT` — ERC-721 per course with royalty support

**Contract addresses (Base Mainnet):**
```
CourseFactory: 0xd7df1f996adf0d119f9a286036c05a40d783599f
```

**Features:**
- Browse course catalog with price, supply, and availability
- Mint to unlock: ownership gates private IPFS-stored content
- Configurable mint price (USDC), max supply, royalty splits
- Custom treasury address per course (creator-friendly)
- Admin can deploy and manage courses from the same dashboard
- Private content stored encrypted on IPFS, retrieved on NFT ownership proof

---

### 5. ENS Integration

- Users can register subdomains under `ethcali.eth` on Base
- ENS resolution and display throughout the UI
- Custom ENS section in wallet for domain management

---

### 6. Admin Dashboard

A full-featured admin control plane for platform operators:

- Deploy new identity collections (city/community specific)
- Manage identity payment tokens
- Deploy new challenge vault configurations
- Whitelist/remove accepted stake tokens
- Publish new educational courses
- Set treasury addresses and royalty configurations
- Resolve player disputes on-chain
- Role-based: admin-only routes checked against on-chain address registry

---

## Technical Architecture

### Frontend Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (Pages Router + Turbopack) | 16.1.6 |
| Language | TypeScript (strict mode) | 5.3.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Auth | Privy (`@privy-io/react-auth`) | ^3.13.0 |
| Blockchain reads | viem | 1.19.9 |
| Blockchain writes | Privy SDK + viem encodeFunctionData | — |
| Server state | TanStack React Query | 5.90.16 |
| Client state | Zustand | 5.0.10 |
| IPFS | Pinata SDK | 2.1.0 |
| Token swaps | LiFi Protocol | — |
| QR codes | qrcode.react + html5-qrcode | — |
| ZK identity | @zkpassport/sdk | 0.12.4 |
| Runtime | Node.js 24.x | — |

### Smart Contracts (Deployed, Auditable)

Three contract systems deployed on **Base Mainnet** and **Base Sepolia** testnet:

1. **Identity System** — `IdentityNFTFactory` + `IdentityNFT`
2. **Challenge System** — `VaultFactory` + `ChallengeVault`
3. **Course System** — `CourseFactory` + `CourseNFT`

All contract ABIs are version-controlled alongside the frontend. Contract interactions use type-safe viem bindings throughout.

### Infrastructure

- **Hosting**: Next.js (deployable to Vercel / any Node host)
- **IPFS**: Pinata for metadata and image pinning (server-side, JWT-gated)
- **Gas Sponsorship**: Privy paymaster on all supported chains
- **Pricing Data**: CoinGecko API (real-time, no API key required for core usage)
- **PWA**: Fully configured with `manifest.json`, installable on mobile devices

---

## Codebase Metrics

| Area | Detail |
|---|---|
| Pages (routes) | 6 user-facing + 2 API endpoints |
| Components | ~35 across 6 domains |
| Custom hooks | ~30 across 5 domains |
| Lines of code (components) | ~8,500+ |
| Contract ABIs integrated | 5 |
| Networks supported | 5 |
| Token types tracked | 5+ |
| TypeScript coverage | 100% (strict mode, no `any`) |
| Unused code | 0 (enforced by `noUnusedLocals`) |

---

## User Experience Highlights

- **Zero-friction onboarding**: email or passkey login via Privy — no seed phrases, no MetaMask required
- **Embedded wallet**: automatically provisioned on first login
- **External wallets**: MetaMask, Coinbase Wallet, and WalletConnect also supported
- **Gas-free**: every transaction is sponsored — users never see a gas fee
- **Mobile-first**: PWA installable from browser, full-screen standalone mode
- **Dark theme**: professional slate/cyan/pink palette throughout
- **QR scanning**: send to any address by scanning a QR code

---

## Competitive Positioning

| Feature | 1UP Gaming Tower | Generic Wallet App | Community Forum |
|---|---|---|---|
| Multi-network wallet | ✅ | ✅ | ❌ |
| Gas sponsorship | ✅ | Rarely | ❌ |
| On-chain identity | ✅ | ❌ | ❌ |
| P2P gaming / staking | ✅ | ❌ | ❌ |
| NFT-gated education | ✅ | ❌ | ❌ |
| Passkey login | ✅ | Rarely | ❌ |
| ZK personhood | ✅ | ❌ | ❌ |
| PWA installable | ✅ | Sometimes | ❌ |
| Admin dashboard | ✅ | ❌ | Sometimes |
| ENS integration | ✅ | Sometimes | ❌ |

This platform is uniquely positioned as an **all-in-one community infrastructure layer** — not just a wallet, not just a game, but a full ecosystem toolkit for Web3 communities.

---

## Deployed Contract Addresses

### Base Mainnet (Chain ID: 8453)

| Contract | Address |
|---|---|
| IdentityNFTFactory | `0xa5806b4f9faac539803bc03e09294ccf4688c663` |
| VaultFactory | `0x16Dd1c94afc8045ED1785811C33E3a17a94c978d` |
| CourseFactory | `0xd7df1f996adf0d119f9a286036c05a40d783599f` |

### Base Sepolia — Testnet (Chain ID: 84532)

| Contract | Address |
|---|---|
| IdentityNFTFactory | `0x16dd1c94afc8045ed1785811c33e3a17a94c978d` |
| VaultFactory | `0x60f9a2250012ed48ed1688b4123bf8e647fba472` |
| CourseFactory | `0x1246c42b7914ff65849d7752c5cdf4aaa91767ed` |

---

## Current Status & Maturity

| Dimension | Status |
|---|---|
| Smart contracts | Deployed on mainnet |
| Frontend | Production-ready, PWA-enabled |
| TypeScript strict compliance | 100% |
| Gas sponsorship | Active on all networks |
| IPFS metadata storage | Live via Pinata |
| Admin tooling | Complete |
| Mobile experience | Installable PWA |
| Testnet environment | Available on Base Sepolia |

---

## What This Is Worth

This product represents:

- **~6–9 months** of full-stack Web3 engineering at senior level
- **3 deployed smart contract systems** (identity, gaming, education) with frontend integration
- **A reusable platform** — the factory pattern means new communities, cities, or orgs can be onboarded by deploying new collections with zero frontend changes
- **A moat**: the combination of identity + staking + education + wallet in one coherent UX does not exist as an open-source, community-owned product
- **A foundation**: the architecture is designed to extend — faucets, swag stores, DAO tooling, and more can plug into the same identity and wallet layer

---

*This document was generated from the live codebase at `/wallet_ethcali`. All contract addresses, ABIs, and feature descriptions reflect the actual deployed production system.*
