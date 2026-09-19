(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function getPeriod(){
    const start=document.getElementById('filterStart')?.value||'';
    if(/^\d{4}-\d{2}-\d{2}$/.test(start)){
      return {year:start.slice(0,4),month:Number(start.slice(5,7))};
    }
    const now=new Date();
    return {year:String(now.getFullYear()),month:now.getMonth()+1};
  }

  function getInvoiceSelects(){
    const root=document.querySelector('.invoice');
    if(!root)return null;
    const selects=[...root.querySelectorAll('select')];
    if(selects.length<2)return null;
    return {month:selects[0],year:selects[1]};
  }

  function findOption(select,wanted,text){
    if(!select)return null;
    const wantedNorm=norm(text);
    return [...select.options].find(o=>String(o.value)===String(wanted))
      || [...select.options].find(o=>norm(o.textContent)===wantedNorm)
      || [...select.options].find(o=>norm(o.textContent).includes(wantedNorm));
  }

  function setNativeValue(select,value){
    if(!select)return false;
    const proto=Object.getPrototypeOf(select);
    const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
    if(setter)setter.call(select,value);else select.value=value;
    return select.value===String(value);
  }

  function setInvoiceToPeriod(){
    const s=getInvoiceSelects();
    if(!s)return false;
    const p=getPeriod();
    const mo=findOption(s.month,String(p.month),monthNames[p.month-1]);
    const yr=findOption(s.year,String(p.year),String(p.year));
    if(!mo || !yr)return false;

    const changedMonth=s.month.value!==mo.value;
    const changedYear=s.year.value!==yr.value;
    setNativeValue(s.month,mo.value);
    setNativeValue(s.year,yr.value);

    // A fatura existente pode usar onchange diretamente; disparamos ambos os formatos.
    if(changedMonth || changedYear){
      s.month.dispatchEvent(new Event('input',{bubbles:true}));
      s.year.dispatchEvent(new Event('input',{bubbles:true}));
      s.month.dispatchEvent(new Event('change',{bubbles:true}));
      s.year.dispatchEvent(new Event('change',{bubbles:true}));
      if(typeof s.month.onchange==='function')s.month.onchange();
      if(typeof s.year.onchange==='function')s.year.onchange();
    }
    return s.month.value===mo.value && s.year.value===yr.value;
  }

  function syncSoon(){
    [0,80,250,600,1200,2200].forEach(ms=>setTimeout(setInvoiceToPeriod,ms));
  }

  // O render original da fatura pode reconstruir os selects. Depois de cada render,
  // reaplicamos o mês/ano do período para que Outubro não volte automaticamente.
  const originalRenderInvoice=window.renderInvoice;
  if(typeof originalRenderInvoice==='function' && !originalRenderInvoice.__periodSyncWrapped){
    const wrapped=function(){
      const result=originalRenderInvoice.apply(this,arguments);
      syncSoon();
      return result;
    };
    wrapped.__periodSyncWrapped=true;
    window.renderInvoice=wrapped;
  }

  document.getElementById('filterApply')?.addEventListener('click',syncSoon);
  document.getElementById('filterStart')?.addEventListener('change',syncSoon);
  document.getElementById('filterEnd')?.addEventListener('change',syncSoon);

  let observerTimer=0;
  const observer=new MutationObserver(()=>{
    if(!getInvoiceSelects())return;
    clearTimeout(observerTimer);
    observerTimer=setTimeout(()=>setInvoiceToPeriod(),30);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  syncSoon();
})();
