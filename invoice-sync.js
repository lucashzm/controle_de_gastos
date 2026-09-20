(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function nowSP(){
    const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    const get=t=>Number(p.find(x=>x.type===t)?.value);
    return {year:get('year'),month:get('month')};
  }

  function getSelects(){
    const root=document.querySelector('.invoice');
    if(!root)return null;
    const list=[...root.querySelectorAll('select')];
    return list.length>=2?{month:list[0],year:list[1]}:null;
  }

  function find(select,wanted,text){
    const v=String(wanted), t=norm(text||wanted);
    return [...select.options].find(o=>String(o.value)===v)
      || [...select.options].find(o=>norm(o.textContent)===t)
      || [...select.options].find(o=>norm(o.textContent).startsWith(t));
  }

  let applying=false;
  function forceCurrentMonth(){
    if(applying)return;
    const s=getSelects();
    if(!s)return;
    const now=nowSP();
    const mo=find(s.month,now.month,monthNames[now.month-1]);
    const yr=find(s.year,now.year,String(now.year));
    if(!mo||!yr)return;
    const monthChanged=s.month.value!==mo.value;
    const yearChanged=s.year.value!==yr.value;
    if(!monthChanged&&!yearChanged)return;
    applying=true;
    try{
      s.month.value=mo.value;
      s.year.value=yr.value;
      if(monthChanged)s.month.dispatchEvent(new Event('change',{bubbles:true}));
      if(yearChanged)s.year.dispatchEvent(new Event('change',{bubbles:true}));
    }finally{ applying=false; }
  }

  function start(){
    forceCurrentMonth();
    let ticks=0;
    const timer=setInterval(()=>{
      forceCurrentMonth();
      if(++ticks>=100)clearInterval(timer);
    },100);
  }

  const observer=new MutationObserver(()=>forceCurrentMonth());
  function observe(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    start();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();
