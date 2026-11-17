import { state, saveState as save } from './state.js';
import { esc } from './utils.js';

export function logHistory(cat,entry){
  if(!state.history) state.history={skills:[],attacks:[],hp:[]};
  if(!state.history[cat]) state.history[cat]=[];
  entry.id=Date.now()+Math.random();
  entry.ts=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  state.history[cat].unshift(entry);
  if(state.history[cat].length>40) state.history[cat].pop();
  save();updateFab();
}
export function categoryFromTarget(target){
  if(!target) return 'attacks';
  if(target.startsWith('skill-')||target.startsWith('save-')) return 'skills';
  if(target.startsWith('spdmg-')||target.startsWith('spcrit-')){
    const spId=target.replace('spdmg-','').replace('spcrit-','');
    const sp=state.spells.find(s=>s.id===spId);
    if(sp&&sp.damageType==='cura')return 'hp';
    return 'attacks';
  }
  return 'attacks';
}
export function updateFab(){
  const fab=document.getElementById('historyFab');if(!fab)return;
  const h=state.history||{skills:[],attacks:[],hp:[]};
  const total=(h.skills?.length||0)+(h.attacks?.length||0)+(h.hp?.length||0);
  const badge=document.getElementById('fabBadge');
  if(badge){
    if(total>0){badge.style.display='flex';badge.textContent=total>99?'99+':String(total);}
    else badge.style.display='none';
  }
  const numpadOpen=document.getElementById('numpadOverlay').classList.contains('show');
  const modalOpen=document.getElementById('modalOverlay').classList.contains('show');
  fab.style.display=(numpadOpen||modalOpen)?'none':'flex';
}
export function renderHistEntries(cat){
  const entries=(state.history&&state.history[cat])||[];
  if(entries.length===0)return '<div class="hist-empty">Nenhum registro ainda</div>';
  return entries.map(e=>{
    if(cat==='hp'){
      const icon=e.type==='damage'?'💥':'💚';
      const targetIcon=e.target==='wild'?'🐻':'👤';
      const sign=e.amount>0?'+':'';
      let body=`${e.before} → ${e.after} <b>(${sign}${e.amount})</b>`;
      if(e.overflowBefore!==undefined){
        body+=`<br><span style="opacity:0.7;font-size:11px">↳ overflow 👤 ${e.overflowBefore} → ${e.overflowAfter}</span>`;
      }
      return `<div class="hist-entry">
        <div class="hist-entry-header">
          <span class="hist-time">${e.ts}</span>
          <span class="hist-label">${icon} ${e.type==='damage'?'Dano':'Cura'} ${targetIcon}${e.label?' — '+esc(e.label):''}</span>
        </div>
        <div class="hist-entry-body">${body}</div>
      </div>`;
    } else {
      const isCritEntry = e.isCritDamage || (e.label||'').startsWith('⭐');
      const crit=e.crit?'⭐':'';
      const fail=e.fail?'❌':'';
      return `<div class="hist-entry${isCritEntry?' crit':''}">
        <div class="hist-entry-header">
          <span class="hist-time">${e.ts}</span>
          <span class="hist-label">${esc(e.label)}</span>
        </div>
        <div class="hist-entry-body">${e.die||'d20'}: ${e.roll}${crit}${fail} ${e.mod>=0?'+':''}${e.mod} = <b>${e.total}</b></div>
      </div>`;
    }
  }).join('');
}

