const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

/**
 * Converts an ipfs:// URI to an HTTP gateway URL.
 * Pass-through for anything that is already an HTTP(S) URL.
 */
export function resolveIpfsUrl(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    const path = uri.slice(7); // strip "ipfs://"
    const gateway =
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_IPFS_GATEWAY) ||
      DEFAULT_GATEWAY;
    return `${gateway.replace(/\/$/, '')}/${path}`;
  }
  return uri;
}
