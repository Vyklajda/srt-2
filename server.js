require('dotenv').config();
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
  res.redirect(`https://discord.com/oauth2/authorize?` + new URLSearchParams({
    client_id: E.DISCORD_CLIENT_ID, redirect_uri: E.REDIRECT_URI, response_type: 'code',
    scope: 'identify guilds.members.read', state, prompt: 'none' }));
});

app.get('/auth/callback', wrap(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.state) return res.redirect('/?err=state');
  delete req.session.state;

  const tRes = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: E.DISCORD_CLIENT_ID, client_secret: E.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code', code, redirect_uri: E.REDIRECT_URI }) });
  
  const tData = await tRes.json();
  if (!tRes.ok) return res.redirect('/?err=server');

  // Získání informací o uživateli
  const uRes = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${tData.access_token}` }
  });
  if (!uRes.ok) return res.redirect('/?err=denied');
  const user = await uRes.json();

  // Kontrola členství na Discord serveru
  const mRes = await fetch(`${API}/users/@me/guilds/${E.GUILD_ID}/member`, {
    headers: { Authorization: `Bearer ${tData.access_token}` }
  });
  if (!mRes.ok) return res.redirect('/?err=denied');

  req.session.user = {
    id: user.id,
    name: user.global_name || user.username,
    avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null
  };

  res.redirect('/intranet.html');
}));

app.get('/api/me', auth, (req, res) => res.json({ user: req.session.user }));
app.post('/auth/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

// ---------- Data a formuláře ----------
app.get('/api/data/docs', auth, wrap(async (req, res) => {
  const data = await fs.readFile(path.join(__dirname, 'data/docs.json'), 'utf8');
  res.json(JSON.parse(data));
}));

app.get('/api/data/academy', auth, wrap(async (req, res) => {
  const data = await fs.readFile(path.join(__dirname, 'data/academy.json'), 'utf8');
  res.json(JSON.parse(data));
}));

app.get('/api/forms', auth, wrap(async (req, res) => {
  const data = await fs.readFile(path.join(__dirname, 'data/forms.json'), 'utf8');
  res.json(JSON.parse(data));
}));

app.post('/api/submit/:id', auth, wrap(async (req, res) => {
  res.json({ success: true });
}));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Intranet běží na portu ' + PORT));
