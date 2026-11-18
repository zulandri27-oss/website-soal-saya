import {
  parseGeminiError,
  refineQuestionWithGemini,
  type ApiRequestLike,
  type ApiResponseLike,
  type RefineQuestionRequest,
} from '../../server/geminiService';

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (req.body ?? {}) as RefineQuestionRequest;
    const item = await refineQuestionWithGemini(body);
    res.status(200).json({ item });
  } catch (error) {
    const { status, message } = parseGeminiError(
      error,
      'Failed to refine assessment item.',
    );
    res.status(status).json({ error: message });
  }
}
