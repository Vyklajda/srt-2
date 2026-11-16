require('dotenv').config();
app.set('trust proxy', 1);
const express = require('express'), session = require('express-session'), helmet = require('helmet');
const crypto = require('crypto'), fs = require('fs/promises'), path = require('path');

const E = process.env, API = 'https://discord.com/api/v10', prod = E.NODE_ENV === 'production';
for (const k of ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'REDIRECT_URI', 'GUILD_ID', 'WEBHOOK_URL', 'SESSION_SECRET'])
  if (!E[k]) { console.error('Chybí proměnná v .env: ' + k); process.exit(1); }

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'img-src': ["'self'", 'https://cdn.discordapp.com', 'data:'] } } }));
app.use(session({ name: 'srt.sid', secret: E.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: prod, maxAge: 8 * 3600e3 } }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const auth = (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'Nepřihlášen' });
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Chyba serveru' }); });

// ---------- Discord OAuth2 ----------
app.get('/auth/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;
  res.redirect('https://discord.com/oauth2/authorize?' + new URLSearchParams({
    client_id: E.DISCORD_CLIENT_ID, redirect_uri: E.REDIRECT_URI, response_type: 'code',
    scope: 'identify guilds.members.read', state, prompt: 'none' }));
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query, saved = req.session.state;
  delete req.session.state;
  if (!code || !state || state !== saved) return res.redirect('/intranet.html?err=state');
  try {
    const t = await fetch(API + '/oauth2/token', { method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: E.DISCORD_CLIENT_ID, client_secret: E.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code', code, redirect_uri: E.REDIRECT_URI }) });
    if (!t.ok) throw new Error('token ' + t.status);
    const { access_token } = await t.json();
    // Vrací člena našeho serveru (role + uživatel); 404 = není na serveru
    const m = await fetch(`${API}/users/@me/guilds/${E.GUILD_ID}/member`, { headers: { Authorization: 'Bearer ' + access_token } });
    if (!m.ok) return res.redirect('/intranet.html?err=denied');
    const mem = await m.json();
    if (E.STAFF_ROLE_ID && !(mem.roles || []).includes(E.STAFF_ROLE_ID)) return res.redirect('/intranet.html?err=denied');
    const u = mem.user;
    req.session.regenerate(err => {
      if (err) return res.redirect('/intranet.html?err=server');
      req.session.user = { id: u.id, name: mem.nick || u.global_name || u.username,
        avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : null };
      res.redirect('/intranet.html');
    });
  } catch (e) { console.error(e.message); res.redirect('/intranet.html?err=server'); }
});

app.get('/api/me', auth, (req, res) => res.json({ user: req.session.user }));
app.post('/auth/logout', (req, res) => req.session.destroy(() => { res.clearCookie('srt.sid'); res.json({ ok: true }); }));

// ---------- Chráněná data (úpravy v /data/*.json se projeví hned) ----------
app.get('/api/data/:n', auth, wrap(async (req, res) => {
  if (!['docs', 'roster', 'academy'].includes(req.params.n)) return res.sendStatus(404);
  res.type('json').send(await fs.readFile(path.join(__dirname, 'data', req.params.n + '.json')));
}));

// ---------- Formuláře -> Discord webhook ----------
const DIV = ['Patrol', 'S.R.T.', 'Detective Bureau', 'Traffic', 'Air Unit'];   // uprav podle sebe
const FORMS = {
  vacation: { title: 'Žádost o dovolenou', f: [['od', 'Od', 'date'], ['do', 'Do', 'date'], ['duvod', 'Důvod', 'text']] },
  promotion: { title: 'Žádost o povýšení', f: [['hodnost', 'Aktuální hodnost', 'line'], ['duvod', 'Důvod / zásluhy', 'text']] },
  transfer: { title: 'Žádost o převelení', f: [['divize', 'Požadovaná divize', 'select', DIV], ['duvod', 'Důvod', 'text']] },
  uof: { title: 'Use of Force / incident report', f: [['datum', 'Datum a čas', 'line'], ['misto', 'Místo', 'line'],
    ['zucastneni', 'Zúčastnění', 'line'],
    ['prostredek', 'Použitý prostředek', 'select', ['Střelná zbraň', 'Taser', 'Obušek', 'Hmaty / pěsti', 'Jiné']],
    ['zraneni', 'Zranění', 'select', ['Ne', 'Ano – podezřelý', 'Ano – člen LSSD', 'Ano – civilista']],
    ['popis', 'Popis situace', 'text']] }
};
app.get('/api/forms', auth, (req, res) => res.json(FORMS));

const hits = new Map();
app.post('/api/submit/:id', auth, wrap(async (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ error: 'Neplatný požadavek' });
  const F = FORMS[req.params.id]; if (!F) return res.sendStatus(404);
  const u = req.session.user, now = Date.now();
  const h = (hits.get(u.id) || []).filter(t => now - t < 60e3);
  if (h.length >= 5) return res.status(429).json({ error: 'Moc odeslání, zkus to za minutu.' });
  hits.set(u.id, [...h, now]);

  const fields = [{ name: 'Odesílatel', value: `<@${u.id}> (${u.name})`.slice(0, 1024) }];
  for (const [k, label, type, opts] of F.f) {
    const v = String(req.body[k] ?? '').trim();
    if (!v || v.length > (type === 'text' ? 1000 : 200) ||
        (type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) || (type === 'select' && !opts.includes(v)))
      return res.status(400).json({ error: 'Neplatné pole: ' + label });
    fields.push({ name: label, value: v, inline: type !== 'text' });
  }
  const r = await fetch(E['WEBHOOK_' + req.params.id.toUpperCase()] || E.WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'LSSD Intranet', allowed_mentions: { parse: [] }, embeds: [{
      title: F.title, color: 0xD4AF37, fields, timestamp: new Date().toISOString(),
      author: { name: u.name, icon_url: u.avatar || undefined }, footer: { text: 'S.R.T. LSSD Intranet' } }] }) });
  if (!r.ok) return res.status(502).json({ error: 'Odeslání na Discord selhalo' });
  res.json({ ok: true });
}));

const ahits = new Map();
app.post('/api/apply', wrap(async (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ error: 'Neplatný požadavek' });
  const now = Date.now(), h = (ahits.get(req.ip) || []).filter(t => now - t < 600e3);
  if (h.length >= 3) return res.status(429).json({ error: 'Moc odeslání, zkus to později.' });
  ahits.set(req.ip, [...h, now]);
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const ic = s(req.body.ic, 100), dc = s(req.body.dc, 100), text = s(req.body.text, 3500), pct = Math.round(Number(req.body.pct));
  if (!ic || !dc || !text || !(pct >= 0 && pct <= 100)) return res.status(400).json({ error: 'Neplatná přihláška' });
  const r = await fetch(E.WEBHOOK_APPLY || E.WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'LSSD Nábor', allowed_mentions: { parse: [] }, embeds: [{
      title: 'Nová přihláška do S.R.T.', color: 0xD4AF37, description: text, timestamp: new Date().toISOString(),
      fields: [{ name: 'IC jméno', value: ic, inline: true }, { name: 'Discord', value: dc, inline: true },
        { name: 'Test', value: pct + ' % ' + (req.body.ok ? '✔' : '✘'), inline: true }] }] }) });
  if (!r.ok) return res.status(502).json({ error: 'Odeslání na Discord selhalo' });
  res.json({ ok: true });
}));app.get('/health', (req, res) => res.send('ok'));app.listen(E.PORT || 3000, () => console.log('Intranet běží na portu ' + (E.PORT || 3000)));
