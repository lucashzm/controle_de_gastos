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
    if(/^\d{4}-\d{2}-\d{2}$/.test(start))return {year:start.slice(0,4),month:Number(start.slice(5,7))};
    const now=new Date();
    return {year:String(now.getFullYear()),month:now.getMonth()+1};
  }

  function findOption(select,wanted,textWanted){
    if(!select)return null;
    const options=[...select.options];
    return options.find(o=>String(o.value)===String(wanted))
      || options.find(o=>norm(o.textContent)===norm(textWanted||''))
      || options.find(o=>norm(o.textContent).startsWith(norm(textWanted||'')+' '))
      || options.find(o=>norm(o.textContent).includes(norm(textWanted||'')));
  }

  function syncInvoice(){
    const p=period(),s=invoiceSelects();
    if(!s)return false;
    const monthName=monthNames[p.month-1];
    const mo=findOption(s.month,String(p.month),monthName);
    const yr=findOption(s.year,p.year,p.year);
    let changed=false;

    if(mo && s.month.value!==mo.value){
      s.month.value=mo.value;
      changed=true;
    }
    if(yr && s.year.value!==yr.value){
      s.year.value=yr.value;
      changed=true;
    }

    // O componente da fatura usa o evento change para redesenhar o valor.
    // Disparamos somente uma vez, depois de ajustar os dois selects.
    if(changed){
      s.month.dispatchEvent(new Event('change',{bubbles:true}));
      s.year.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return changed;
  }

  function reinforce(){
    let n=0;
    const timer=setInterval(()=>{
      syncInvoice();
      n++;
      if(n>=20)clearInterval(timer);
    },100);
  }

  // O filtro superior é a fonte da verdade: a fatura exibida deve representar
  // o mesmo mês/ano do período selecionado.
  document.getElementById('filterApply')?.addEventListener('click',()=>setTimeout(reinforce,50));
  document.getElementById('filterStart')?.addEventListener('change',reinforce);

  const observer=new MutationObserver(()=>{
    if(invoiceSelects()){
      syncInvoice();
      reinforce();
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});

  // Primeira tentativa e novas tentativas após a montagem da interface.
  syncInvoice();
  reinforce();
})();
