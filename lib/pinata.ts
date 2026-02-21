/**
 * Server-side Pinata (IPFS) helpers.
 * Uses the Pinata REST API directly — requires PINATA_JWT env var (server-side only).
 */

const PINATA_API = 'https://api.pinata.cloud';

function getJWT(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT is not configured. Add it to your .env file.');
  return jwt;
}

/**
 * Pin a raw image buffer to IPFS via Pinata.
 * Returns an ipfs:// URI.
 */
export async function pinImageBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const jwt = getJWT();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('pinataMetadata', JSON.stringify({ name: filename }));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const response = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Pinata image upload failed (${response.status})`);
  }

  const data = await response.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Pin a JSON metadata object to IPFS via Pinata.
 * Returns an ipfs:// URI.
 */
export async function pinMetadataJSON(
  metadata: Record<string, unknown>,
  name: string,
): Promise<string> {
  const jwt = getJWT();

  const response = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Pinata metadata upload failed (${response.status})`);
  }

  const data = await response.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}
