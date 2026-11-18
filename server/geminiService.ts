import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export interface ApiRequestLike {
  method?: string;
  body?: unknown;
}

export interface ApiResponseLike {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: unknown) => void;
    end?: () => void;
  };
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new HttpError(
      500,
      'GEMINI_API_KEY belum dikonfigurasi. Tambahkan API key pada Environment Variables (Vercel Settings / Secrets) untuk menggunakan generator AI.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('429');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function parseGeminiError(
  error: unknown,
  fallback: string,
): { status: number; message: string } {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }
  const raw = error instanceof Error ? error.message : fallback;
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; status?: string };
    };
    if (parsed?.error?.message) {
      const code = parsed.error.code;
      const status = code && code >= 400 && code < 600 ? code : 500;
      if (status === 503 || parsed.error.status === 'UNAVAILABLE') {
        return {
          status: 503,
          message:
            'Model Gemini sedang mengalami lonjakan permintaan sementara. Silakan klik kembali dalam beberapa detik.',
        };
      }
      return { status, message: parsed.error.message };
    }
  } catch {
    // Plain text error message
  }
  return { status: 500, message: raw || fallback };
}

const STIMULUS_TABLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    caption: { type: Type.STRING },
    headers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  },
  required: ['caption', 'headers', 'rows'],
};

const STIMULUS_CHART_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    xAxisLabel: { type: Type.STRING },
    yAxisLabel: { type: Type.STRING },
    seriesALabel: { type: Type.STRING },
    seriesBLabel: { type: Type.STRING },
    points: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          xLabel: { type: Type.STRING },
          seriesA: { type: Type.NUMBER },
          seriesB: { type: Type.NUMBER },
        },
        required: ['xLabel', 'seriesA'],
      },
    },
  },
  required: ['title', 'xAxisLabel', 'yAxisLabel', 'seriesALabel', 'points'],
};

const STIMULUS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stimulusKind: {
      type: Type.STRING,
      description: 'One of "passage", "data-table", or "chart-series".',
    },
    stimulusTitle: { type: Type.STRING },
    stimulusSource: { type: Type.STRING },
    stimulusText: { type: Type.STRING },
    stimulusTable: STIMULUS_TABLE_SCHEMA,
    stimulusChart: STIMULUS_CHART_SCHEMA,
  },
  required: ['stimulusKind', 'stimulusTitle', 'stimulusSource', 'stimulusText'],
};

const QUESTION_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    code: { type: Type.STRING },
    topic: { type: Type.STRING },
    learningObjective: { type: Type.STRING },
    bloomLevel: { type: Type.STRING },
    stimulusKind: { type: Type.STRING },
    stimulusTitle: { type: Type.STRING },
    stimulusText: { type: Type.STRING },
    stimulusSource: { type: Type.STRING },
    stimulusTable: STIMULUS_TABLE_SCHEMA,
    stimulusChart: STIMULUS_CHART_SCHEMA,
    stem: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          text: { type: Type.STRING },
          distractorNote: { type: Type.STRING },
        },
        required: ['id', 'label', 'text', 'distractorNote'],
      },
    },
    correctOptionId: { type: Type.STRING },
    modelAnswer: { type: Type.STRING },
    pedagogicalExplanation: { type: Type.STRING },
    difficultyIndex: { type: Type.NUMBER },
    discriminationIndex: { type: Type.NUMBER },
    estimatedMinutes: { type: Type.INTEGER },
    points: { type: Type.INTEGER },
    rubric: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          criterion: { type: Type.STRING },
          maxPoints: { type: Type.INTEGER },
          levels: {
            type: Type.OBJECT,
            properties: {
              exemplary: { type: Type.STRING },
              proficient: { type: Type.STRING },
              developing: { type: Type.STRING },
              emerging: { type: Type.STRING },
            },
            required: ['exemplary', 'proficient', 'developing', 'emerging'],
          },
        },
        required: ['id', 'criterion', 'maxPoints', 'levels'],
      },
    },
  },
  required: [
    'code',
    'topic',
    'learningObjective',
    'bloomLevel',
    'stimulusKind',
    'stimulusTitle',
    'stimulusText',
    'stem',
    'options',
    'correctOptionId',
    'modelAnswer',
    'pedagogicalExplanation',
    'difficultyIndex',
    'discriminationIndex',
    'estimatedMinutes',
    'points',
    'rubric',
  ],
};

export interface GenerateStimulusRequest {
  subject?: string;
  gradeLevel?: string;
  curriculumStandard?: string;
  topic?: string;
  bloomLevel?: string;
  preferredKind?: string;
  stem?: string;
}

export async function generateStimulusWithGemini(
  input: GenerateStimulusRequest,
): Promise<unknown> {
  const { subject, gradeLevel, curriculumStandard, topic, bloomLevel, preferredKind, stem } =
    input;

  if (!subject || (!topic && !stem)) {
    throw new HttpError(
      400,
      'Mata pelajaran dan topik soal diperlukan untuk membuat stimulus.',
    );
  }

  const ai = getGeminiClient();
  const formatRule =
    preferredKind === 'data-table'
      ? 'Format MUST be "data-table". Include stimulusTable with 3–5 columns and 4–5 realistic, consistent rows of data alongside the explanatory stimulusText.'
      : preferredKind === 'chart-series'
        ? 'Format MUST be "chart-series". Include stimulusChart with 5–6 ordered xLabel data points and realistic numeric seriesA (and optional seriesB comparison values) alongside the explanatory stimulusText.'
        : preferredKind === 'passage'
          ? 'Format MUST be "passage". Provide a rich, authentic narrative scenario, primary-source excerpt, or case vignette in stimulusText (do not attach stimulusTable or stimulusChart).'
          : 'Choose the most pedagogically effective stimulusKind ("passage", "data-table", or "chart-series") for the subject and Bloom cognitive tier. For quantitative/STEM/Economics/Geography topics, prefer "data-table" or "chart-series" with concrete numbers; for Humanities/Language/Religion/Civics, prefer a rich "passage" or case scenario.';

  const prompt = [
    `Generate an authentic, curriculum-calibrated assessment stimulus for EduSoal AI.`,
    `Subject (Mata Pelajaran): ${subject}`,
    `Grade / Phase (Kelas / Fase): ${gradeLevel || 'Kelas 11 SMA · Fase F'}`,
    `Curriculum Standard / KD: ${curriculumStandard || 'Kurikulum Merdeka'}`,
    `Topic: ${topic || 'Topik terkait butir soal'}`,
    `Target Bloom Level: ${bloomLevel || 'C4'}`,
    stem ? `Existing Question Stem to support:\n${stem}` : '',
    `Stimulus Format Instruction: ${formatRule}`,
    `Rules:`,
    `- Tailor reading level, vocabulary, and complexity strictly to the specified Grade / Phase (${gradeLevel || 'Kelas 11 SMA · Fase F'}).`,
    `- Write in natural academic Indonesian when the subject/topic is in Indonesian (or match the language of the topic/subject, e.g., English for Bahasa Inggris).`,
    `- Provide a concise, informative stimulusTitle and realistic stimulusSource attribution.`,
    `- Ensure stimulusText is self-contained, engaging, and supports higher-order reasoning without giving away the answer.`,
  ]
    .filter(Boolean)
    .join('\n');

  const responseSchema =
    preferredKind === 'passage'
      ? {
          type: Type.OBJECT,
          properties: {
            stimulusKind: { type: Type.STRING },
            stimulusTitle: { type: Type.STRING },
            stimulusSource: { type: Type.STRING },
            stimulusText: { type: Type.STRING },
          },
          required: ['stimulusKind', 'stimulusTitle', 'stimulusSource', 'stimulusText'],
        }
      : preferredKind === 'data-table'
        ? {
            type: Type.OBJECT,
            properties: {
              stimulusKind: { type: Type.STRING },
              stimulusTitle: { type: Type.STRING },
              stimulusSource: { type: Type.STRING },
              stimulusText: { type: Type.STRING },
              stimulusTable: STIMULUS_TABLE_SCHEMA,
            },
            required: [
              'stimulusKind',
              'stimulusTitle',
              'stimulusSource',
              'stimulusText',
              'stimulusTable',
            ],
          }
        : preferredKind === 'chart-series'
          ? {
              type: Type.OBJECT,
              properties: {
                stimulusKind: { type: Type.STRING },
                stimulusTitle: { type: Type.STRING },
                stimulusSource: { type: Type.STRING },
                stimulusText: { type: Type.STRING },
                stimulusChart: STIMULUS_CHART_SCHEMA,
              },
              required: [
                'stimulusKind',
                'stimulusTitle',
                'stimulusSource',
                'stimulusText',
                'stimulusChart',
              ],
            }
          : STIMULUS_RESPONSE_SCHEMA;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior Indonesian Kurikulum Merdeka & international assessment designer. Create rich, authentic, bias-free contextual stimuli (literacy passages, experimental/statistical tables, or time-series charts) directly calibrated to student grade level and Bloom cognitive depth.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  );

  const rawText = (response.text ?? '{}').trim();
  return JSON.parse(rawText);
}

export interface GenerateQuestionsRequest {
  subject?: string;
  gradeLevel?: string;
  curriculumStandard?: string;
  topic?: string;
  sourceMaterial?: string;
  anchoredStimulus?: unknown;
  bloomLevel?: string;
  itemType?: string;
  count?: number;
}

export async function generateQuestionsWithGemini(
  input: GenerateQuestionsRequest,
): Promise<unknown> {
  const {
    subject,
    gradeLevel,
    curriculumStandard,
    topic,
    sourceMaterial,
    anchoredStimulus,
    bloomLevel,
    itemType,
    count,
  } = input;

  if (!subject || !topic || !bloomLevel) {
    throw new HttpError(400, 'Subject, topic, and target Bloom level are required.');
  }

  const ai = getGeminiClient();
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), 5);

  const prompt = [
    `Generate ${safeCount} institutional-grade academic assessment item(s) for EduSoal AI.`,
    `Subject: ${subject}`,
    `Grade / Phase: ${gradeLevel || 'Kelas 11 SMA · Fase F'}`,
    `Curriculum Standard: ${curriculumStandard || 'Kurikulum Merdeka'}`,
    `Topic: ${topic}`,
    `Target Bloom Taxonomy Level: ${bloomLevel} (must strictly match cognitive rigor of ${bloomLevel})`,
    `Item Format: ${itemType || 'multiple-choice'}`,
    anchoredStimulus
      ? `Use this Gemini-generated Context Stimulus as the anchor for every generated item (preserve its facts/data accurately and reflect it in stimulusKind/stimulusTitle/stimulusText/stimulusSource and any table/chart):\n${JSON.stringify(anchoredStimulus, null, 2)}`
      : sourceMaterial
        ? `Base Stimulus / Source Material to incorporate:\n${sourceMaterial}`
        : 'Automatically create an authentic, data-rich stimulus (stimulusKind: "passage", "data-table", or "chart-series") appropriate for the subject, grade level, and topic. Populate stimulusTable for "data-table" or stimulusChart for "chart-series" when quantitative data strengthens the question.',
    `Rules:`,
    `- If Item Format is "multiple-choice" or "case-analysis", include exactly 4 options labeled A, B, C, D with ids opt-a, opt-b, opt-c, opt-d, set correctOptionId to the matching id, and provide a concise pedagogical distractorNote explaining why each option is correct or a misconception.`,
    `- If Item Format is "short-essay", return an empty options array [] and empty correctOptionId "", and provide a detailed modelAnswer and 2-3 rubric criteria.`,
    `- difficultyIndex must be between 0.20 and 0.85; discriminationIndex between 0.25 and 0.55.`,
    `- Keep bloomLevel strictly as one of C1, C2, C3, C4, C5, C6 matching "${bloomLevel}".`,
  ].join('\n');

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior psychometrician and curriculum assessment designer. Produce rigorous, bias-free academic exam items with automatic, authentic stimuli, precise Bloom cognitive alignment, and high-quality distractors.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: QUESTION_ITEM_SCHEMA,
        },
      },
    }),
  );

  const rawText = (response.text ?? '[]').trim();
  return JSON.parse(rawText);
}

export interface RefineQuestionRequest {
  item?: unknown;
  instruction?: string;
}

export async function refineQuestionWithGemini(
  input: RefineQuestionRequest,
): Promise<unknown> {
  const { item, instruction } = input;
  if (!item || !instruction) {
    throw new HttpError(400, 'Both item and refinement instruction are required.');
  }

  const ai = getGeminiClient();
  const prompt = [
    `Refine the following academic assessment item according to the educator instruction.`,
    `Educator Instruction: ${instruction}`,
    `Current Item JSON:\n${JSON.stringify(item, null, 2)}`,
    `Return the complete updated item JSON maintaining structural validity, clear stimulus framing, and calibrated Bloom level (C1-C6).`,
  ].join('\n\n');

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior psychometrician refining exam questions for cognitive rigor, distractor plausibility, and curriculum clarity.',
        responseMimeType: 'application/json',
        responseSchema: QUESTION_ITEM_SCHEMA,
      },
    }),
  );

  const rawText = (response.text ?? '{}').trim();
  return JSON.parse(rawText);
}
