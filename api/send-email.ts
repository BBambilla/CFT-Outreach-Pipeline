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
    const { from, fromName, subject, attachments, html } = payload;
    const text = payload.body ?? payload.text;

    const toList = Array.isArray(payload.to)
      ? payload.to
      : String(payload.to || '').split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);

    const ccList = payload.cc
      ? (Array.isArray(payload.cc) ? payload.cc : String(payload.cc).split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean))
      : [];

    if (!from || !subject || (!text && !html) || toList.length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing required field' });
    }

    // Coordinators' personal mailboxes don't feed the shared capture inbox, so their
    // replies never reach the system. Add the shared inbox to their Reply-To so a reply
    // lands in BOTH their own inbox AND the system (where it attaches to the lead).
    const CAPTURE_INBOX = 'chapters@thesunprogram.com';
    const COORDINATORS = ['pratishtha@thesunprogram.com', 'olly@thesunprogram.com', 'glipman@thesunprogram.com'];
    const isCoordinator = COORDINATORS.includes(String(from || '').trim().toLowerCase());

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailOptions: any = {
      from: fromName ? `${fromName} <${from}>` : from,
      to: toList,
      subject,
      replyTo: isCoordinator ? [from, CAPTURE_INBOX] : from,
    };
    if (text) emailOptions.text = text;
    if (html) emailOptions.html = html;
    if (ccList.length > 0) emailOptions.cc = ccList;

    const dropped: string[] = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      const valid: any[] = [];
      for (const a of attachments) {
        if (a && a.content) { valid.push({ filename: a.filename, content: a.content }); continue; }
        const url = a && (a.path || a.url);
        if (!url) continue;
        let reachable = true;
        try {
          if (typeof fetch === 'function') { const head = await fetch(url, { method: 'HEAD' }); reachable = head.ok; }
        } catch (_e) { reachable = false; }
        if (reachable) valid.push({ filename: a.filename, path: url });
        else dropped.push(a.filename || url);
      }
      if (valid.length > 0) emailOptions.attachments = valid;
    }

    const { data, error } = await resend.emails.send(emailOptions);
    if (error) {
      return res.status(502).json({ ok: false, error: (error as any)?.message || 'Email service error' });
    }
    return res.status(200).json({ ok: true, id: data?.id, dropped });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Failed to send email' });
  }
}