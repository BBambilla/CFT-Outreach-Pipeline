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
    const { from, to, subject, attachments } = payload;
    const text = payload.body ?? payload.text;

    if (!from || !subject || !text || !to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ ok: false, error: 'Missing required field' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailOptions: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      replyTo: from,
    };
    if (Array.isArray(attachments) && attachments.length > 0) {
      emailOptions.attachments = attachments;
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
