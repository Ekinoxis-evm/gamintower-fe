import type { NextApiRequest, NextApiResponse } from 'next';
import { pinImageBuffer } from '../../../lib/pinata';

// Increase body size limit to handle base64-encoded images (up to ~7.5 MB raw)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

interface RequestBody {
  data: string;      // base64-encoded image bytes (no data-URL prefix)
  filename: string;
  mimeType: string;
}

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

  const { data, filename, mimeType } = req.body as RequestBody;

  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'Missing image data' });
  }
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Missing filename' });
  }
  if (!mimeType || !mimeType.startsWith('image/')) {
    return res.status(400).json({ error: 'File must be an image' });
  }

  try {
    const buffer = Buffer.from(data, 'base64');
    const ipfsUri = await pinImageBuffer(buffer, filename, mimeType);
    return res.status(200).json({ ipfsUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image upload failed';
    return res.status(500).json({ error: message });
  }
}
