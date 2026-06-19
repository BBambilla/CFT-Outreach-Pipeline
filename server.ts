import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.post('/api/send-email', async (req, res) => {
    try {
      const { from, fromName, to, subject, body, attachments } = req.body;
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const toArray = Array.isArray(to) ? to : to.split(',').map((e: string) => e.trim());

      const fromString = fromName ? `${fromName} <${from}>` : from;

      let resendAttachments: any[] = [];
      let attachmentNotes: string[] = [];

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          try {
            const resp = await fetch(att.url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const buffer = await resp.arrayBuffer();
            const base64Content = Buffer.from(buffer).toString('base64');
            
            resendAttachments.push({
              filename: att.filename,
              content: base64Content,
            });
          } catch (e: any) {
            console.error(`Failed to fetch attachment ${att.filename}`, e);
            attachmentNotes.push(`Could not attach ${att.filename}`);
          }
        }
      }

      const emailOptions: any = {
        from: fromString,
        replyTo: from,
        to: toArray,
        subject: subject,
        text: body,
      };

      if (resendAttachments.length > 0) {
        emailOptions.attachments = resendAttachments;
      }

      const { data, error } = await resend.emails.send(emailOptions);

      if (error) {
        return res.status(400).json({ error });
      }

      res.status(200).json({ 
        success: true, 
        data, 
        notes: attachmentNotes.length > 0 ? attachmentNotes : undefined 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/config', (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
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
