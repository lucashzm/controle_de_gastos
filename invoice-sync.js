(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function invoiceSelects(){
    const root=document.querySelector('.invoice');
    if(!root)return null;
    const selects=[...root.querySelectorAll('select')];
    if(selects.length<2)return null;
    return {month:selects[0],year:selects[1]};
  }

  function period(){
    const start=document.getElementById('filterStart')?.value||'';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return null;
    return {year:start.slice(0,4),month:Number(start.slice(5,7))};
  }

  function choose(select, wanted, textWanted){
    if(!select)return false;
    const options=[...select.options];
    let opt=options.find(o=>String(o.value)===String(wanted));
    if(!opt && textWanted)opt=options.find(o=>norm(o.textContent)===norm(textWanted) || norm(o.textContent).startsWith(norm(textWanted)+' '));
    if(!opt && textWanted)opt=options.find(o=>norm(o.textContent).includes(norm(textWanted)));
    if(!opt)return false;
    if(select.value!==opt.value){
      select.value=opt.value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return true;
  }

  function syncInvoice(){
    const p=period(),s=invoiceSelects();
    if(!p||!s)return false;
    const monthName=monthNames[p.month-1];
    const changedMonth=choose(s.month,String(p.month),monthName);
    const changedYear=choose(s.year,p.year,p.year);
    return changedMonth||changedYear;
  }

  function reinforce(){
    let n=0;
    const timer=setInterval(()=>{
      n++;
      syncInvoice();
      if(n>=10)clearInterval(timer);
    },120);
  }

  function hook(){
    if(typeof window.renderInvoice==='function' && !window.renderInvoice.__invoiceSync){
      const original=window.renderInvoice;
      const wrapped=function(...args){
        const result=original.apply(this,args);
        setTimeout(reinforce,0);
        return result;
      };
      wrapped.__invoiceSync=true;
      window.renderInvoice=wrapped;
    }
    syncInvoice();
  }

  const apply=document.getElementById('filterApply');
  apply?.addEventListener('click',()=>setTimeout(reinforce,80));
  document.getElementById('filterStart')?.addEventListener('change',reinforce);
  hook();
  const observer=new MutationObserver(()=>hook());
  observer.observe(document.body,{childList:true,subtree:true});
  reinforce();
})();
