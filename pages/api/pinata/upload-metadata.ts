import type { NextApiRequest, NextApiResponse } from 'next';
import { pinMetadataJSON } from '../../../lib/pinata';

interface SuccessResponse {
  ipfsUri: string;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const metadata = req.body as Record<string, unknown>;

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return res.status(400).json({ error: 'Invalid metadata body' });
  }
  if (!metadata.name || typeof metadata.name !== 'string') {
    return res.status(400).json({ error: 'Metadata must include a "name" field' });
  }

  try {
    const ipfsUri = await pinMetadataJSON(metadata, `identity-${metadata.name as string}`);
    return res.status(200).json({ ipfsUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Metadata upload failed';
    return res.status(500).json({ error: message });
  }
}
