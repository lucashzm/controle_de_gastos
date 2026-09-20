(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let realNow=null;

  // Usa a data real de São Paulo quando disponível; se a consulta externa falhar,
  // usa o relógio do navegador com o fuso de São Paulo.
  async function loadRealDate(){
    try{
      const r=await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo',{cache:'no-store'});
      if(r.ok){
        const d=await r.json();
        if(d.datetime) realNow=new Date(d.datetime);
      }
    }catch(e){}
    if(!realNow) realNow=new Date(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()));
    forceCurrentInvoice();
  }

  function getPeriod(){
    const start=document.getElementById('filterStart')?.value||'';
    const end=document.getElementById('filterEnd')?.value||'';
    if(/^\d{4}-\d{2}-\d{2}$/.test(start)) return {year:start.slice(0,4),month:Number(start.slice(5,7))};
    if(/^\d{4}-\d{2}-\d{2}$/.test(end)) return {year:end.slice(0,4),month:Number(end.slice(5,7))};
    const d=realNow||new Date();
    return {year:String(d.getFullYear()),month:d.getMonth()+1};
  }

  function getInvoiceSelects(){
    const root=document.querySelector('.invoice');
    if(!root)return null;
    const selects=[...root.querySelectorAll('select')];
    return selects.length>=2?{month:selects[0],year:selects[1]}:null;
  }

  function findOption(select,wanted,text){
    const wantedNorm=norm(text);
    return [...select.options].find(o=>String(o.value)===String(wanted))
      || [...select.options].find(o=>norm(o.textContent)===wantedNorm)
      || [...select.options].find(o=>norm(o.textContent).includes(wantedNorm));
  }

  function put(select,option){
    if(!select||!option)return false;
    select.value=option.value;
    select.selectedIndex=option.index;
    return select.value===option.value;
  }

  function forceCurrentInvoice(trigger=true){
    const s=getInvoiceSelects();
    if(!s)return false;
    const p=getPeriod();
    const mo=findOption(s.month,String(p.month),monthNames[p.month-1]);
    const yr=findOption(s.year,String(p.year),String(p.year));
    if(!mo||!yr)return false;
    const changed=s.month.value!==mo.value || s.year.value!==yr.value;
    put(s.month,mo); put(s.year,yr);
    if(changed&&trigger){
      s.month.dispatchEvent(new Event('change',{bubbles:true}));
      s.year.dispatchEvent(new Event('change',{bubbles:true}));
      requestAnimationFrame(()=>{put(s.month,mo);put(s.year,yr);});
      setTimeout(()=>{put(s.month,mo);put(s.year,yr);},100);
      setTimeout(()=>{put(s.month,mo);put(s.year,yr);},500);
      setTimeout(()=>{put(s.month,mo);put(s.year,yr);},1200);
    }
    return true;
  }

  // Durante a montagem da tela, a aplicação pode recriar a fatura e voltar para
  // o mês padrão antigo. Mantemos o seletor alinhado por alguns segundos.
  function bootstrapLock(){
    let count=0;
    const timer=setInterval(()=>{
      forceCurrentInvoice(true);
      if(++count>=30)clearInterval(timer);
    },250);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#filterApply')) bootstrapLock();
  },true);

  document.addEventListener('change',e=>{
    if(e.target.closest('#filterStart,#filterEnd')) bootstrapLock();
  },true);

  const observer=new MutationObserver(()=>forceCurrentInvoice(false));
  const startObserver=()=>{if(document.body)observer.observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver);else startObserver();

  loadRealDate();
  bootstrapLock();
})();