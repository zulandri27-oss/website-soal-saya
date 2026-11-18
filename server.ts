import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateQuestionsWithGemini,
  generateStimulusWithGemini,
  parseGeminiError,
  refineQuestionWithGemini,
} from './server/geminiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'edusoal-ai', runtime: 'express' });
  });

  app.post('/api/stimulus/generate', async (req, res) => {
    try {
      const stimulus = await generateStimulusWithGemini(req.body ?? {});
      res.json({ stimulus });
    } catch (error) {
      const { status, message } = parseGeminiError(error, 'Failed to generate stimulus.');
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/questions/generate', async (req, res) => {
    try {
      const items = await generateQuestionsWithGemini(req.body ?? {});
      res.json({ items });
    } catch (error) {
      const { status, message } = parseGeminiError(
        error,
        'Failed to generate assessment items.',
      );
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/questions/refine', async (req, res) => {
    try {
      const item = await refineQuestionWithGemini(req.body ?? {});
      res.json({ item });
    } catch (error) {
      const { status, message } = parseGeminiError(error, 'Failed to refine assessment item.');
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSoal AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
