const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = async u => { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r.json(); };
const ERR = { denied: 'Přístup odepřen – nejsi veden jako aktivní člen na SRT Discordu',
  state: 'Přihlášení vypršelo, zkus to znovu.', server: 'Chyba přihlášení, zkus to později.' };

const q = new URLSearchParams(location.search).get('err');
if (q) { $('#msg').hidden = false; $('#msg').textContent = ERR[q] || ERR.server; history.replaceState(null, '', location.pathname); }
J('/api/me').then(d => start(d.user)).catch(() => {});

function start(u) {
  $('#gate').hidden = true; $('#app').hidden = false;
  $('#auth').innerHTML = `<span class="user">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : ''}<b>${esc(u.name)}</b></span><button class="btn sm ghost" id="out">Odhlásit</button>`;
  $('#out').onclick = async () => { await fetch('/auth/logout', { method: 'POST' }); location.reload(); };
  $$('#tabs button').forEach(b => b.onclick = () => {
    $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.panel').forEach(p => p.hidden = p.id !== b.dataset.t); });
  docs(); forms(); roster(); academy();
}

async function docs() {
  const d = await J('/api/data/docs');
  $('#dl').innerHTML = d.map(c => `<div class="cat"><h3>${esc(c.cat)}</h3>${c.items.map(i =>
    `<details data-s="${esc((i.t + ' ' + i.x).toLowerCase())}"><summary>${esc(i.t)}</summary><p>${esc(i.x)}</p></details>`).join('')}</div>`).join('');
  $('#dq').oninput = e => {
    const v = e.target.value.toLowerCase().trim();
    $$('#dl details').forEach(el => { const m = !v || el.dataset.s.includes(v); el.hidden = !m; el.open = !!v && m; });
    $$('#dl .cat').forEach(c => c.hidden = !c.querySelector('details:not([hidden])')); };
}

async function forms() {
  const F = await J('/api/forms'), ids = Object.keys(F);
  $('#fsel').innerHTML = ids.map(i => `<button type="button" data-f="${esc(i)}">${esc(F[i].title)}</button>`).join('');
  const show = id => {
    $$('#fsel button').forEach(b => b.classList.toggle('on', b.dataset.f === id));
    $('#fres').textContent = ''; $('#fform').dataset.id = id;
    $('#fform').innerHTML = F[id].f.map(([k, l, t, o]) => `<label>${esc(l)}` + (t === 'text'
      ? `<textarea name="${esc(k)}" maxlength="1000" required></textarea>` : t === 'select'
      ? `<select name="${esc(k)}" required>${o.map(v => `<option>${esc(v)}</option>`).join('')}</select>`
      : `<input name="${esc(k)}" type="${t === 'date' ? 'date' : 'text'}" maxlength="200" required>`) + '</label>').join('')
      + '<p><button class="btn">Odeslat vedení</button></p>'; };
  $$('#fsel button').forEach(b => b.onclick = () => show(b.dataset.f)); show(ids[0]);
  $('#fform').onsubmit = async e => {
    e.preventDefault(); const f = e.target, r = $('#fres'); r.className = ''; r.textContent = 'Odesílám…';
    try {
      const x = await fetch('/api/submit/' + f.dataset.id, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      const j = await x.json(); if (!x.ok) throw new Error(j.error);
      r.className = 'ok'; r.textContent = 'Odesláno vedení ✔'; f.reset();
    } catch (er) { r.className = 'bad'; r.textContent = er.message || 'Chyba odeslání'; } };
}

async function roster() {
  const SHEET_URL = "https://script.google.com/macros/s/AKfycbyoCdfJRUvokQA-Sr9v1PM_jgLHM9Z3w952xt3wG6QAzxrodfiMJ9sekz1hOahNuAMxVQ/exec";
  const res = await fetch(SHEET_URL);
  const d = await res.json();

  const opt = k => [...new Set(d.map(x => x[k]).filter(Boolean))].sort().map(v => `<option>${esc(v)}</option>`).join('');
  $('#rd').innerHTML = '<option value="">Všechny divize</option>' + opt('divize');
  $('#rr').innerHTML = '<option value="">Všechny hodnosti</option>' + opt('hodnost');
  const draw = () => {
    const s = $('#rs').value.toLowerCase().trim(), dv = $('#rd').value, rk = $('#rr').value;
    const rows = d.filter(x => (!dv || x.divize === dv) && (!rk || x.hodnost === rk) && (!s || (String(x.jmeno || '') + ' ' + String(x.odznak || '')).toLowerCase().includes(s)));
    $('#rt').innerHTML = rows.map(x => `<tr><td>${esc(x.odznak)}</td><td>${esc(x.jmeno)}</td><td>${esc(x.hodnost)}</td><td>${esc(x.divize)}</td>
      <td><span class="st ${x.stav === 'Aktivní' ? 'ok' : 'off'}">${esc(x.stav)}</span></td></tr>`).join('') || '<tr><td colspan="5">Nic nenalezeno</td></tr>';
    $('#rc').textContent = rows.length + ' / ' + d.length;
  };
  ['#rs', '#rd', '#rr'].forEach(s => $(s).oninput = draw); draw();
}

async function academy() {
  const d = await J('/api/data/academy'), safe = u => /^https?:\/\//.test(u) ? u : '#';
  $('#ah').innerHTML = d.handbooks.map(h => `<a class="card" href="${esc(safe(h.url))}" target="_blank" rel="noopener"><b>${esc(h.t)}</b><span>${esc(h.d)}</span></a>`).join('');
  const det = a => a.map(i => `<details><summary>${esc(i.t)}</summary><p>${esc(i.x)}</p></details>`).join('');
  $('#ai').innerHTML = det(d.investigation); $('#at').innerHTML = det(d.tactics);
  const draw = () => {
    const v = $('#cs').value.toLowerCase().trim();
    $('#ct').innerHTML = d.codes.filter(c => !v || (c.c + ' ' + c.m).toLowerCase().includes(v))
      .map(c => `<tr><td><b>${esc(c.c)}</b></td><td>${esc(c.m)}</td></tr>`).join('') || '<tr><td colspan="2">Nic nenalezeno</td></tr>';
  };
  $('#cs').oninput = draw; draw();
}
