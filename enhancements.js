(()=>{
const $=window.$||((id)=>document.getElementById(id));
const brl=window.brl||((v)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}));
const esc=window.esc||((s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const baseStyle=`<style>
.launchRow{cursor:pointer;transition:background .15s}.launchRow:hover{background:#faf9ff}
.detailModalInfo{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:15px}.detailItem{padding:11px 12px;background:#f8f9fc;border:1px solid #eef1f5;border-radius:10px}.detailItem.full{grid-column:span 2}.detailItem label{display:block;font-size:9px;font-weight:800;color:#758096;text-transform:uppercase;margin-bottom:4px}.detailItem b{font-size:12px}.detailObs{white-space:pre-wrap;line-height:1.5;font-size:12px;color:#536077}.detailParts{margin-top:14px;border-top:1px solid #eef1f5;padding-top:12px}.detailPartsTitle{font-size:11px;font-weight:800;margin-bottom:7px}.detailPartRow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eef1f5;font-size:10px}.detailHint{margin-top:10px;font-size:10px;color:#758096}.pill.i{background:#f0efff;color:#5b2b82}.investmentHint{font-size:10px;color:#758096;margin-top:6px}
.investmentCard .money{color:#5b2b82}.investmentCard{border-color:#e6def0}
@media(max-width:1180px){.investmentCard{grid-column:auto}}
@media(max-width:650px){.detailModalInfo{grid-template-columns:1fr}.detailItem.full{grid-column:auto}}
</style>`;
document.head.insertAdjacentHTML('beforeend',baseStyle);
if(!$('detailModal'))document.body.insertAdjacentHTML('beforeend',`<div id="detailModal" class="modal"><div class="modalbox"><div class="modalhead"><div><h3 id="detailTitle">Detalhes do lançamento</h3><p class="muted">Confira todas as informações registradas.</p></div><button class="close" id="detailClose">×</button></div><div id="detailContent"></div><div class="modalactions"><button type="button" class="secondary" id="detailEdit">✏️ Editar lançamento</button><button type="button" class="secondary" id="detailClose2">Fechar</button></div></div></div>`);
function periodRows(a,b){
 const ok=d=>(!a||d>=a)&&(!b||d<=b);
 const rows=window.rows||[], parts=window.parts||[];
 const parentIds=new Set(parts.map(p=>+p.lancamento_id));
 const direct=rows.filter(r=>ok(r.data)&&!(r.tipo==='saida'&&r.forma_pagamento==='Cartão de crédito'&&parentIds.has(+r.id)));
 const parcelRows=parts.filter(p=>ok(p.fatura_competencia)).map(p=>{const l=rows.find(r=>+r.id===+p.lancamento_id);return l?{...l,id:'parcela-'+p.id,data:p.fatura_competencia,valor:p.valor,parcela_numero:p.numero,total_parcelas:p.total_parcelas}:null}).filter(Boolean);
 return direct.concat(parcelRows);
}
window.periodRows=periodRows;
window.renderCharts=function(){
 const now=new Date(),months=[];
 for(let i=-1;i<=4;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);months.push({k:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),n:d.toLocaleDateString('pt-BR',{month:'short'}),e:0,s:0})}
 periodRows('','').forEach(r=>{const m=months.find(x=>x.k===String(r.data).slice(0,7));if(m)r.tipo==='entrada'?m.e+=+r.valor:r.tipo==='saida'&&(m.s+=+r.valor)});
 const max=Math.max(1,...months.flatMap(m=>[m.e,m.s]));
 if($('bars'))$('bars').innerHTML=months.map(m=>`<div class="grp"><i class="bar" style="height:${Math.max(2,m.e/max*100)}%"></i><i class="bar s" style="height:${Math.max(2,m.s/max*100)}%"></i></div>`).join('');
 if($('barlabels'))$('barlabels').innerHTML=months.map(m=>`<span>${m.n}</span>`).join('');
 const a=$('filterStart')?.value||'',b=$('filterEnd')?.value||'',by={};
 periodRows(a,b).filter(r=>r.tipo==='saida').forEach(r=>by[r.categoria_id||0]=(by[r.categoria_id||0]||0)+ +r.valor);
 const list=Object.entries(by).sort((x,y)=>y[1]-x[1]).slice(0,5),sum=list.reduce((s,x)=>s+x[1],0);let deg=0;
 if($('catTotal'))$('catTotal').textContent=brl(sum);
 const stops=list.map((x,i)=>{const d=sum?x[1]/sum*360:0,s=`hsl(${245+i*38} 70% 58%) ${deg}deg ${deg+d}deg`;deg+=d;return s}).join(',');
 if($('donut'))$('donut').style.background=list.length?`conic-gradient(${stops})`:'#e9edf3';
 if($('catLegend'))$('catLegend').innerHTML=list.map((x,i)=>`<div class="catLegendRow"><i class="catDot" style="background:hsl(${245+i*38} 70% 58%)"></i><span>${esc(window.catName?window.catName(x[0]):x[0])}</span><b>${brl(x[1])}</b></div>`).join('')||'<span class="muted">Nenhuma saída no período.</span>';
};
function ensureInvestmentCard(){
 const cards=document.querySelector('.cards');
 if(!cards)return;
 const lanc=$('count')?.closest('.card');
 // O contador de lançamentos não é útil no painel e ocupava espaço. Removemos o card.
 if(lanc)lanc.remove();
 if($('investido'))return;
 const card=document.createElement('div');
 card.className='card investmentCard';
 card.innerHTML='<div class="label">Investido</div><div class="money" id="investido">R$ 0,00</div>';
 cards.appendChild(card);
}
window.render=function(){
 ensureInvestmentCard();
 const a=$('filterStart')?.value||'',b=$('filterEnd')?.value||'',f=periodRows(a,b),e=f.filter(r=>r.tipo==='entrada').reduce((s,r)=>s+ +r.valor,0),s=f.filter(r=>r.tipo==='saida').reduce((s,r)=>s+ +r.valor,0),i=f.filter(r=>r.tipo==='investimento').reduce((s,r)=>s+ +r.valor,0);
 if($('entradas'))$('entradas').textContent=brl(e);if($('saidas'))$('saidas').textContent=brl(s);if($('saldo'))$('saldo').textContent=brl(e-s);if($('investido'))$('investido').textContent=brl(i);if($('count'))$('count').textContent=f.length;
 const d=window.getDisplayRows?window.getDisplayRows():f,p=d.slice(((window.listPage||1)-1)*10,(window.listPage||1)*10);
 if($('listBody'))$('listBody').innerHTML=p.map(r=>`<tr class="launchRow" onclick="showLaunch(${String(r.id).replace(/[^0-9]/g,'')})"><td>${String(r.data).split('-').reverse().join('/')}</td><td><span class="pill ${r.tipo==='entrada'?'e':r.tipo==='investimento'?'i':'s'}">${r.tipo==='entrada'?'Entrada':r.tipo==='investimento'?'Investimento':'Saída'}</span></td><td><b>${esc(r.descricao)}</b>${r.gasto_fixo_id||r.ganho_fixo_id?' <small class="muted">• fixo</small>':''}</td><td>${esc(window.catName?window.catName(r.categoria_id):'—')}</td><td>${esc(r.forma_pagamento||'—')}</td><td><b>${brl(r.valor)}</b></td><td><div class="rowActions"><button class="small secondary" onclick="event.stopPropagation();editLaunch(${String(r.id).replace(/[^0-9]/g,'')})">✏️ Editar</button><button class="small danger" onclick="event.stopPropagation();deleteLaunch(${String(r.id).replace(/[^0-9]/g,'')})">🗑️ Excluir</button></div></td></tr>`).join('')||'<tr><td colspan="7" class="muted" style="text-align:center;padding:30px">Nenhum lançamento cadastrado.</td></tr>';
 if(window.renderListPagination)window.renderListPagination(d.length);if(window.renderInvoice)window.renderInvoice();window.renderCharts();if(window.renderParts)window.renderParts();
};
window.showLaunch=function(id){const rows=window.rows||[],parts=window.parts||[],r=rows.find(x=>+x.id===+id);if(!r)return;const ps=parts.filter(p=>+p.lancamento_id===+r.id);$('detailTitle').textContent=r.descricao||'Detalhes do lançamento';const tipo=r.tipo==='entrada'?'Entrada':r.tipo==='investimento'?'Investimento (aplicação)':'Saída (gasto)',obs=r.observacao?esc(r.observacao):'<span class="muted">Nenhuma observação informada.</span>',parcel=ps.length?`${ps[0].total_parcelas}x`:'À vista';$('detailContent').innerHTML=`<div class="detailModalInfo"><div class="detailItem"><label>Tipo</label><b>${tipo}</b></div><div class="detailItem"><label>Valor</label><b>${brl(r.valor)}</b></div><div class="detailItem"><label>Data</label><b>${String(r.data).split('-').reverse().join('/')}</b></div><div class="detailItem"><label>Categoria</label><b>${esc(window.catName?window.catName(r.categoria_id):'—')}</b></div><div class="detailItem"><label>Forma de pagamento</label><b>${esc(r.forma_pagamento||'—')}</b></div><div class="detailItem"><label>Parcelamento</label><b>${parcel}</b></div><div class="detailItem full"><label>Observação</label><div class="detailObs">${obs}</div></div></div>${ps.length?`<div class="detailParts"><div class="detailPartsTitle">Parcelas do cartão</div>${ps.map(p=>`<div class="detailPartRow"><span>${p.numero}/${p.total_parcelas} · fatura ${p.fatura_competencia.slice(0,7)}</span><b>${brl(p.valor)}</b></div>`).join('')}</div>`:''}<div class="detailHint">Clique em Editar lançamento para alterar os dados registrados.</div>`;$('detailEdit').onclick=()=>{$('detailModal').classList.remove('on');editLaunch(r.id)};$('detailModal').classList.add('on')};
$('detailClose').onclick=$('detailClose2').onclick=()=>$('detailModal').classList.remove('on');
$('detailModal').addEventListener('click',e=>{if(e.target.id==='detailModal')$('detailModal').classList.remove('on')});
function setupInvestment(){const t=$('tipo'),c=$('categoria');if(!t)return;if(!Array.from(t.options).some(o=>o.value==='investimento')){const o=document.createElement('option');o.value='investimento';o.textContent='Investimento (aplicação)';t.appendChild(o)}const inv=t.value==='investimento';if(c){c.disabled=inv;if(inv)c.value=''}}
setupInvestment();$('tipo')?.addEventListener('change',setupInvestment);
const obs=$('observacao');if(obs?.parentElement&&!document.querySelector('.investmentHint')){const p=document.createElement('div');p.className='investmentHint';p.textContent='Investimento não entra nos gastos nem no gráfico de gastos por categoria.';obs.parentElement.after(p)}
const ef=$('editForm');if(ef){const formaField=$('editForma')?.parentElement;if(!$('editTipo')){const typeField=document.createElement('div');typeField.className='field';typeField.innerHTML='<label>Tipo</label><select id="editTipo"><option value="saida">Saída (gasto)</option><option value="entrada">Entrada</option><option value="investimento">Investimento (aplicação)</option></select>';if(formaField)formaField.before(typeField)}
 ef.onsubmit=async function(e){e.preventDefault();const rows=window.rows||[],r=rows.find(x=>+x.id===+window.editingId);if(!r)return;const tipo=$('editTipo').value,v={tipo,descricao:$('editDesc').value.trim(),valor:+$('editValor').value,data:$('editData').value,forma_pagamento:$('editForma').value,cartao_id:$('editForma').value==='Cartão de crédito'?1:null,categoria_id:tipo==='investimento'?null:($('editCategoria').value?+$('editCategoria').value:null),observacao:$('editObs').value.trim()||null};const {error}=await window.db.from('lancamentos').update(v).eq('id',r.id);if(error){$('editMsg').textContent=error.message;return}$('editModal').classList.remove('on');if(window.load)await window.load()};
 const oldOpen=window.editLaunch;window.editLaunch=function(id){oldOpen(id);const r=(window.rows||[]).find(x=>+x.id===+id);if(r&&$('editTipo')){$('editTipo').value=r.tipo||'saida';$('editCategoria').disabled=r.tipo==='investimento';if(r.tipo==='investimento')$('editCategoria').value=''}}}
$('filterApply')?.addEventListener('click',()=>{window.listPage=1;window.render()});
if($('tipo'))$('tipo').dispatchEvent(new Event('change'));
setTimeout(()=>{try{window.render();}catch(e){console.error(e)}},0);
})();