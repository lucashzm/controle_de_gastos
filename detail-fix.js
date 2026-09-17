(()=>{
function bindLaunchClicks(){
 const body=document.getElementById('listBody');
 if(!body||body.dataset.detailBound==='1')return;
 body.dataset.detailBound='1';
 body.addEventListener('click',e=>{
  if(e.target.closest('button'))return;
  const row=e.target.closest('tr.launchRow');
  if(!row)return;
  const attr=row.getAttribute('onclick')||'';
  const m=attr.match(/showLaunch\((\d+)\)/);
  if(m&&typeof window.showLaunch==='function'){
   e.preventDefault();
   window.showLaunch(Number(m[1]));
  }
 });
}
const start=()=>{bindLaunchClicks();if(!document.getElementById('listBody'))setTimeout(start,100)};
start();
})();
