/* ====== CONFIG — beddel hna ====== */
const CONFIG = {
  shop: "Glow Dental",
  whatsapp: "",   // numéro li katwsel 3lih les commandes, ex: "212612345678" (bla + w bla espaces)
  apiUrl: "",     // lien Apps Script (…/exec). Khawi = l-site khddam b data/products.json w bla Google Sheet
  address: "72 Rue Bni Drar, Tabriquet, Salé",
  site: "https://glow-dental-maroc-93ik.vercel.app"
};
/* ================================= */

const CATS=[
 {id:'hyg',n:'Usage unique & hygiène',e:'🧤'},
 {id:'fra',n:'Fraises & abrasifs',e:'💎'},
 {id:'emp',n:'Empreinte',e:'🦷'},
 {id:'endo',n:'Endodontie',e:'🪡'},
 {id:'fond',n:'Fonds de cavité',e:'🧪'},
 {id:'obt',n:'Obturation & ciments',e:'✨'},
 {id:'pro',n:'Prophylaxie & blanchiment',e:'😁'},
 {id:'equ',n:'Équipements',e:'⚙️'},
 {id:'ort',n:'Orthodontie',e:'🔗'},
 {id:'ins',n:'Instrumentation',e:'🔧'}
];
let P=[], byId={};

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Number(n).toLocaleString('fr-FR').replace(/ | /g,' ')+' DH';
const catName=id=>(CATS.find(c=>c.id===id)||{}).n||'';
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const imgOf=p=>p.photo||('img/'+p.id+'.webp');
const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

function setProducts(list){
  P=list.filter(p=>p&&p.id&&p.name);
  P.forEach(p=>{if(p.dispo===undefined)p.dispo=true;p._s=norm(p.name+' '+catName(p.cat));p._min=p.v?Math.min(...p.v.map(v=>v.p)):p.p});
  byId=Object.fromEntries(P.map(p=>[p.id,p]));
  cart=cart.filter(i=>byId[i.id]&&(!byId[i.id].v||byId[i.id].v[i.vi]));
}

let state={cat:'all',q:'',sort:''};
let cart=ls.get('gd_cart',[]);
let client=Object.assign({nom:'',cabinet:'',ville:'',tel:'',adresse:'',note:''},ls.get('gd_client',{}));
let orders=ls.get('gd_orders',[]);
const save=()=>{ls.set('gd_cart',cart);ls.set('gd_client',client);ls.set('gd_orders',orders)};

const unitPrice=i=>{const p=byId[i.id];return p.v?p.v[i.vi].p:p.p};
const cartCount=()=>cart.reduce((a,i)=>a+i.qty,0);
const cartTotal=()=>cart.reduce((a,i)=>a+(unitPrice(i)||0)*i.qty,0);
const hasAsk=()=>cart.some(i=>unitPrice(i)==null);
const qtyOf=id=>cart.filter(i=>i.id===id).reduce((a,i)=>a+i.qty,0);

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),1700)}

/* ---------- Chips ---------- */
function renderChips(){
  const counts={};P.forEach(p=>counts[p.cat]=(counts[p.cat]||0)+1);
  const all=[{id:'all',n:'Tout',e:'🗂️'},...CATS];
  $('#chips').innerHTML=all.map(c=>`<button class="chip ${state.cat===c.id?'on':''}" data-cat="${c.id}"><i>${c.e}</i>${c.n}<em>${c.id==='all'?P.length:counts[c.id]||0}</em></button>`).join('');
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;state.cat=b.dataset.cat;renderChips();renderList();
  b.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  const top=$('.cats').offsetTop;if(window.scrollY>top)window.scrollTo({top:top,behavior:'smooth'})});

/* ---------- List ---------- */
function priceHTML(p){
  if(p.v) return `<div class="price"><small>dès</small>${fmt(p._min)}</div>`;
  if(p.p==null) return `<div class="price ask">Sur demande</div>`;
  return `<div class="price">${p.u?`<small>${esc(p.u)}</small>`:''}${fmt(p.p)}</div>`;
}
function cardHTML(p){
  const q=qtyOf(p.id);
  const ctrl=!p.dispo?`<button class="add" disabled aria-label="Indisponible"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`
    :(q&&!p.v)?`<div class="mini" data-stop><button data-dec="${p.id}" aria-label="Moins">−</button><b>${q}</b><button data-inc="${p.id}" aria-label="Plus">+</button></div>`
    :`<button class="add" data-add="${p.id}" aria-label="Ajouter ${esc(p.name)}"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>`;
  const tag=!p.dispo?`<span class="tag out">Rupture</span>`:p.v?`<span class="tag">${p.v.length} choix</span>`:'';
  return `<article class="card ${p.dispo?'':'off'}" data-open="${p.id}">${tag}${q&&p.v?`<span class="tag" style="left:auto;right:8px;background:var(--sky);color:var(--blue)">×${q}</span>`:''}
   <div class="ph"><img loading="lazy" decoding="async" alt="${esc(p.name)}" src="${esc(imgOf(p))}"></div>
   <div class="bd"><div class="nm">${esc(p.name)}</div><div class="ft">${priceHTML(p)}${ctrl}</div></div></article>`;
}
function filtered(){
  let r=P;
  if(state.cat!=='all') r=r.filter(p=>p.cat===state.cat);
  if(state.q){const ws=norm(state.q).split(/\s+/).filter(Boolean);r=r.filter(p=>ws.every(w=>p._s.includes(w)))}
  if(state.sort){r=[...r];const big=1e9;
    if(state.sort==='asc')r.sort((a,b)=>(a._min??big)-(b._min??big));
    if(state.sort==='desc')r.sort((a,b)=>(b._min??-1)-(a._min??-1));
    if(state.sort==='az')r.sort((a,b)=>a.name.localeCompare(b.name,'fr'));}
  return r;
}
function renderList(){
  const r=filtered();
  $('#resInfo').textContent=`${r.length} produit${r.length>1?'s':''}`;
  let html='';
  if(!r.length){html=`<div class="empty"><b>Aucun produit trouvé</b>Essayez un autre mot ou une autre catégorie.<br><br><a class="share" href="${waUrl('Bonjour, je cherche le produit : '+state.q)}" target="_blank" rel="noopener">Demander sur WhatsApp</a></div>`}
  else if(state.cat==='all'&&!state.q&&!state.sort){
    CATS.forEach(c=>{const it=r.filter(p=>p.cat===c.id);if(!it.length)return;
      html+=`<section class="sec"><h2>${c.e} ${c.n} <span>${it.length}</span></h2><div class="grid">${it.map(cardHTML).join('')}</div></section>`});
  } else html=`<section class="sec"><div class="grid" style="margin-top:12px">${r.map(cardHTML).join('')}</div></section>`;
  $('#list').innerHTML=html;
  $('#stCount').textContent=`${P.length} produits`;
}
function refreshCards(){renderList();updateCartUI()}
$('#list').addEventListener('click',e=>{
  const a=e.target.closest('[data-add]'),inc=e.target.closest('[data-inc]'),dec=e.target.closest('[data-dec]');
  if(a){const p=byId[a.dataset.add]; if(p.v) return openProduct(p.id); addToCart(p.id,null,1); return}
  if(inc){changeQty(inc.dataset.inc,null,1);return}
  if(dec){changeQty(dec.dataset.dec,null,-1);return}
  if(e.target.closest('[data-stop]'))return;
  const c=e.target.closest('[data-open]'); if(c) openProduct(c.dataset.open);
});

/* ---------- Search & sort ---------- */
let qt;$('#q').addEventListener('input',e=>{clearTimeout(qt);qt=setTimeout(()=>{state.q=e.target.value.trim();$('#clr').hidden=!state.q;renderList()},120)});
$('#clr').addEventListener('click',e=>{e.preventDefault();$('#q').value='';state.q='';$('#clr').hidden=true;renderList()});
$('#sort').addEventListener('change',e=>{state.sort=e.target.value;renderList()});

/* ---------- Cart ops ---------- */
const keyOf=(id,vi)=>id+'|'+(vi??'');
function addToCart(id,vi,qty){
  if(!byId[id].dispo){toast('Produit en rupture');return}
  const k=keyOf(id,vi);const f=cart.find(i=>i.key===k);
  if(f)f.qty+=qty;else cart.push({key:k,id,vi,qty});
  save();refreshCards();toast('Ajouté au panier ✓');
  try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
}
function changeQty(id,vi,d,key){
  const k=key||keyOf(id,vi);const f=cart.find(i=>i.key===k);if(!f)return;
  f.qty+=d;if(f.qty<=0)cart=cart.filter(i=>i!==f);
  save();refreshCards();if(sheetOpen==='c')renderCart();
}
function updateCartUI(){
  const n=cartCount();
  $('#badge').hidden=!n;$('#badge').textContent=n;
  $('#fabQ').textContent=n;$('#fabT').textContent=fmt(cartTotal())+(hasAsk()?' +':'');
  $('#fab').classList.toggle('show',n>0&&!sheetOpen);
}

/* ---------- Sheets ---------- */
let sheetOpen=null;
const SHEET={p:'#pSheet',c:'#cSheet',o:'#oSheet'};
function openSheet(w){closeSheets(true);sheetOpen=w;$('#scrim').classList.add('on');$(SHEET[w]).classList.add('on');document.body.style.overflow='hidden';updateCartUI()}
function closeSheets(silent){
  if(sheetOpen==='p'&&location.hash.startsWith('#p-')&&!silent)history.replaceState(null,'',location.pathname);
  sheetOpen=null;$('#scrim').classList.remove('on');Object.values(SHEET).forEach(s=>$(s).classList.remove('on'));document.body.style.overflow='';updateCartUI()}
$('#scrim').addEventListener('click',()=>closeSheets());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheets()));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheets()});
document.querySelectorAll('.sheet').forEach(s=>{let y0=null;
  s.addEventListener('touchstart',e=>{const b=s.querySelector('.sh-b');if(e.target.closest('.sh-b')&&b.scrollTop>0){y0=null;return}y0=e.touches[0].clientY},{passive:true});
  s.addEventListener('touchend',e=>{if(y0!=null&&e.changedTouches[0].clientY-y0>90)closeSheets();y0=null},{passive:true});});

/* Product sheet */
let cur={id:null,vi:null,qty:1};
function openProduct(id){
  const p=byId[id];if(!p)return;cur={id,vi:p.v?0:null,qty:1};renderProduct();openSheet('p');
  history.replaceState(null,'','#p-'+id);
}
function renderProduct(){
  const p=byId[cur.id];
  const pr=p.v?p.v[cur.vi].p:p.p;
  const link=CONFIG.site+'/#p-'+p.id;
  $('#pBody').innerHTML=`<div class="pimg"><img alt="${esc(p.name)}" src="${esc(imgOf(p))}"></div>
   <div class="pcat">${catName(p.cat)}</div><div class="pname">${esc(p.name)}</div>
   <div class="pprice">${pr==null?'Prix sur demande':fmt(pr)} ${p.u&&pr!=null?`<small>/ ${esc(p.u.replace('la ',''))}</small>`:''}</div>
   ${!p.dispo?`<p class="note" style="color:#B42318;font-weight:700">Ce produit est momentanément en rupture de stock.</p>`:''}
   ${p.v?`<div class="lbl">Choisir une option</div><div class="vars">${p.v.map((v,i)=>`<button class="var ${i===cur.vi?'on':''}" data-vi="${i}">${esc(v.l)}<span>${fmt(v.p)}</span></button>`).join('')}</div>`:''}
   ${pr==null?`<p class="note">Le prix de ce produit est communiqué sur demande. Ajoutez-le au panier : nous vous répondrons avec le tarif sur WhatsApp.</p>`:''}
   <a class="share" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.name+' — '+(pr==null?'prix sur demande':fmt(pr))+'\n'+link)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>Partager ce produit</a>`;
  $('#pQty').textContent=cur.qty;
  $('#pAdd').disabled=!p.dispo;$('#pAdd').style.opacity=p.dispo?'':'.45';
  $('#pAdd').textContent=!p.dispo?'Indisponible':pr==null?'Ajouter (prix sur demande)':`Ajouter · ${fmt(pr*cur.qty)}`;
}
$('#pBody').addEventListener('click',e=>{const b=e.target.closest('[data-vi]');if(!b)return;cur.vi=+b.dataset.vi;renderProduct()});
$('#pMinus').addEventListener('click',()=>{if(cur.qty>1){cur.qty--;renderProduct()}});
$('#pPlus').addEventListener('click',()=>{cur.qty++;renderProduct()});
$('#pAdd').addEventListener('click',()=>{addToCart(cur.id,cur.vi,cur.qty);closeSheets()});

/* ---------- Order workflow: panier → coordonnées → confirmation → envoyée ---------- */
let step=1, lastOrder=null, sending=false;
$('#openCart').addEventListener('click',()=>{step=1;renderCart();openSheet('c')});
$('#fab').addEventListener('click',()=>{step=1;renderCart();openSheet('c')});

function waUrl(text){const t=encodeURIComponent(text);return CONFIG.whatsapp?`https://wa.me/${CONFIG.whatsapp}?text=${t}`:`https://wa.me/?text=${t}`}
function stepsHTML(){return `<div class="steps">${[1,2,3].map(i=>`<div class="${i<=step?'on':''}"></div>`).join('')}</div>`}
function orderText(ref){
  const lines=cart.map((i,n)=>{const p=byId[i.id];const u=unitPrice(i);
    return `${n+1}. ${p.name}${p.v?` — ${p.v[i.vi].l}`:''}\n   Qté : ${i.qty} × ${u==null?'prix sur demande':fmt(u)}${u!=null?` = ${fmt(u*i.qty)}`:''}`});
  return `🦷 *Commande ${ref} — ${CONFIG.shop}*\n\n`+
   `👤 ${client.nom}${client.cabinet?`\n🏥 ${client.cabinet}`:''}\n📍 ${client.ville}${client.adresse?` — ${client.adresse}`:''}\n📞 ${client.tel}\n\n`+
   `*Produits :*\n${lines.join('\n')}\n\n`+
   `*Total : ${fmt(cartTotal())}*${hasAsk()?' (+ produits à prix sur demande)':''}\n`+
   `Articles : ${cartCount()}`+(client.note?`\n\n📝 ${client.note}`:'');
}
function localRef(){const d=new Date();const p=n=>String(n).padStart(2,'0');return 'GD-'+String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+'-'+Math.random().toString(36).slice(2,5).toUpperCase()}
async function submitOrder(){
  const payload={action:'commande',client,note:client.note,items:cart.map(i=>{const p=byId[i.id];return{id:i.id,option:p.v?p.v[i.vi].l:'',qte:i.qty}})};
  if(CONFIG.apiUrl){
    try{
      const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),12000);
      const r=await fetch(CONFIG.apiUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:ctrl.signal}).then(x=>x.json());
      clearTimeout(t);
      if(r&&r.ok)return{ref:r.id,synced:true};
    }catch(e){}
  }
  return{ref:localRef(),synced:false};
}

function renderCart(){
  const body=$('#cBody'),foot=$('#cFoot');
  if(!cart.length&&step!==4){
    $('#cTitle').textContent='Mon panier';
    body.innerHTML=`<div class="empty"><div style="font-size:42px">🛒</div><b>Votre panier est vide</b>Parcourez le catalogue et ajoutez vos produits.</div>`;
    foot.innerHTML=`<button class="primary" data-x>Voir le catalogue</button>`;foot.querySelector('[data-x]').onclick=()=>closeSheets();return;
  }
  if(step===1){
    $('#cTitle').textContent=`Mon panier (${cartCount()})`;
    body.innerHTML=stepsHTML()+cart.map(i=>{const p=byId[i.id];const u=unitPrice(i);
      return `<div class="ci"><img alt="" src="${esc(imgOf(p))}"><div class="in"><b>${esc(p.name)}</b>${p.v?`<small>${esc(p.v[i.vi].l)}</small>`:''}<div class="pp">${u==null?'Sur demande':fmt(u*i.qty)}</div></div>
       <div class="mini"><button data-cdec="${i.key}">−</button><b>${i.qty}</b><button data-cinc="${i.key}">+</button></div></div>`}).join('')+
      `<div class="tot"><span>Total${hasAsk()?' (hors prix sur demande)':''}</span><b>${fmt(cartTotal())}</b></div>
       <button class="ghost" style="width:100%;margin-top:8px;color:#B42318" data-clear>Vider le panier</button>`;
    foot.innerHTML=`<button class="primary" data-next>Continuer · ${fmt(cartTotal())}</button>`;
    foot.querySelector('[data-next]').onclick=()=>{step=2;renderCart();body.scrollTop=0};
  }
  else if(step===2){
    $('#cTitle').textContent='Vos coordonnées';
    const f=(k,l,ph,t='text',req=true,extra='')=>`<div class="field" data-f="${k}"><label>${l}${req?' *':''}</label><input name="${k}" type="${t}" placeholder="${ph}" value="${esc(client[k]||'')}" ${extra}><div class="err">${k==='tel'?'Numéro invalide':'Champ obligatoire'}</div></div>`;
    body.innerHTML=stepsHTML()+`<div class="recap"><span>${cartCount()} article${cartCount()>1?'s':''}</span><b>${fmt(cartTotal())}</b></div>
      <form id="cf" novalidate>${f('nom','Nom complet','Dr. …','text',true,'autocomplete="name"')}${f('cabinet','Cabinet / Clinique','Nom du cabinet','text',false,'autocomplete="organization"')}${f('tel','Téléphone','06 …','tel',true,'inputmode="tel" autocomplete="tel"')}${f('ville','Ville','Salé, Rabat, Kénitra…','text',true,'autocomplete="address-level2"')}${f('adresse','Adresse de livraison','Quartier, rue, n°','text',false,'autocomplete="street-address"')}
      <div class="field"><label>Remarque</label><textarea name="note" placeholder="Horaire de livraison, référence, couleur…">${esc(client.note||'')}</textarea></div></form>`;
    foot.innerHTML=`<div class="row"><button class="ghost" style="flex:0 0 96px;height:52px" data-back>Retour</button><button class="primary" data-next>Vérifier la commande</button></div>`;
    foot.querySelector('[data-back]').onclick=()=>{step=1;renderCart()};
    const form=$('#cf');
    form.addEventListener('input',e=>{client[e.target.name]=e.target.value;save();const fl=e.target.closest('.field');fl&&fl.classList.remove('bad')});
    form.addEventListener('submit',e=>e.preventDefault());
    foot.querySelector('[data-next]').onclick=()=>{
      let ok=true;['nom','tel','ville'].forEach(k=>{const v=(client[k]||'').trim();const bad=!v||(k==='tel'&&v.replace(/\D/g,'').length<9);
        form.querySelector(`[data-f="${k}"]`).classList.toggle('bad',bad);if(bad)ok=false});
      if(!ok){toast('Complétez les champs obligatoires');return}
      step=3;renderCart();body.scrollTop=0};
  }
  else if(step===3){
    $('#cTitle').textContent='Confirmer la commande';
    body.innerHTML=stepsHTML()+`<div class="recap" style="display:block;line-height:1.6"><b style="color:var(--ink)">${esc(client.nom)}</b>${client.cabinet?` · ${esc(client.cabinet)}`:''}<br>${esc(client.ville)}${client.adresse?` — ${esc(client.adresse)}`:''} · ${esc(client.tel)}</div>`+
      cart.map(i=>{const p=byId[i.id];const u=unitPrice(i);return `<div class="ci" style="padding:9px 0"><div class="in"><b>${i.qty} × ${esc(p.name)}</b>${p.v?`<small>${esc(p.v[i.vi].l)}</small>`:''}</div><div class="pp" style="font-weight:800;color:var(--navy)">${u==null?'—':fmt(u*i.qty)}</div></div>`}).join('')+
      `<div class="tot"><span>Total</span><b>${fmt(cartTotal())}</b></div>
       <p class="note">Votre commande reçoit un numéro de suivi, puis s'ouvre dans WhatsApp prête à être envoyée. Il vous suffit d'appuyer sur Envoyer.</p>`;
    foot.innerHTML=`<div class="row"><button class="ghost" style="flex:0 0 96px;height:52px" data-back>Retour</button>
      <button class="primary wa" data-send>${WA_ICON}Valider et envoyer</button></div>`;
    foot.querySelector('[data-back]').onclick=()=>{step=2;renderCart()};
    foot.querySelector('[data-send]').onclick=async e=>{
      if(sending)return;sending=true;const b=e.currentTarget;b.innerHTML='<span class="spin"></span>Enregistrement…';
      const r=await submitOrder();
      const text=orderText(r.ref);
      lastOrder={ref:r.ref,synced:r.synced,text,total:cartTotal(),date:new Date().toISOString(),tel:client.tel,n:cartCount()};
      orders.unshift({id:r.ref,tel:client.tel,date:lastOrder.date,total:lastOrder.total,n:lastOrder.n,synced:r.synced,statut:'nouvelle',
        items:cart.map(i=>({id:i.id,vi:i.vi,qty:i.qty}))});
      orders=orders.slice(0,30);cart=[];save();refreshCards();sending=false;
      step=4;renderCart();
    };
  }
  else if(step===4&&lastOrder){
    $('#cTitle').textContent='Dernière étape';
    body.innerHTML=`<div class="done"><div class="ok"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16B88A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <h4>Commande enregistrée</h4><div class="ref">${lastOrder.ref}</div>
      <p>Appuyez sur <b>Envoyer sur WhatsApp</b> puis sur Envoyer dans WhatsApp pour nous transmettre votre commande.</p>
      <p style="font-size:12.5px;margin-top:10px">Suivez son statut à tout moment dans <b>Mes commandes</b>.</p></div>`;
    foot.innerHTML=`<a class="primary wa" href="${waUrl(lastOrder.text)}" target="_blank" rel="noopener">${WA_ICON}Envoyer sur WhatsApp</a>
      <button class="ghost" style="width:100%;margin-top:10px" data-copy>Copier le texte de la commande</button>`;
    foot.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(lastOrder.text);toast('Commande copiée ✓')}catch(e){toast('Copie impossible sur cet appareil')}};
  }
}
$('#cBody').addEventListener('click',e=>{
  const i=e.target.closest('[data-cinc]'),d=e.target.closest('[data-cdec]');
  if(i)changeQty(null,null,1,i.dataset.cinc);
  if(d)changeQty(null,null,-1,d.dataset.cdec);
  if(e.target.closest('[data-clear]')){cart=[];save();refreshCards();renderCart()}
});
const WA_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';

/* ---------- Mes commandes (suivi + recommander) ---------- */
$('#openOrders').addEventListener('click',()=>{renderOrders();openSheet('o');refreshStatuses()});
function renderOrders(){
  const b=$('#oBody');
  if(!orders.length){b.innerHTML=`<div class="empty"><div style="font-size:40px">📋</div><b>Aucune commande</b>Vos commandes et leur statut apparaîtront ici.</div>`;return}
  b.innerHTML=orders.map((o,k)=>`<div class="ord"><div class="l1"><span>${esc(o.id)}</span><span class="st ${esc(o.statut)}">${esc(o.statut)}</span></div>
    <div class="l2"><span>${new Date(o.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})} · ${o.n} article${o.n>1?'s':''}</span><b style="color:var(--navy)">${fmt(o.total)}</b></div>
    ${o.items&&o.items.length?`<button class="ghost" style="width:100%;height:40px;margin-top:10px" data-reorder="${k}">↻ Commander à nouveau</button>`:''}</div>`).join('')+
    `<p class="note" style="text-align:center">Le statut est mis à jour par ${esc(CONFIG.shop)} après confirmation.</p>`;
}
$('#oBody').addEventListener('click',e=>{const b=e.target.closest('[data-reorder]');if(!b)return;
  const o=orders[+b.dataset.reorder];let n=0;
  o.items.forEach(i=>{if(byId[i.id]&&byId[i.id].dispo){const k=keyOf(i.id,i.vi);const f=cart.find(x=>x.key===k);if(f)f.qty+=i.qty;else cart.push({key:k,id:i.id,vi:i.vi,qty:i.qty});n++}});
  save();refreshCards();toast(n?'Produits ajoutés au panier ✓':'Produits indisponibles');if(n){step=1;renderCart();openSheet('c')}});
async function refreshStatuses(){
  if(!CONFIG.apiUrl||!orders.length)return;
  await Promise.all(orders.slice(0,10).filter(o=>o.synced).map(async o=>{try{
    const r=await fetch(`${CONFIG.apiUrl}?action=status&id=${encodeURIComponent(o.id)}&tel=${encodeURIComponent(o.tel)}`,{cache:'no-store'}).then(x=>x.json());
    if(r&&r.ok)o.statut=r.statut}catch(e){}}));
  save();if(sheetOpen==='o')renderOrders();
}

/* ---------- PWA ---------- */
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(!ls.get('gd_noinstall',false))$('#install').hidden=false});
$('#installBtn').addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;$('#install').hidden=true;ls.set('gd_noinstall',true)});
if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ---------- Init ---------- */
function openFromHash(){const m=location.hash.match(/^#p-(\w+)/);if(m&&byId[m[1]])openProduct(m[1])}
window.addEventListener('hashchange',openFromHash);
async function init(){
  $('#footWa').innerHTML=CONFIG.whatsapp?`WhatsApp : <a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">+${CONFIG.whatsapp}</a>`:'';
  let list=null;
  try{list=await fetch('data/products.json').then(r=>r.json())}catch(e){}
  if(list){setProducts(list);renderChips();renderList();updateCartUI();openFromHash()}
  if(CONFIG.apiUrl){
    try{const r=await fetch(CONFIG.apiUrl+'?action=produits',{cache:'no-store'}).then(x=>x.json());
      if(r&&r.ok&&r.produits&&r.produits.length){setProducts(r.produits);save();renderChips();renderList();updateCartUI();if(!list)openFromHash()}}catch(e){}
  }
  if(!P.length)$('#list').innerHTML='<div class="empty"><b>Connexion impossible</b>Vérifiez votre connexion internet puis réessayez.</div>';
}
init();
