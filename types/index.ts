// Wallet types
export interface Wallet {
  address: string;
  chainId?: number;
  provider?: any;
  walletClientType?: string;
}

// Balance types
export interface TokenBalance {
  ethBalance: string;
  uscBalance: string;
  eurcBalance: string;
  usdtBalance?: string;
  papayosBalance?: string;
  oneUpBalance?: string;
}

// Identity types
export interface IdentityStatus {
  isValid: boolean;
  status: 'Active' | 'Expired' | 'Suspended' | 'None';
  expiry: bigint | null;
  tokenId: bigint;
}

// Challenge types
export type ChallengeState = 0 | 1 | 2; // OPEN, ACTIVE, RESOLVED

export interface VaultInfo {
  address: `0x${string}`;
  token: `0x${string}`;
  resolver: `0x${string}`;
  player1: `0x${string}`;
  player2: `0x${string}`;
  stakeAmount: bigint;
  state: ChallengeState;
  endTime: bigint;
  challengeDuration: bigint;
  winner: `0x${string}`;
  metadataURI: string;
}

// Course types
export interface CourseInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  mintPrice: bigint;
  maxSupply: bigint;
  totalSupply: bigint;
  canMint: boolean;
}
