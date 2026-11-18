import {
  generateQuestionsWithGemini,
  parseGeminiError,
  type ApiRequestLike,
  type ApiResponseLike,
  type GenerateQuestionsRequest,
} from '../../server/geminiService';

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (req.body ?? {}) as GenerateQuestionsRequest;
    const items = await generateQuestionsWithGemini(body);
    res.status(200).json({ items });
  } catch (error) {
    const { status, message } = parseGeminiError(
      error,
      'Failed to generate assessment items.',
    );
    res.status(status).json({ error: message });
  }
}
