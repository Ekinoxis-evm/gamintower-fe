import deployments from '../frontend/deployments/addresses.json';

type DeploymentKey = keyof typeof deployments;

export function getFactoryAddresses(chainId: number) {
  const key = String(chainId) as DeploymentKey;
  const chain = deployments[key];
  if (!chain) throw new Error(`No deployments for chainId ${chainId}`);
  return {
    identityNFTFactory: chain.contracts.IdentityNFTFactory as `0x${string}`,
    vaultFactory: chain.contracts.VaultFactory as `0x${string}`,
    courseFactory: chain.contracts.CourseFactory as `0x${string}`,
  };
}

export function getExplorerUrl(chainId: number): string {
  const key = String(chainId) as DeploymentKey;
  const chain = deployments[key];
  return chain?.explorer ?? 'https://base.blockscout.com';
}

/** Returns the block-explorer URL for a specific NFT instance. */
export function getNftExplorerUrl(
  chainId: number,
  contractAddress: string,
  tokenId: bigint,
): string {
  const base = getExplorerUrl(chainId);
  return `${base}/token/${contractAddress}/instance/${tokenId.toString()}`;
}
