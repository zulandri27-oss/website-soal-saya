import {
  generateStimulusWithGemini,
  parseGeminiError,
  type ApiRequestLike,
  type ApiResponseLike,
  type GenerateStimulusRequest,
} from '../../server/geminiService';

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (req.body ?? {}) as GenerateStimulusRequest;
    const stimulus = await generateStimulusWithGemini(body);
    res.status(200).json({ stimulus });
  } catch (error) {
    const { status, message } = parseGeminiError(error, 'Failed to generate stimulus.');
    res.status(status).json({ error: message });
  }
}
