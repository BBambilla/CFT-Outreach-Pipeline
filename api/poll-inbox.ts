import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };
const MAX_PER_RUN = 10;

export default async function handler(req: any, res: any) {
  const provided =
    (req.query && req.query.token) ||
    (req.headers && req.headers['x-poll-secret']) || '';
  const expected = process.env.POLL_SECRET;
  if (!expected || provided !== expected) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const IMAP_HOST = process.env.IMAP_HOST;
  const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
  const IMAP_USER = process.env.IMAP_USER;
  const IMAP_PASS = process.env.IMAP_PASS;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: 'Missing server configuration' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const client = new ImapFlow({
    host: IMAP_HOST, port: IMAP_PORT, secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS }, logger: false,
  });

  let processed = 0;
  let lock: any = null;
  try {
    await client.connect();
    lock = await client.getMailboxLock('INBOX');
    let unseenUids: any = await client.search({ seen: false }, { uid: true });
    if (!Array.isArray(unseenUids)) unseenUids = [];
    const uidsToProcess = unseenUids.slice(0, MAX_PER_RUN);

    if (uidsToProcess.length > 0) {
      const messages = await client.fetchAll(uidsToProcess, { uid: true, source: true }, { uid: true });
      for (const message of messages) {
        try {
          const parsed = await simpleParser(message.source as Buffer);
          const fromAddr = parsed.from && parsed.from.value && parsed.from.value[0] ? parsed.from.value[0] : undefined;
          const fromEmail = fromAddr && fromAddr.address ? fromAddr.address : '';
          const fromName = fromAddr && fromAddr.name ? fromAddr.name : '';
          let toEmail = '';
          const toObj: any = parsed.to;
          if (toObj) {
            if (Array.isArray(toObj)) {
              if (toObj[0] && toObj[0].value && toObj[0].value[0]) toEmail = toObj[0].value[0].address || toObj[0].text || '';
            } else if (toObj.value && toObj.value[0]) {
              toEmail = toObj.value[0].address || toObj.text || '';
            }
          }
          const subject = parsed.subject || '';
          const bodyText = parsed.text || '';
          const bodyHtml = parsed.html ? String(parsed.html) : '';
          const messageId = parsed.messageId || '';
          const inReplyTo = parsed.inReplyTo || '';
          const receivedAt = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
          const rawHeaders: Record<string, string> = {};
          if (Array.isArray(parsed.headerLines)) {
            for (const h of parsed.headerLines) { if (h && h.key) rawHeaders[h.key] = h.line; }
          }
          const raw = { uid: message.uid, messageId, inReplyTo, subject, from: { address: fromEmail, name: fromName }, to: toEmail, date: receivedAt, headers: rawHeaders };

          const { error } = await supabase.rpc('ingest_inbound_message', {
            p_from_email: fromEmail, p_from_name: fromName, p_to_email: toEmail,
            p_subject: subject, p_body_text: bodyText, p_body_html: bodyHtml,
            p_message_id: messageId, p_in_reply_to: inReplyTo,
            p_received_at: receivedAt, p_raw: raw,
          });
          if (error) { console.error('ingest failed for uid', message.uid, error.message); continue; }

          await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
          processed++;
        } catch (msgErr: any) {
          console.error('Failed to process message uid', message && message.uid, msgErr && msgErr.message);
        }
      }
    }
    return res.status(200).json({ ok: true, processed });
  } catch (err: any) {
    console.error('poll-inbox connection error:', err && err.message);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : 'connection failed' });
  } finally {
    if (lock) { try { lock.release(); } catch (_e) {} }
    try { await client.logout(); } catch (_e) {}
  }
}
