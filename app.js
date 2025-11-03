
const state={items:[],cart:[]}; const $=s=>document.querySelector(s);
const menuEl=$('#menu'),cartbar=$('#cartbar'),cartCount=$('#cart-count'),cartTotal=$('#cart-total');
const drawer=$('#drawer'),btnCart=$('#btnCart'),btnCloseDrawer=$('#btnCloseDrawer'),cartList=$('#cartList'),subtotalEl=$('#subtotal'),grandTotalEl=$('#grandTotal'),btnClear=$('#btnClear'),btnPlace=$('#btnPlace'),orderNotes=$('#orderNotes');

async function init(){
  const res=await fetch('../../data/menu.json').catch(()=>fetch('../data/menu.json').catch(()=>fetch('data/menu.json')));
  const data=await res.json(); let list=data.items;
  const cat=window.DEFAULT_CATEGORY||'';
  if(cat){ document.title='峥峥的食堂 · '+cat; const t=document.getElementById('title'); if(t) t.textContent=cat; list=list.filter(i=>i.category===cat); }
  state.items=list; renderMenu(); renderCartbar();
}

function heartLabel(h){ if(h==='INF') return '∞❤️'; const v=Number(h)||0; if(Math.abs(v%1)===0.5) return (v<0?'-':'')+'0.5❤️'; return v+'❤️'; }

function renderMenu(){
  menuEl.innerHTML='';
  state.items.forEach(it=>{
    const card=document.createElement('article'); card.className='item-card';
    card.innerHTML=`<div class="meta"><div class="name">${it.name}</div><div class="desc small muted">${it.desc||''}</div><div class="price">${heartLabel(it.hearts)}</div></div><div class="thumb" style="background-image:${it.img?`url(${it.img})`:'none'}"></div>`;
    const btn=document.createElement('button'); btn.className='btn-primary'; btn.textContent='加入';
    btn.onclick=()=>addToCart(it);
    card.appendChild(btn); menuEl.appendChild(card);
  });
}

function addToCart(it){ state.cart.push({id:it.id,name:it.name,hearts:it.hearts,qty:1}); renderCartbar(true); }

function cartTotals(){ let count=0,total=0,inf=false; state.cart.forEach(it=>{ count+=it.qty; if(it.hearts==='INF'){inf=true}else{ total+=(Number(it.hearts)||0)*it.qty; } }); return {count,total,inf}; }

function renderCartbar(show=false){
  const {count,total,inf}=cartTotals();
  cartCount.textContent=count;
  cartTotal.textContent=inf?'∞❤️':(total.toFixed(1).replace('.0','')+'❤️');
  cartbar.hidden=count===0;
  if(show) openDrawer();
}

function openDrawer(){ drawer.classList.add('show'); renderCartList(); }
function closeDrawer(){ drawer.classList.remove('show'); }

function renderCartList(){
  cartList.innerHTML='';
  state.cart.forEach((it,idx)=>{
    const row=document.createElement('div'); row.className='cart-row';
    row.innerHTML=`<div>${it.name}</div><div>${it.hearts==='INF'?'∞❤️':((Number(it.hearts)||0)*it.qty).toFixed(1).replace('.0','')+'❤️'}</div><div>×${it.qty}</div>`;
    const del=document.createElement('button'); del.className='btn-plain'; del.textContent='删除';
    del.onclick=()=>{ state.cart.splice(idx,1); renderCartList(); renderCartbar(); };
    row.appendChild(del); cartList.appendChild(row);
  });
  const {total,inf}=cartTotals();
  subtotalEl.textContent=inf?'∞❤️':(total.toFixed(1).replace('.0','')+'❤️');
  grandTotalEl.textContent=subtotalEl.textContent;
}

function buildOrderText(){
  const lines=['【峥峥的食堂】下单','———'];
  state.cart.forEach((it,i)=>lines.push(`${i+1}. ${it.name} ×${it.qty}`));
  const {total,inf}=cartTotals();
  lines.push('———'); lines.push('合计：'+(inf?'∞❤️':(total.toFixed(1).replace('.0','')+'❤️')));
  if(orderNotes && orderNotes.value.trim()) lines.push('备注：'+orderNotes.value.trim());
  return lines.join('\\n');
}
async function tryClipboard(text){ try{ await navigator.clipboard.writeText(text); return true; }catch(e){ return false; } }
function maybeSupportsSMS(){ const ua=navigator.userAgent.toLowerCase(); const isMobile=/iphone|ipad|ipod|android/i.test(ua); const isWeChat=ua.includes('micromessenger'); return isMobile && !isWeChat; }
btnClear.onclick=()=>{ if(confirm('清空购物车？')){ state.cart=[]; renderCartList(); renderCartbar(); } };
btnPlace.onclick=async()=>{ if(state.cart.length===0) return; const text=buildOrderText(); if(maybeSupportsSMS()){ location.href=`sms:?&body=${encodeURIComponent(text)}`; } else { const ok=await tryClipboard(text); alert(ok?'已复制下单模板，去微信/短信粘贴发送即可':'复制失败，请长按选择后自行复制'); } };

// 遮罩点击 + ESC 关闭
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });
document.addEventListener('click', e=>{ if(e.target && e.target.id==='drawerBackdrop') closeDrawer(); });

document.addEventListener('DOMContentLoaded', init);
