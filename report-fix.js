(()=>{
const $=window.$||((id)=>document.getElementById(id));
const brl=window.brl||((v)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}));
const esc=window.esc||((s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

// Relatório: somente 3 meses (anterior, atual e próximo).
// Usa os mesmos dados de lançamentos usados pelo painel e é redesenhado
// sempre que render() é chamado, inclusive depois de uma edição.
window.renderCharts=function(){
  const now=new Date();
  const months=[];
  for(let i=-1;i<=1;i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    months.push({
      k:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      n:d.toLocaleDateString('pt-BR',{month:'short'}),
      e:0,s:0
    });
  }

  const source=window.periodRows?window.periodRows('',''):(window.rows||[]);
  source.forEach(r=>{
    const m=months.find(x=>x.k===String(r.data).slice(0,7));
    if(!m)return;
    if(r.tipo==='entrada')m.e+=Number(r.valor||0);
    else if(r.tipo==='saida')m.s+=Number(r.valor||0);
    // Investimento não é entrada nem saída para este gráfico.
  });

  const max=Math.max(1,...months.flatMap(m=>[m.e,m.s]));
  if($('bars'))$('bars').innerHTML=months.map(m=>
    `<div class="grp"><i class="bar" style="height:${Math.max(2,m.e/max*100)}%"></i><i class="bar s" style="height:${Math.max(2,m.s/max*100)}%"></i></div>`
  ).join('');
  if($('barlabels'))$('barlabels').innerHTML=months.map(m=>`<span>${m.n}</span>`).join('');

  // Gastos por categoria respeitando o período aplicado no painel.
  const a=$('filterStart')?.value||'',b=$('filterEnd')?.value||{},by={};
  const period=window.periodRows?window.periodRows(a,b):((window.rows||[]).filter(r=>(!a||r.data>=a)&&(!b||r.data<=b)));
  period.filter(r=>r.tipo==='saida').forEach(r=>{
    by[r.categoria_id||0]=(by[r.categoria_id||0]||0)+Number(r.valor||0);
  });
  const list=Object.entries(by).sort((x,y)=>y[1]-x[1]).slice(0,5);
  const sum=list.reduce((s,x)=>s+x[1],0);
  let deg=0;
  if($('catTotal'))$('catTotal').textContent=brl(sum);
  const stops=list.map((x,i)=>{
    const d=sum?x[1]/sum*360:0;
    const z=`hsl(${245+i*38} 70% 58%) ${deg}deg ${deg+d}deg`;
    deg+=d;
    return z;
  }).join(',');
  if($('donut'))$('donut').style.background=list.length?`conic-gradient(${stops})`:'#e9edf3';
  if($('catLegend'))$('catLegend').innerHTML=list.map((x,i)=>
    `<div class="catLegendRow"><i class="catDot" style="background:hsl(${245+i*38} 70% 58%)"></i><span>${esc(window.catName?window.catName(x[0]):x[0])}</span><b>${brl(x[1])}</b></div>`
  ).join('')||'<span class="muted">Nenhuma saída no período.</span>';
};

// Caso o painel já tenha terminado de carregar antes deste arquivo,
// redesenha imediatamente com a nova regra.
setTimeout(()=>{try{window.renderCharts()}catch(e){console.error(e)}},0);
})();
