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
function getPeriodData(){
 const rows=window.rows;
 if(!Array.isArray(rows))return null;
 const a=$("filterStart")?.value||'',b=$("filterEnd")?.value||'';
 if(typeof window.periodRows==='function')return window.periodRows(a,b);
 return rows.filter(r=>(!a||String(r.data)>=a)&&(!b||String(r.data)<=b));
}
function syncOverview(){
 const source=getPeriodData();
 if(!source)return false;
 ensure();
 const entradas=source.filter(r=>r.tipo==='entrada').reduce((s,r)=>s+Number(r.valor||0),0);
 const saidas=source.filter(r=>r.tipo==='saida').reduce((s,r)=>s+Number(r.valor||0),0);
 const investimentos=source.filter(r=>r.tipo==='investimento').reduce((s,r)=>s+Number(r.valor||0),0);
 if($("entradas"))$("entradas").textContent=money(entradas);
 if($("saidas"))$("saidas").textContent=money(saidas);
 if($("saldo"))$("saldo").textContent=money(entradas-saidas);
 if($("investido"))$("investido").textContent=money(investimentos);
 if(typeof window.renderCharts==='function')window.renderCharts();
 return true;
}
function watchData(){
 syncOverview();
 let tries=0;
 const timer=setInterval(()=>{
  tries++;
  const done=syncOverview();
  if(done&&Array.isArray(window.rows)&&window.rows.length>0&&tries>=12)clearInterval(timer);
  if(tries>=80)clearInterval(timer);
 },250);
 const body=$("listBody");
 if(body){
  let scheduled=false;
  new MutationObserver(()=>{
   if(scheduled)return;
   scheduled=true;
   setTimeout(()=>{scheduled=false;syncOverview()},30);
  }).observe(body,{childList:true,subtree:true});
 }
}
ensure();
watchData();
$("filterApply")?.addEventListener('click',()=>setTimeout(syncOverview,50));
})();
