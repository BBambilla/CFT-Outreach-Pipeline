import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: 'RESEND_API_KEY is missing' });
  }
  try {
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { from, fromName, subject, attachments } = payload;
    const text = payload.body ?? payload.text;

    // Accept "to" as an array OR a comma/semicolon-separated string.
    const toList = Array.isArray(payload.to)
      ? payload.to
      : String(payload.to || '')
          .split(/[,;]+/)
          .map((s: string) => s.trim())
          .filter(Boolean);

    if (!from || !subject || !text || toList.length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing required field' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailOptions: any = {
      from: fromName ? `${fromName} <${from}>` : from,
      to: toList,
      subject,
      text,
      replyTo: from,
    };

    // Resend wants { filename, content } (base64) OR { filename, path } (URL/file).
    // The app may send { filename, url } — map it to path.
    if (Array.isArray(attachments) && attachments.length > 0) {
      emailOptions.attachments = attachments.map((a: any) =>
        a && a.content
          ? { filename: a.filename, content: a.content }
          : { filename: a.filename, path: a.path || a.url }
      );
    }

    const { data, error } = await resend.emails.send(emailOptions);
    if (error) {
      return res.status(502).json({ ok: false, error: (error as any)?.message || 'Email service error' });
    }
    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Failed to send email' });
  }
}
