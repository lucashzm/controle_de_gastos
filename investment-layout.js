(()=>{
const $=id=>document.getElementById(id);
const style=`<style id="investmentLayoutStyle">
.cards{grid-template-columns:repeat(5,minmax(0,1fr))!important}
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
 if(!cards)return;
 let card=document.querySelector('.investmentCard');
 if(!card){
  card=document.createElement('div');
  card.className='card investmentCard';
  card.innerHTML='<div class="label">Investimentos</div><div class="money" id="investido">R$ 0,00</div><div class="investmentSub">Aplicações no período</div>';
  const count=$("count")?.closest('.card');
  if(count)cards.insertBefore(card,count); else cards.appendChild(card);
 }else if(card.parentElement!==cards){cards.appendChild(card)}
 const label=card.querySelector('.label');if(label)label.textContent='Investimentos';
 if(!card.querySelector('.investmentSub'))card.insertAdjacentHTML('beforeend','<div class="investmentSub">Aplicações no período</div>');
}
function refresh(){
 ensure();
 const a=$("filterStart")?.value||'',b=$("filterEnd")?.value||'';
 const rows=window.periodRows?window.periodRows(a,b):(window.rows||[]);
 const total=rows.filter(r=>r.tipo==='investimento').reduce((s,r)=>s+Number(r.valor||0),0);
 if($("investido"))$("investido").textContent=Number(total||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
ensure();
refresh();
$("filterApply")?.addEventListener('click',refresh);
setTimeout(refresh,100);
setTimeout(refresh,500);
})();
