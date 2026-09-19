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

  function setInvoiceToPeriod(){
    const s=getInvoiceSelects();
    if(!s)return false;
    const p=getPeriod();
    const mo=findOption(s.month,String(p.month),monthNames[p.month-1]);
    const yr=findOption(s.year,String(p.year),String(p.year));
    if(!mo || !yr)return false;

    const monthChanged=s.month.value!==mo.value;
    const yearChanged=s.year.value!==yr.value;
    if(!monthChanged && !yearChanged)return true;

    // Primeiro ajustamos os dois campos e só depois avisamos o componente da fatura.
    s.month.value=mo.value;
    s.year.value=yr.value;
    s.month.dispatchEvent(new Event('change',{bubbles:true}));
    s.year.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  let checking=false;
  function sync(){
    if(checking)return;
    checking=true;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const ok=setInvoiceToPeriod();
      const s=getInvoiceSelects();
      const p=getPeriod();
      const mo=s&&findOption(s.month,String(p.month),monthNames[p.month-1]);
      const yr=s&&findOption(s.year,String(p.year),String(p.year));
      const correct=!!(s&&mo&&yr&&s.month.value===mo.value&&s.year.value===yr.value);
      if(ok&&correct){
        // Uma última mudança força o render da fatura a acompanhar o mês selecionado.
        if(tries===1){
          s.month.dispatchEvent(new Event('change',{bubbles:true}));
          s.year.dispatchEvent(new Event('change',{bubbles:true}));
        }
        if(tries>=5){clearInterval(timer);checking=false;}
      }else if(tries>=30){
        clearInterval(timer);checking=false;
      }
    },100);
  }

  // O período superior é a fonte da verdade. A fatura sempre acompanha o mês/ano
  // do início do período; se o período estiver vazio, usa o mês/ano atuais.
  document.getElementById('filterApply')?.addEventListener('click',()=>setTimeout(sync,20));
  document.getElementById('filterStart')?.addEventListener('change',()=>setTimeout(sync,20));
  document.getElementById('filterEnd')?.addEventListener('change',()=>setTimeout(sync,20));

  const observer=new MutationObserver(()=>{
    if(getInvoiceSelects())sync();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  sync();
})();
