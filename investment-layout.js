(()=>{
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const style=`<style id="investmentLayoutStyle">
.cards{grid-template-columns:repeat(4,minmax(0,1fr))!important}
.investmentCard{min-width:0;display:flex;flex-direction:column;justify-content:center}
.investmentCard .label{font-size:10px}
.investmentCard .money{font-size:21px;color:#5b2b82!important}
.investmentCard .investmentSub{margin-top:4px;font-size:9px;color:#758096}
@media(max-width:1180px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:650px){.cards{grid-template-columns:1fr!important}}
</style>`;
if(!$("investmentLayoutStyle"))document.head.insertAdjacentHTML("beforeend",style);
function ensure(){
 const cards=document.querySelector('.cards');
 if(!cards)return null;
 const count=$("count")?.closest('.card');
 if(count)count.remove();
 let card=document.querySelector('.investmentCard');
 if(!card){
  card=document.createElement('div');
  card.className='card investmentCard';
  card.innerHTML='<div class="label">Investimentos</div><div class="money" id="investido">R$ 0,00</div><div class="investmentSub">Aplicações no período</div>';
  cards.appendChild(card);
 }
 if(card.parentElement!==cards)cards.appendChild(card);
 return card;
}
function refresh(){
 ensure();
 const rows=window.rows;
 if(!Array.isArray(rows))return false;
 const a=$("filterStart")?.value||'',b=$("filterEnd")?.value||'';
 let source=rows;
 if(window.periodRows)source=window.periodRows(a,b);
 else source=rows.filter(r=>(!a||String(r.data)>=a)&&(!b||String(r.data)<=b));
 const total=source.filter(r=>r.tipo==='investimento').reduce((s,r)=>s+Number(r.valor||0),0);
 if($("investido"))$("investido").textContent=money(total);
 return true;
}
function watchData(){
 refresh();
 let tries=0;
 const timer=setInterval(()=>{
  tries++;
  const done=refresh();
  if(done&&Array.isArray(window.rows)&&window.rows.length>0){clearInterval(timer);}
  if(tries>=40)clearInterval(timer);
 },250);
 const body=$("listBody");
 if(body){
  new MutationObserver(()=>refresh()).observe(body,{childList:true,subtree:true});
 }
}
ensure();
watchData();
$("filterApply")?.addEventListener('click',()=>setTimeout(refresh,0));
})();
