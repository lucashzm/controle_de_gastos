(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function getPeriod(){
    const start=document.getElementById('filterStart')?.value||'';
    const end=document.getElementById('filterEnd')?.value||'';
    if(/^\d{4}-\d{2}-\d{2}$/.test(start)){
      return {year:start.slice(0,4),month:Number(start.slice(5,7))};
    }
    if(/^\d{4}-\d{2}-\d{2}$/.test(end)){
      return {year:end.slice(0,4),month:Number(end.slice(5,7))};
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
    [0,100,300,700,1500,3000,5000].forEach(ms=>setTimeout(setInvoiceToPeriod,ms));
  }

  function wrapRender(){
    const original=window.renderInvoice;
    if(typeof original!=='function' || original.__periodSyncWrapped)return false;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      syncSoon();
      return result;
    };
    wrapped.__periodSyncWrapped=true;
    window.renderInvoice=wrapped;
    return true;
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#filterApply'))syncSoon();
  },true);
  document.addEventListener('change',e=>{
    if(e.target.closest('#filterStart,#filterEnd'))syncSoon();
  },true);

  let observerTimer=0;
  const observer=new MutationObserver(()=>{
    clearTimeout(observerTimer);
    observerTimer=setTimeout(()=>{
      wrapRender();
      setInvoiceToPeriod();
    },50);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  wrapRender();
  syncSoon();
  // A base original pode terminar de carregar depois deste script e recriar a fatura.
  // Durante a inicialização mantemos o seletor alinhado ao período escolhido.
  let tries=0;
  const bootstrap=setInterval(()=>{
    wrapRender();
    setInvoiceToPeriod();
    if(++tries>=20)clearInterval(bootstrap);
  },500);
})();
