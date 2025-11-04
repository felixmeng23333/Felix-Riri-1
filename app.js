
const state={items:[],cart:[],catImages:{}}; const $=s=>document.querySelector(s);

async function init(){
  const menu = await (await fetch('data/menu.json')).json();
  const imgs = await (await fetch('data/cat_images.json')).json();
  state.items = menu.items||[]; state.catImages = imgs||{};
  renderAllSections(); bindCart(); registerSW();
}

function groupByCat(items){ const map={}; items.forEach(it=>{ (map[it.category] ||= []).push(it); }); return map; }
function heartLabel(h){ if(h==='INF') return '∞❤️'; const v=Number(h)||0; if(Math.abs(v%1)===0.5) return (v<0?'-':'')+'0.5❤️'; return v+'❤️'; }

function renderAllSections(){
  const container = $('#container'); container.innerHTML='';
  const groups = groupByCat(state.items);
  Object.keys(groups).forEach(cat=>{
    const sec = document.createElement('section'); sec.className='section';
    const hero = state.catImages[cat] ? `<div class="hero" style="background-image:url(${state.catImages[cat]})"></div>` : '';
    sec.innerHTML = `<div class="section-head"><div class="pill">${cat}</div></div>${hero}<div class="menu"></div>`;
    const grid = sec.querySelector('.menu');
    groups[cat].forEach(it=>{
      const card=document.createElement('article'); card.className='item-card';
      card.innerHTML=`<div class="meta"><div class="name">${it.name}</div><div class="small">${it.desc||''}</div><div class="price">${heartLabel(it.hearts)}</div></div><div class="thumb" style="background-image:${it.img?`url(${it.img})`:'none'}"></div>`;
      const btn=document.createElement('button'); btn.className='btn-primary'; btn.textContent='加入'; btn.onclick=()=>addToCart(it);
      card.appendChild(btn); grid.appendChild(card);
    });
    container.appendChild(sec);
  });
}

/* ---- 购物车 & 抽屉 ---- */
function bindCart(){
  const btnCart=$('#btnCart'),drawer=$('#drawer'),x=$('#btnCloseDrawer'),backdrop=$('#drawerBackdrop');
  const cartCount=$('#cart-count'),cartTotal=$('#cart-total'),cartbar=$('#cartbar');
  const cartList=$('#cartList'),subtotalEl=$('#subtotal'),grandTotalEl=$('#grandTotal'),notes=$('#orderNotes');
  const btnClear=$('#btnClear'),btnPlace=$('#btnPlace');
  const modal=$('#orderModal'),modalBackdrop=$('#orderModalBackdrop'),closeModal=$('#closeOrderModal');
  const btnSms=$('#btnSms'),btnWeChat=$('#btnWeChat'),btnEmail=$('#btnEmail');

  function cartTotals(){ let c=0,t=0,inf=false; state.cart.forEach(it=>{ c+=it.qty; if(it.hearts==='INF'){inf=true}else{ t+=(Number(it.hearts)||0)*it.qty; } }); return {c,t,inf}; }
  function refreshBar(show=false){ const {c,t,inf}=cartTotals(); cartCount.textContent=c; cartTotal.textContent=inf?'∞❤️':(t.toFixed(1).replace('.0','')+'❤️'); cartbar.hidden=c===0; if(show){ drawer.classList.add('show'); renderList(); } }
  function renderList(){ cartList.innerHTML=''; state.cart.forEach((it,idx)=>{ const row=document.createElement('div'); row.className='cart-row'; row.innerHTML=`<div>${it.name}</div><div>${it.hearts==='INF'?'∞❤️':((Number(it.hearts)||0)*it.qty).toFixed(1).replace('.0','')+'❤️'}</div><div>×${it.qty}</div>`; const del=document.createElement('button'); del.className='btn-plain'; del.textContent='删除'; del.onclick=()=>{ state.cart.splice(idx,1); renderList(); refreshBar(); }; row.appendChild(del); cartList.appendChild(row); }); const {t,inf}=cartTotals(); subtotalEl.textContent=inf?'∞❤️':(t.toFixed(1).replace('.0','')+'❤️'); grandTotalEl.textContent=subtotalEl.textContent; }
  function close(){ drawer.classList.remove('show'); }
  window.__zz_closeDrawer = close;

  btnCart.onclick=()=>{ drawer.classList.add('show'); renderList(); };
  x.onclick=close; backdrop.onclick=close; document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
  btnClear.onclick=()=>{ if(confirm('清空购物车？')){ state.cart=[]; renderList(); refreshBar(); } };

  // 点击“去下单” -> 弹出选择方式弹窗
  btnPlace.onclick=()=>{ if(state.cart.length===0) return; modal.classList.add('show'); };
  function hideModal(){ modal.classList.remove('show'); }
  modalBackdrop.onclick=hideModal; closeModal.onclick=hideModal; document.addEventListener('keydown',e=>{ if(e.key==='Escape') hideModal(); });

  // 三种下单方式
  btnSms.onclick=()=>{ placeOrder('sms', notes && notes.value); hideModal(); };
  btnWeChat.onclick=()=>{ placeOrder('wechat', notes && notes.value); hideModal(); };
  btnEmail.onclick=()=>{ placeOrder('email', notes && notes.value); hideModal(); };

  // 对外 addToCart
  window.addToCart = function(it){ state.cart.push({id:it.id,name:it.name,hearts:it.hearts,qty:1}); refreshBar(true); }
  window.addToCart = window.addToCart.bind(window);
}

function addToCart(it){ window.addToCart(it); }
function buildOrderText(note){
  const lines=['【峥峥的食堂】下单','———']; state.cart.forEach((it,i)=>lines.push(`${i+1}. ${it.name} ×${it.qty}`));
  let c=0,t=0,inf=false; state.cart.forEach(it=>{ c+=it.qty; if(it.hearts==='INF'){inf=true}else{ t+=(Number(it.hearts)||0)*it.qty; } });
  lines.push('———'); lines.push('合计：'+(inf?'∞❤️':(t.toFixed(1).replace('.0','')+'❤️')));
  if(note && note.trim()) lines.push('备注：'+note.trim()); return lines.join('\\n');
}
async function tryClipboard(text){ try{ await navigator.clipboard.writeText(text); return true; }catch(e){ return false; } }
function maybeSupportsSMS(){ const ua=navigator.userAgent.toLowerCase(); const isMobile=/iphone|ipad|ipod|android/i.test(ua); const isWeChat=ua.includes('micromessenger'); return isMobile && !isWeChat; }

function placeOrder(mode, noteText){
  const body = buildOrderText(noteText);
  if(mode==='sms'){
    // 固定到你指定的号码（美国区 iOS/Android 通用写法）
    location.href=`sms:+16263656245?&body=${encodeURIComponent(body)}`;
  } else if(mode==='wechat'){
    tryClipboard(body).then(ok=>{
      alert(ok?'已复制下单模板，去微信粘贴发送即可':'复制失败，请长按选择后自行复制');
    });
  } else if(mode==='email'){
    const subject = encodeURIComponent('峥峥的食堂下单');
    // 默认给指定邮箱
    location.href = `mailto:felixmeng23333@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  }
}

/* ---- PWA 基础 ---- */
async function registerSW(){ try{ if('serviceWorker' in navigator){ await navigator.serviceWorker.register('sw.js'); } }catch(e){} }

document.addEventListener('DOMContentLoaded', init);
