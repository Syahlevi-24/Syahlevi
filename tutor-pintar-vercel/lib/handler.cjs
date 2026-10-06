'use strict';
const { createHash, timingSafeEqual } = require('node:crypto');
const { validateInput, generate, DEFAULT_MODEL } = require('./gemini.cjs');
const recent = [];
let active = 0;
function sameSecret(actual, expected) {
  return timingSafeEqual(createHash('sha256').update(actual).digest(), createHash('sha256').update(expected).digest());
}
async function handle(req, res, kind, options = {}) {
  const env = options.env || process.env;
  const json = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(data));
  };
  const config = { key: (env.GEMINI_API_KEY || '').trim(), model: (env.GEMINI_MODEL || DEFAULT_MODEL).trim() };
  const accessCode = (env.TUTOR_ACCESS_CODE || '').trim();
  try {
    if (kind === 'status' && req.method === 'GET') {
      json(200, { provider: 'Gemini', configured: !!config.key && accessCode.length >= 8, accessRequired: true, model: config.model,
        setupMessage: !config.key ? 'Pemilik modul perlu mengisi GEMINI_API_KEY di Vercel.' : accessCode.length < 8 ? 'Pemilik modul perlu mengisi TUTOR_ACCESS_CODE minimal 8 karakter di Vercel.' : '' });
      return;
    }
    if (req.method !== 'POST' || kind === 'status') {
      res.setHeader('Allow', kind === 'status' ? 'GET' : 'POST'); json(405, { error: 'Metode tidak didukung.' }); return;
    }
    let origin;
    try { origin = new URL(req.headers.origin); } catch { json(403, { error: 'Buka tutor melalui halaman e-module.' }); return; }
    if (!['https:', 'http:'].includes(origin.protocol) || origin.host !== req.headers.host || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) {
      json(403, { error: 'Gunakan tutor dari domain e-module yang sama.' }); return;
    }
    if (!config.key || accessCode.length < 8) {
      json(503, { error: 'Pemilik modul perlu mengisi GEMINI_API_KEY dan TUTOR_ACCESS_CODE di Settings → Environment Variables Vercel, lalu Redeploy.' }); return;
    }
    const supplied = req.headers['x-tutor-access'];
    if (typeof supplied !== 'string' || supplied.length > 256 || !sameSecret(supplied, accessCode)) {
      json(401, { error: 'Kode akses kelas belum diisi atau tidak sesuai. Tekan Kode akses lalu masukkan kode dari guru.', code: 'ACCESS_REQUIRED' }); return;
    }
    if (!(req.headers['content-type'] || '').startsWith('application/json')) { json(415, { error: 'Gunakan JSON.' }); return; }
    let body;
    try { body = req.body; if (typeof body === 'string') body = JSON.parse(body); }
    catch { json(400, { error: 'Data permintaan tidak valid.' }); return; }
    if (Buffer.byteLength(JSON.stringify(body ?? {})) > 32000) { json(413, { error: 'Percakapan terlalu panjang.' }); return; }
    const input = validateInput(kind === 'check' ? { message: 'Jawab singkat: apakah kamu siap membimbing termodinamika?', topic: 'adiabatik', level: 1 } : body);
    const now = Date.now(); while (recent.length && recent[0] < now - 60000) recent.shift();
    // Per-instance throttling is best effort; the classroom code gates all paid API calls.
    if (recent.length >= 30 || active >= 3) { json(429, { error: 'Tutor sedang ramai. Tunggu sebentar lalu coba kembali.' }); return; }
    recent.push(now); active++;
    try {
      const answer = await generate(config, input, options.fetchImpl || fetch);
      json(200, kind === 'check' ? { ok: true, model: config.model, message: 'Koneksi Gemini berhasil diuji.' } : { answer, provider: 'Gemini' });
    } finally { active--; }
  } catch (error) {
    // Never print or forward credentials, provider errors, or request contents.
    json(error.status || 500, { code: error.code || 'SERVER_ERROR', error: error.status ? error.message : 'Tutor mengalami kendala. Coba kembali.' });
  }
}
module.exports = { handle };
