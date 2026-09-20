(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let realNow=null;

  function browserSaoPauloNow(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date());
    const get=t=>parts.find(p=>p.type===t)?.value;
    return {year:Number(get('year')),month:Number(get('month')),day:Number(get('day'))};
  }

  async function loadRealDate(){
    try{
      const r=await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo',{cache:'no-store'});
      if(r.ok){
        const d=await r.json();
        if(d.datetime){
          const x=new Date(d.datetime);
          if(!Number.isNaN(x.getTime())) realNow={year:x.getFullYear(),month:x.getMonth()+1,day:x.getDate()};
        }
      }
    }catch(e){}
    if(!realNow) realNow=browserSaoPauloNow();
    lockCurrentInvoice();
  }

  function getCurrentPeriod(){
    const d=realNow||browserSaoPauloNow();
    return {year:String(d.year),month:Number(d.month)};
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

  function lockCurrentInvoice(trigger=true){
    const s=getInvoiceSelects();
    if(!s)return false;
    const p=getCurrentPeriod();
    const mo=findOption(s.month,String(p.month),monthNames[p.month-1]);
    const yr=findOption(s.year,String(p.year),String(p.year));
    if(!mo||!yr)return false;

    const changed=s.month.value!==mo.value || s.year.value!==yr.value;
    put(s.month,mo);
    put(s.year,yr);

    if(changed&&trigger){
      // O painel original pode reagir ao change e restaurar o mês padrão.
      // Disparamos a atualização uma vez e reafirmamos a seleção depois que ele terminar.
      s.month.dispatchEvent(new Event('change',{bubbles:true}));
      s.year.dispatchEvent(new Event('change',{bubbles:true}));
      [0,50,150,300,600,1000,1800].forEach(ms=>setTimeout(()=>{
        const again=getInvoiceSelects();
        if(!again)return;
        put(again.month,mo);put(again.year,yr);
      },ms));
    }
    return true;
  }

  // A aplicação recria/atualiza a fatura quando o painel é renderizado.
  // Envolvemos a função original para que o mês atual seja aplicado depois dela.
  function hookRenderInvoice(){
    if(typeof window.renderInvoice!=='function')return false;
    if(window.__invoiceSyncHooked)return true;
    const original=window.renderInvoice;
    window.renderInvoice=function(...args){
      const result=original.apply(this,args);
      lockCurrentInvoice(true);
      setTimeout(()=>lockCurrentInvoice(false),50);
      setTimeout(()=>lockCurrentInvoice(false),300);
      setTimeout(()=>lockCurrentInvoice(false),1000);
      return result;
    };
    window.__invoiceSyncHooked=true;
    return true;
  }

  function bootstrapLock(){
    hookRenderInvoice();
    let count=0;
    const timer=setInterval(()=>{
      hookRenderInvoice();
      lockCurrentInvoice(true);
      if(++count>=24)clearInterval(timer);
    },250);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#filterApply')) bootstrapLock();
  },true);

  // Se o usuário alterar o período do painel, a fatura continua representando
  // o mês civil atual; ela não deve seguir o filtro de lançamentos.
  document.addEventListener('change',e=>{
    if(e.target.closest('#filterStart,#filterEnd')) bootstrapLock();
  },true);

  const observer=new MutationObserver(()=>{
    hookRenderInvoice();
    lockCurrentInvoice(false);
  });
  const startObserver=()=>{if(document.body)observer.observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver);else startObserver();

  loadRealDate();
  bootstrapLock();
})();