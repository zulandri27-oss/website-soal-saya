import type { ApiRequestLike, ApiResponseLike } from '../server/geminiService';

export default function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({ ok: true, service: 'edusoal-ai', runtime: 'vercel-serverless' });
}
