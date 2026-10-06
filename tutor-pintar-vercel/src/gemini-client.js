// Inlined into the module by build-gemini.cjs; no credentials in browser code.
(() => {
  const demoSend = sendChat;
  const historyByTopic = {};
  let configured = false, busy = false, demo = false;
  let accessCode = ''; try { accessCode = sessionStorage.getItem('tp_class_access') || ''; } catch {}
  function openClassAccess() { document.getElementById('classAccessInput').value = accessCode; openStudioModal('classAccessDialog'); }
  window.saveClassAccess = () => { accessCode = document.getElementById('classAccessInput').value.trim(); try { sessionStorage.setItem('tp_class_access', accessCode); } catch {} closeStudioModal('classAccessDialog'); status.textContent = 'Kode akses tersimpan pada tab ini. Tekan Uji koneksi atau kirim pertanyaan.'; };
  window.clearClassAccess = () => { accessCode = ''; try { sessionStorage.removeItem('tp_class_access'); } catch {} document.getElementById('classAccessInput').value = ''; status.textContent = 'Kode akses dihapus dari tab ini.'; };
  const card = document.querySelector('#page-t .card');
  const panel = document.createElement('div');
  panel.className = 'gemini-controls';
  panel.innerHTML = '<div><span class="badge-tag badge-cyan" id="geminiBadge">Memeriksa tutor…</span><p id="geminiStatus" role="status" aria-live="polite">Menyiapkan koneksi.</p></div><div class="gemini-buttons"><button class="btn btn-sm btn-secondary" id="geminiRefresh">Periksa status</button><button class="btn btn-sm btn-secondary" id="geminiCheck">Uji koneksi</button><button class="btn btn-sm btn-outline" id="geminiMode">Gunakan tutor demo</button><button class="btn btn-sm btn-outline" id="geminiAccess">Kode akses</button><button class="btn btn-sm btn-outline" id="geminiGuide">Panduan tutor</button></div>';
  card.append(panel);
  const style = document.createElement('style');
  style.textContent = '.gemini-controls{margin-top:16px;padding:16px;border:1px solid #ffffffb0;border-radius:20px;background:#ffffff60}.gemini-controls p{margin:8px 0 12px;font-size:.88rem;overflow-wrap:anywhere}.gemini-buttons{display:flex;flex-wrap:wrap;gap:8px}.gemini-pending{opacity:.7}.gemini-error{color:#9b243a;background:#fff0f2;border-radius:14px;padding:12px;margin:8px 0;font-size:.9rem}.gemini-error button{margin-top:8px}.gemini-config-example{display:block;white-space:pre-wrap;overflow-wrap:anywhere;border-radius:14px;padding:16px;background:#edf2fc;color:#253852;user-select:text;-webkit-user-select:text}@media(max-width:450px){.gemini-buttons{display:grid;grid-template-columns:1fr 1fr}.gemini-buttons .btn{font-size:.74rem;padding:10px 8px}}';
  document.head.append(style);
  const input = document.getElementById('chatInput');
  input.maxLength = 2000;
  input.placeholder = 'Tanyakan konsep atau tuliskan analisismu…';
  const sendButton = input.parentElement.querySelector('button');
  const status = document.getElementById('geminiStatus');
  const badge = document.getElementById('geminiBadge');
  const checkButton = document.getElementById('geminiCheck');
  const modeButton = document.getElementById('geminiMode');
  const checkStatus = document.getElementById('geminiRefresh');
  function setBusy(value) {
    busy = value;
    sendButton.disabled = value; input.disabled = value;
    checkButton.disabled = value; modeButton.disabled = value; checkStatus.disabled = value;
    sendButton.textContent = value ? 'Menunggu…' : 'Kirim';
    document.getElementById('chatBox').setAttribute('aria-busy', String(value));
  }
  async function request(url, body) {
    const response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'x-tutor-access': accessCode },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000)
    });
    let data;
    try { data = await response.json(); } catch { throw new Error('Backend tutor belum tersedia. Pemilik modul perlu memeriksa deployment Vercel.'); }
    if (!response.ok) throw new Error(data.error || 'Koneksi tutor belum berhasil.');
    return data;
  }
  function modeLabel() { modeButton.textContent = demo ? 'Gunakan Gemini' : 'Gunakan tutor demo'; }
  async function refresh() {
    if (busy) return;
    if (location.protocol === 'file:') {
      configured = false; demo = true; modeLabel();
      badge.textContent = 'Tutor demo · file lokal';
      status.textContent = 'Untuk Gemini, buka alamat HTTPS e-module yang sudah di-deploy ke Vercel. Tutor demo bisa dipakai pada file lokal.';
      return;
    }
    checkStatus.disabled = true;
    try {
      const data = await request('/api/tutor/status');
      configured = data.configured === true; if (data.accessRequired && !accessCode) status.textContent = 'Masukkan kode akses kelas terlebih dahulu.';
      badge.textContent = demo ? 'Tutor demo' : configured ? 'Gemini · key terisi' : 'Gemini · belum diatur';
      status.textContent = configured ? (accessCode ? 'Tutor sudah disiapkan. Tekan Uji koneksi untuk memeriksa kode akses dan koneksi Gemini.' : 'Tutor sudah disiapkan. Tekan Kode akses dan masukkan kode kelas dari guru, lalu Uji koneksi.') : (data.setupMessage || 'Pemilik modul perlu menyiapkan Gemini di Vercel. Anda dapat memakai tutor demo.');
    } catch (error) {
      configured = false; badge.textContent = 'Server belum tersedia';
      status.textContent = 'Backend tutor belum tersedia. Pemilik modul perlu memeriksa deployment Vercel. Pilih tutor demo untuk melanjutkan.';
    } finally { checkStatus.disabled = false; }
  }
  async function testConnection() {
    if (busy) return;
    if (!accessCode) { openClassAccess(); return; }
    setBusy(true); status.textContent = 'Sedang menguji satu permintaan singkat ke Gemini…';
    try {
      const data = await request('/api/tutor/check', {});
      configured = true; demo = false; modeLabel();
      badge.textContent = 'Gemini · terhubung'; status.textContent = `${data.message} Tutor siap digunakan.`;
    } catch (error) {
      badge.textContent = 'Gemini · perlu diperiksa'; status.textContent = error.message;
    } finally { setBusy(false); }
  }
  async function sendGemini(txt, topic, level, retry = false) {
    if (busy) return;
    if (!retry) { input.value = ''; pushChat('user', txt); }
    setBusy(true);
    const chat = document.getElementById('chatBox');
    const pending = document.createElement('div');
    pending.className = 'chat-msg bot gemini-pending';
    pending.textContent = 'Gemini sedang menyusun petunjuk…'; chat.append(pending); chat.scrollTop = chat.scrollHeight;
    try {
      const previous = historyByTopic[topic] || [];
      const data = await request('/api/tutor', { message: txt, topic, level, history: previous });
      if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Respons tutor kosong. Coba kembali.');
      pending.remove(); pushChat('bot', data.answer);
      historyByTopic[topic] = [...previous, { role: 'user', text: txt }, { role: 'model', text: data.answer }].slice(-10);
      configured = true; badge.textContent = 'Gemini · terhubung';
      status.textContent = 'Respons dari Gemini. Percakapan pada topik yang sama digunakan sebagai konteks; nilai tes tetap dihitung oleh modul.';
      markDone('t');
      // Keep the module's existing concept check; AI text never awards scores.
      const t = TUTOR_TOPICS[topic];
      if (t.ok.test(txt) && !S.topicMastery[topic]) {
        S.topicMastery[topic] = true; addPoints('tutor', 25, `Cek Konsep ${t.n}`); renderTutorChips();
      }
    } catch (error) {
      pending.remove();
      const box = document.createElement('div'); box.className = 'gemini-error'; box.setAttribute('role', 'alert');
      const message = document.createElement('div'); message.textContent = error.message;
      const button = document.createElement('button'); button.className = 'btn btn-sm btn-secondary'; button.textContent = 'Coba kirim kembali';
      button.onclick = () => { if (!busy) { box.remove(); sendGemini(txt, topic, level, true); } };
      box.append(message, button); chat.append(box); chat.scrollTop = chat.scrollHeight;
      badge.textContent = 'Gemini · respons gagal'; status.textContent = error.message;
    } finally { setBusy(false); input.focus({ preventScroll: true }); }
  }
  sendChat = function () {
    if (busy) return;
    if (demo) { badge.textContent = 'Tutor demo · respons bawaan'; demoSend(); return; }
    const txt = input.value.trim(); if (!txt) return;
    if (!configured) { status.textContent = 'Gemini belum siap. Pemilik modul perlu mengatur Environment Variables Vercel. Anda bisa memakai tutor demo.'; return; }
    if (!accessCode) { openClassAccess(); return; }
    sendGemini(txt, curTopic, curScaffoldLvl);
  };
  checkStatus.onclick = refresh;
  checkButton.onclick = testConnection;
  modeButton.onclick = () => {
    if (busy) return;
    demo = !demo; modeLabel();
    if (demo) { badge.textContent = 'Tutor demo · respons bawaan'; status.textContent = 'Tutor menggunakan petunjuk bawaan modul. Tidak ada permintaan ke Gemini.'; }
    else refresh();
  };
  addStudioModal('classAccessDialog', 'Kode akses kelas', '<p>Masukkan kode tutor yang diberikan guru. Kode ini berbeda dari API key Gemini.</p><label for="classAccessInput">Kode kelas</label><input id="classAccessInput" type="password" autocomplete="off" maxlength="256" placeholder="Kode dari guru"><div class="gemini-buttons"><button class="btn btn-primary" onclick="saveClassAccess()">Simpan kode</button><button class="btn btn-secondary" onclick="clearClassAccess()">Hapus kode</button></div><p style="margin-top:12px">Kode hanya disimpan selama sesi tab ini. Materi dan tutor demo dapat dipakai tanpa kode.</p>');
  document.getElementById('geminiAccess').onclick = openClassAccess;
  addStudioModal('geminiSetupGuide', 'Menggunakan tutor Gemini', '<p>1. Tekan <b>Kode akses</b> dan masukkan kode kelas dari guru.</p><p>2. Tekan <b>Uji koneksi</b>, lalu tulis pertanyaan dan tekan <b>Kirim</b>.</p><p>Uji koneksi memakai satu permintaan API. Saat Gemini digunakan, pertanyaan dan riwayat topik aktif dikirim ke Google.</p><p>Keempat tombol bantuan memakai materi bawaan dan menentukan level petunjuk Gemini. <b>Gunakan tutor demo</b> untuk petunjuk bawaan tanpa internet.</p><p>Pemilik modul: API key dan kode kelas diatur lewat <b>Settings → Environment Variables</b> di Vercel, lalu <b>Redeploy</b>. API key tidak dimasukkan di halaman ini.</p>');
  document.getElementById('geminiGuide').onclick = () => openStudioModal('geminiSetupGuide');
  refresh();
})();
