/**
 * BACKEND — Glow Dental (Google Apps Script) · v1
 * ------------------------------------------------
 * Feuilles (kaytkhel9o b wa7dhom): Produits · Commandes · Clients
 *
 * Produits  : had l-feuille hiya l-catalogue. Beddel prix_dh, variantes wla dispo
 *             hna (wla men admin.html) w l-site kayt-mettra à jour direct.
 *   - variantes : "5 cm:125 | 7,5 cm:190 | 10 cm:250"  (khawya = prix wa7ed)
 *   - dispo     : oui / non   (non = "Rupture" f l-site, ma ytcommandach)
 *   - photo     : khawya = img/<id>.webp f l-site, wla 7ett lien dyal tswira
 *
 * Commandes : statut = nouvelle · confirmée · en livraison · livrée · annulée
 *
 * INSTALLATION (mra wa7da):
 *   1. Google Sheets → feuille jdida "Commandes Glow Dental"
 *   2. Extensions → Apps Script → colle had l-code kamel → Enregistrer
 *   3. Exécuter la fonction  setup  (katkhel9 les feuilles w katjib les 284 produits)
 *   4. Déployer → Nouveau déploiement → Application Web
 *        Exécuter en tant que : Moi · Accès : Tout le monde → Déployer
 *   5. Copie l-lien li kaysali b /exec → 7ettou f index.html w admin.html (CONFIG.apiUrl)
 *
 * ⚙️ RÉGLAGES — beddel hna
 */
const ADMIN_PIN = 'CHANGE_MOI';      // ⚠️ code dyal l-admin: beddlo GHIR hna f Apps Script (repo public)
const SHOP = 'Glow Dental';
const SITE_URL = 'https://glow-dental-maroc-93ik.vercel.app';
const NOTIFY_EMAIL = '';             // khawi = email dyal compte Google li dar déploiement
const WHATSAPP_PHONE = '';           // notification WhatsApp gratuite (CallMeBot): ex '212612345678'
const WHATSAPP_APIKEY = '';          // apikey li katwsel men CallMeBot
const NTFY_TOPIC = '';               // notification push b l-app ntfy: ex 'glow-dental-k39x7'
const TELEGRAM_TOKEN = '';           // optionnel
const TELEGRAM_CHAT_ID = '';         // optionnel

const STATUTS = ['nouvelle', 'confirmée', 'en livraison', 'livrée', 'annulée'];
const SHEETS = {
  Produits:  ['id', 'nom', 'categorie', 'prix_dh', 'variantes', 'unite', 'dispo', 'photo', 'ordre'],
  Commandes: ['id', 'cree_le', 'nom', 'cabinet', 'telephone', 'ville', 'adresse', 'produits', 'articles', 'total_dh', 'statut', 'note', 'items_json', 'maj_le'],
  Clients:   ['telephone', 'nom', 'cabinet', 'ville', 'nb_commandes', 'total_dh', 'derniere_commande']
};

/* ---------------- helpers ---------------- */
function sh_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold').setBackground('#0A2A66').setFontColor('#ffffff');
  }
  return sh;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function rows_(name) {
  const sh = sh_(name), vals = sh.getDataRange().getValues(), head = SHEETS[name];
  return vals.slice(1).map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => o[h] = r[j]); return o; });
}
function phone_(p) { let d = String(p || '').replace(/\D/g, ''); if (d.indexOf('212') === 0) d = '0' + d.slice(3); return d; }
function now_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'); }
function fmt_(n) { return Number(n || 0).toLocaleString('fr-FR') + ' DH'; }
function clean_(s, max) { return String(s == null ? '' : s).replace(/[<>]/g, '').trim().slice(0, max || 200); }
function newId_() {
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  const n = rows_('Commandes').filter(r => String(r.id).indexOf('GD-' + d) === 0).length + 1;
  return 'GD-' + d + '-' + ('00' + n).slice(-3);
}
function parseVar_(s) {
  s = String(s || '').trim(); if (!s) return null;
  const v = s.split('|').map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.lastIndexOf(':'); return { l: x.slice(0, i).trim(), p: Number(String(x.slice(i + 1)).replace(/[^\d.]/g, '')) };
  }).filter(x => x.l && !isNaN(x.p));
  return v.length ? v : null;
}
function isOn_(v) { return !/^(non|no|0|false|rupture)$/i.test(String(v).trim()); }

/* ---------------- produits ---------------- */
function produits_() {
  return rows_('Produits').filter(r => r.id).map(r => {
    const o = { id: String(r.id), name: String(r.nom), cat: String(r.categorie), dispo: isOn_(r.dispo), ordre: Number(r.ordre) || 0 };
    const v = parseVar_(r.variantes);
    if (v) o.v = v; else o.p = (r.prix_dh === '' || r.prix_dh == null) ? null : Number(r.prix_dh);
    if (r.unite) o.u = String(r.unite);
    if (r.photo) o.photo = String(r.photo);
    return o;
  }).sort((a, b) => a.ordre - b.ordre);
}
function priceOf_(p, option) {
  if (p.v) { const v = p.v.find(x => x.l === option) || null; return v ? v.p : null; }
  return p.p;
}

/* ---------------- notifications ---------------- */
function notify_(subject, lines) {
  const body = lines.join('\n'), url = SITE_URL + '/admin.html';
  try {
    if (WHATSAPP_PHONE && WHATSAPP_APIKEY) UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent('+' + WHATSAPP_PHONE) +
      '&apikey=' + encodeURIComponent(WHATSAPP_APIKEY) + '&text=' + encodeURIComponent('🦷 *' + subject + '*\n\n' + body + '\n\n👉 ' + url), { muteHttpExceptions: true });
  } catch (e) { console.error(e); }
  try {
    if (NTFY_TOPIC) UrlFetchApp.fetch('https://ntfy.sh/' + encodeURIComponent(NTFY_TOPIC), { method: 'post', muteHttpExceptions: true, payload: body,
      headers: { 'Title': subject, 'Priority': 'high', 'Tags': 'tooth', 'Click': url } });
  } catch (e) { console.error(e); }
  try {
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: '🦷 ' + subject + '\n\n' + body + '\n\n' + url }) });
  } catch (e) { console.error(e); }
  try {
    const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    if (to) MailApp.sendEmail(to, '🦷 ' + subject + ' — ' + SHOP, body + '\n\n👉 ' + url);
  } catch (e) { console.error(e); }
}

/* ---------------- GET ---------------- */
function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'produits';
  try {
    if (a === 'produits') return json_({ ok: true, produits: produits_() });
    if (a === 'status') {
      const id = clean_(e.parameter.id, 20), tel = phone_(e.parameter.tel);
      const r = rows_('Commandes').find(x => String(x.id) === id && phone_(x.telephone) === tel);
      return json_(r ? { ok: true, id: id, statut: String(r.statut), total: Number(r.total_dh) || 0, date: String(r.cree_le) } : { ok: false, error: 'notfound' });
    }
    return json_({ ok: false, error: 'action' });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
}

/* ---------------- POST ---------------- */
function doPost(e) {
  let b = {}; try { b = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'json' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (b.action === 'commande') return json_(commande_(b));
    if (String(b.action).indexOf('admin_') === 0) {
      if (String(b.pin) !== String(ADMIN_PIN) || ADMIN_PIN === 'CHANGE_MOI') return json_({ ok: false, error: 'pin' });
      if (b.action === 'admin_login') return json_({ ok: true });
      if (b.action === 'admin_list') return json_(adminList_());
      if (b.action === 'admin_statut') return json_(adminStatut_(b));
      if (b.action === 'admin_produit') return json_(adminProduit_(b));
    }
    return json_({ ok: false, error: 'action' });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
  finally { try { lock.releaseLock(); } catch (x) {} }
}

function commande_(b) {
  const c = b.client || {};
  const nom = clean_(c.nom, 80), tel = phone_(c.tel), ville = clean_(c.ville, 60);
  if (!nom || tel.length < 9 || !ville) return { ok: false, error: 'client' };
  const cat = {}; produits_().forEach(p => cat[p.id] = p);
  const items = (b.items || []).slice(0, 200).map(i => {
    const p = cat[i.id]; if (!p) return null;
    const qte = Math.max(1, Math.min(9999, parseInt(i.qte, 10) || 1));
    const prix = priceOf_(p, i.option);
    return { id: p.id, nom: p.name, option: p.v ? clean_(i.option, 40) : '', qte: qte, prix: prix, dispo: p.dispo };
  }).filter(Boolean);
  if (!items.length) return { ok: false, error: 'vide' };
  const total = items.reduce((s, i) => s + (i.prix || 0) * i.qte, 0);
  const articles = items.reduce((s, i) => s + i.qte, 0);
  const id = newId_();
  const txt = items.map(i => i.qte + ' × ' + i.nom + (i.option ? ' (' + i.option + ')' : '') + ' — ' + (i.prix == null ? 'sur demande' : fmt_(i.prix * i.qte))).join('\n');
  sh_('Commandes').appendRow([id, now_(), nom, clean_(c.cabinet, 80), "'" + tel, ville, clean_(c.adresse, 160), txt, articles, total, 'nouvelle', clean_(b.note || c.note, 400), JSON.stringify(items), now_()]);
  client_(tel, nom, clean_(c.cabinet, 80), ville, total);
  notify_('Nouvelle commande ' + id, ['👤 ' + nom + (c.cabinet ? ' · ' + clean_(c.cabinet, 80) : ''), '📍 ' + ville, '📞 ' + tel, '', txt, '', 'Total : ' + fmt_(total)]);
  return { ok: true, id: id, total: total };
}
function client_(tel, nom, cabinet, ville, total) {
  const sh = sh_('Clients'), r = rows_('Clients').find(x => phone_(x.telephone) === tel);
  if (r) sh.getRange(r._row, 1, 1, 7).setValues([["'" + tel, nom, cabinet || r.cabinet, ville, (Number(r.nb_commandes) || 0) + 1, (Number(r.total_dh) || 0) + total, now_()]]);
  else sh.appendRow(["'" + tel, nom, cabinet, ville, 1, total, now_()]);
}

/* ---------------- admin ---------------- */
function adminList_() {
  const cmds = rows_('Commandes').filter(r => r.id).map(r => ({
    id: String(r.id), date: String(r.cree_le), nom: String(r.nom), cabinet: String(r.cabinet), tel: String(r.telephone).replace(/^'/, ''),
    ville: String(r.ville), produits: String(r.produits), articles: Number(r.articles) || 0, total: Number(r.total_dh) || 0,
    statut: String(r.statut || 'nouvelle'), note: String(r.note || '')
  })).reverse().slice(0, 300);
  return { ok: true, commandes: cmds, produits: produits_(), statuts: STATUTS };
}
function adminStatut_(b) {
  if (STATUTS.indexOf(b.statut) < 0) return { ok: false, error: 'statut' };
  const r = rows_('Commandes').find(x => String(x.id) === String(b.id)); if (!r) return { ok: false, error: 'notfound' };
  const sh = sh_('Commandes'), h = SHEETS.Commandes;
  sh.getRange(r._row, h.indexOf('statut') + 1).setValue(b.statut);
  sh.getRange(r._row, h.indexOf('maj_le') + 1).setValue(now_());
  return { ok: true };
}
function adminProduit_(b) {
  const r = rows_('Produits').find(x => String(x.id) === String(b.id)); if (!r) return { ok: false, error: 'notfound' };
  const sh = sh_('Produits'), h = SHEETS.Produits;
  if ('prix_dh' in b) sh.getRange(r._row, h.indexOf('prix_dh') + 1).setValue(b.prix_dh === '' || b.prix_dh == null ? '' : Number(b.prix_dh));
  if ('variantes' in b) sh.getRange(r._row, h.indexOf('variantes') + 1).setValue(clean_(b.variantes, 500));
  if ('dispo' in b) sh.getRange(r._row, h.indexOf('dispo') + 1).setValue(b.dispo ? 'oui' : 'non');
  if ('nom' in b && clean_(b.nom)) sh.getRange(r._row, h.indexOf('nom') + 1).setValue(clean_(b.nom, 120));
  return { ok: true };
}

/* ---------------- setup (mra wa7da) ---------------- */
function setup() {
  Object.keys(SHEETS).forEach(sh_);
  const sh = sh_('Produits');
  if (sh.getLastRow() > 1) { console.log('Produits deja kaynin — ma tbeddel walou.'); return; }
  const data = JSON.parse(UrlFetchApp.fetch(SITE_URL + '/data/products.json').getContentText());
  const rows = data.map((p, i) => [p.id, p.name, p.cat, p.v ? '' : (p.p == null ? '' : p.p),
    p.v ? p.v.map(v => v.l + ':' + v.p).join(' | ') : '', p.u || '', 'oui', '', i + 1]);
  sh.getRange(2, 1, rows.length, SHEETS.Produits.length).setValues(rows);
  sh.autoResizeColumns(1, SHEETS.Produits.length);
  const st = SpreadsheetApp.newDataValidation().requireValueInList(STATUTS, true).build();
  sh_('Commandes').getRange('K2:K').setDataValidation(st);
  sh.getRange('G2:G').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['oui', 'non'], true).build());
  console.log(rows.length + ' produits tzado ✓');
}
