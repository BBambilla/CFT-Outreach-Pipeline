import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/ai/personalize', async (req, res) => {
    try {
      const { template, rationale, organization, recentActivity } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a sponsorship outreach assistant for a student. 
Rewrite the following outreach email template to make it highly personalized for the organization "${organization}".
Use this rationale why they are a good fit: "${rationale}".
${recentActivity ? `Recent activity log: "${recentActivity}"` : ''}

Original Template:
${template}

Return ONLY the personalized email body, nothing else.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error in /api/ai/personalize:', error);
      res.status(500).json({ error: error.message || 'Failed to personalize' });
    }
  });

  app.post('/api/ai/summarize', async (req, res) => {
    try {
      const { emailText } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Read the following email reply from a potential sponsor.
1. Provide a concise 2-line summary.
2. Suggest the next status (must be one of: To Research, Ready to Contact, Contacted, In Conversation, Committed, Declined / No Response).
3. Suggest the next action.

Email Reply:
${emailText}

Format your response as a JSON object:
{ "summary": "...", "suggestedStatus": "...", "suggestedAction": "..." }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || "{}";
      const match = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        responseText = match[1];
      }

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error('Error in /api/ai/summarize:', error);
      res.status(500).json({ error: error.message || 'Failed to summarize' });
    }
  });

  app.post('/api/ai/research', async (req, res) => {
    try {
      const { organization } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Help a student find contact information for a potential corporate sponsor named "${organization}".
Return a short checklist (3-4 items) of research steps, such as checking their website /about page, a specific LinkedIn search query, and corporate social responsibility (CSR) page patterns.

Format your response as a JSON array of strings:
["Step 1...", "Step 2..."]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      let responseText = response.text || "[]";
      const match = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        responseText = match[1];
      }

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error('Error in /api/ai/research:', error);
      res.status(500).json({ error: error.message || 'Failed to research' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
