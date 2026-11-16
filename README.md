# S.R.T. LSSD – Intranet (Discord přihlášení)

Node.js 18+ (Express). Frontend je čisté HTML/CSS/JS.

## Spuštění
1. `npm install`
2. Zkopíruj `.env.example` na `.env` a vyplň hodnoty (viz níže)
3. `npm start` → otevři http://localhost:3000/intranet.html

## Discord Developer Portal (https://discord.com/developers/applications)
1. New Application → pojmenuj ji.
2. **OAuth2 → Client ID** → do `DISCORD_CLIENT_ID`. **Reset Secret** → do `DISCORD_CLIENT_SECRET`.
3. **OAuth2 → Redirects → Add Redirect**: přesně stejná adresa jako `REDIRECT_URI`
   (lokálně `http://localhost:3000/auth/callback`, v ostrém provozu `https://tvoje-domena.cz/auth/callback`).
4. Scopes používané kódem: `identify` + `guilds.members.read` (nastavuje se v kódu, v portálu nic dalšího).

## Ostatní proměnné
- `GUILD_ID`: Discord → Nastavení → Pokročilé → zapnout Developer Mode, pravý klik na server → Kopírovat ID serveru.
- `STAFF_ROLE_ID`: Nastavení serveru → Role → pravý klik na roli → Kopírovat ID role. (Prázdné = stačí být na serveru.)
- `WEBHOOK_URL`: nastavení kanálu vedení → Integrace → Webhooky → Nový webhook → Kopírovat URL.
- `SESSION_SECRET`: dlouhý náhodný řetězec, např. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Úpravy obsahu
Roster, předpisy a akademii upravuješ v `data/*.json` (bez restartu). Divize pro formulář převelení jsou v `server.js` (`DIV`).

## Odkaz z hlavního webu
`<a href="/intranet.html">Pro zaměstnance</a>` a vedle něj `<a href="/auth/login">Přihlásit přes Discord</a>`.

## Bezpečnost / ostrý provoz
- Nasaď přes HTTPS, nastav `NODE_ENV=production` (zapne secure cookies).
- `.env` nikdy nezveřejňuj. Pokud uniknul secret nebo webhook, vygeneruj nový.
- Sessions jsou v paměti (po restartu se všichni odhlásí); pro větší provoz použij Redis store.
- Bez přihlášení server nevydá žádná data ani nepřijme formuláře. Samotná HTML stránka je veřejná, ale neobsahuje nic citlivého.
