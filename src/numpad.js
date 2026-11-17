import { diceInfo } from './calc.js';
import { fmtMod, esc } from './utils.js';
import { logHistory, categoryFromTarget, updateFab } from './history.js';
import { showToast, showCritToast } from './toast.js';

export let calcValues = {};
export let calcTimers = {};
export let numpadState = {target:null,mod:0,isD20:false,min:1,max:20,dieStr:'d20',label:'',value:'',onConfirm:null,mode:'dice',chips:null,isCritDamage:false};

const numpadHooks = { classLevel: null, updateSlotTotal: null };
export function setNumpadHooks(hooks) { Object.assign(numpadHooks, hooks); }

export function formatDieLabel(dieStr){
  if(dieStr==='d20')return'd20';
  const info=diceInfo(dieStr);
  return info.types.map(t=>`${t.count}d${t.sides}`).join('+');
}
export function getChips(min,max){
  if(min===1&&max===20)return[5,10,15,20];
  if(min===max)return[min];
  return[min,Math.round(min+(max-min)*0.33),Math.round(min+(max-min)*0.67),max];
}

export function openNumpadDirect(opts){
  numpadState={
    target:opts.target||null,
    mod:opts.mod||0,
    isD20:opts.isD20||false,
    min:opts.min||1,
    max:opts.max||20,
    dieStr:opts.dieStr||'',
    label:opts.label||'Rolagem',
    value:opts.value!==undefined?String(opts.value):(calcValues[opts.target]||''),
    onConfirm:opts.onConfirm||null,
    mode:opts.mode||'dice',
    chips:opts.chips||null,
    isCritDamage:opts.isCritDamage||false
  };
  const numpadEl=document.getElementById('numpadEl');
  numpadEl.classList.toggle('edit-mode', numpadState.mode==='number');
  numpadEl.classList.toggle('crit-damage', numpadState.isCritDamage);
  document.getElementById('numpadLabel').textContent=numpadState.label;
  const dieEl=document.getElementById('numpadDie');
  if(numpadState.mode==='number'||!numpadState.dieStr){
    dieEl.style.display='none';dieEl.textContent='';
  }else{
    dieEl.style.display='';dieEl.textContent=formatDieLabel(numpadState.dieStr);
  }
  const bonusEl=document.getElementById('numpadBonus');
  const sepEl=document.getElementById('numpadHintSep');
  if(numpadState.mode==='number'){
    bonusEl.style.display='none';sepEl.style.display='none';
    document.getElementById('numpadRange').textContent='Permitido: '+numpadState.min+'–'+numpadState.max;
  }else{
    bonusEl.style.display='';
    bonusEl.textContent='bônus '+(numpadState.mod>=0?'+':'')+numpadState.mod;
    sepEl.style.display='';
    document.getElementById('numpadRange').textContent=numpadState.min+'–'+numpadState.max;
  }
  const chips=numpadState.chips||getChips(numpadState.min,numpadState.max);
  document.getElementById('numpadChips').innerHTML=chips.map(c=>{
    const isCrit=numpadState.isD20&&c===20;
    const critChip=numpadState.isCritDamage&&c===numpadState.max;
    return `<button class="np-chip${(isCrit||critChip)?' np-crit':''}" onclick="npChip('${c}')">${c}${(isCrit||critChip)?'⭐':''}</button>`;
  }).join('');
  updateNumpadDisplay();
  document.getElementById('numpadOverlay').classList.add('show');
  updateFab();
}
export function openNumpad(targetId){
  const btn=document.querySelector(`[data-calc-target="${targetId}"]`);
  if(!btn)return;
  openNumpadDirect({
    target:targetId,
    mod:parseInt(btn.dataset.calcMod)||0,
    isD20:btn.dataset.calcD20==='1',
    min:parseInt(btn.dataset.calcMin)||1,
    max:parseInt(btn.dataset.calcMax)||20,
    dieStr:btn.dataset.calcDie||'d20',
    label:btn.dataset.calcLabel||'Rolagem',
    value:calcValues[targetId]||'',
    mode:'dice',
    isCritDamage: btn.dataset.calcCrit==='1'
  });
}
export function openNumberEditor(el){
  const min=parseInt(el.dataset.min)||0;
  const max=parseInt(el.dataset.max)||999;
  const label=el.dataset.label||'Valor';
  const value=el.dataset.value||el.textContent.trim();
  const chips=el.dataset.chips?el.dataset.chips.split(',').map(x=>parseInt(x)):null;
  openNumpadDirect({
    mode:'number',target:null,mod:0,isD20:false,min,max,dieStr:'',label,value,chips,
    onConfirm:(n)=>{
      el.dataset.value=String(n);
      el.textContent=String(n);
      el.classList.add('just-confirmed');
      setTimeout(()=>el.classList.remove('just-confirmed'),500);
      if(el.dataset.callback==='classLevel' && numpadHooks.classLevel){
        numpadHooks.classLevel(parseInt(el.dataset.index), n);
      } else if(el.dataset.callback==='updateSlotTotal' && numpadHooks.updateSlotTotal){
        numpadHooks.updateSlotTotal(el.dataset.index);
      }
    }
  });
}
export function closeNumpad(){
  numpadState.target=null;numpadState.onConfirm=null;
  document.getElementById('numpadOverlay').classList.remove('show');
  updateFab();
}
export function npDigit(d){
  const maxLen=String(numpadState.max).length;
  if(numpadState.value.length>=maxLen)return;
  if(numpadState.value===''&&d==='0')return;
  const candidate=numpadState.value+d;
  const n=parseInt(candidate);
  if(n>numpadState.max&&candidate.length>=maxLen)return;
  numpadState.value=candidate;
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(8);
}
export function npDel(){
  numpadState.value=numpadState.value.slice(0,-1);
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(8);
}
export function npChip(v){
  numpadState.value=String(v);
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(12);
}
export function npConfirm(){
  if(!numpadState.target&&!numpadState.onConfirm)return;
  const v=numpadState.value;
  if(!v){showToast('Digite um valor');return;}
  const n=parseInt(v);
  if(isNaN(n)||n<numpadState.min||n>numpadState.max){
    showToast(`Valor deve estar entre ${numpadState.min} e ${numpadState.max}`);
    return;
  }
  const target=numpadState.target;
  const mod=numpadState.mod;
  const total=n+mod;
  const isD20=numpadState.isD20;
  const isCrit=isD20&&n===20;
  const isFail=isD20&&n===1;
  const label=numpadState.label;
  const onConfirmCb=numpadState.onConfirm;
  const dieStr=numpadState.dieStr;
  const isEditMode=numpadState.mode==='number';
  const isCritDamage=numpadState.isCritDamage;
  
  if(target&&document.querySelector(`[data-calc-target="${target}"]`)){
    calcValues[target]=v;
    updateInlineResult(target);
    const btn=document.querySelector(`[data-calc-target="${target}"]`);
    if(btn){btn.classList.add('just-confirmed');setTimeout(()=>btn.classList.remove('just-confirmed'),500);}
    if(calcTimers[target])clearTimeout(calcTimers[target]);
    const capturedV=v;
    calcTimers[target]=setTimeout(()=>{
      if(calcValues[target]===capturedV){
        delete calcValues[target];
        updateInlineResult(target);
      }
      delete calcTimers[target];
    },8000);
  }
  if(!onConfirmCb&&target&&!isEditMode){
    const cat=categoryFromTarget(target);
    const finalLabel = isCritDamage ? '⭐ CRÍTICO — '+label : label;
    logHistory(cat,{label:finalLabel,die:formatDieLabel(dieStr),roll:n,mod,total,isD20,crit:isCrit,fail:isFail,isCritDamage});
  }
  if(onConfirmCb){onConfirmCb(n,total);}
  
  document.getElementById('numpadOverlay').classList.remove('show');
  numpadState.target=null;numpadState.onConfirm=null;
  if(navigator.vibrate)navigator.vibrate(isCritDamage?[30,30,30]:20);
  updateFab();
  if(isEditMode)showToast(`${label}: ${n}`);
  else if(isCritDamage)showCritToast(`${label} — CRÍTICO: ${total}`);
  else showToast(`${label}: ${n}${fmtMod(mod)} = ${total}`);
}
export function updateNumpadDisplay(){
  document.getElementById('numpadValue').textContent=numpadState.value||'0';
  const total=document.getElementById('numpadTotal');
  total.classList.remove('filled','crit','fail','invalid');
  if(numpadState.value===''){total.textContent='—';return;}
  const n=parseInt(numpadState.value);
  if(n<numpadState.min||n>numpadState.max){total.textContent='!';total.classList.add('invalid');return;}
  total.textContent=n+numpadState.mod;
  if(numpadState.isD20&&n===20)total.classList.add('crit');
  else if(numpadState.isD20&&n===1)total.classList.add('fail');
  else total.classList.add('filled');
}
export function updateInlineResult(target){
  const btn=document.querySelector(`[data-calc-target="${target}"]`);
  if(!btn)return;
  const v=calcValues[target]||'';
  const mod=parseInt(btn.dataset.calcMod)||0;
  const isD20=btn.dataset.calcD20==='1';
  const min=parseInt(btn.dataset.calcMin)||1;
  const max=parseInt(btn.dataset.calcMax)||20;
  btn.classList.remove('filled','crit','fail','invalid');
  if(v===''){btn.textContent='?';return;}
  const n=parseInt(v);
  if(n<min||n>max){btn.textContent='!';btn.classList.add('invalid');return;}
  const total=n+mod;
  if(isD20&&n===20){btn.textContent=total+'⭐';btn.classList.add('crit');}
  else if(isD20&&n===1){btn.textContent=total+'❌';btn.classList.add('fail');}
  else{btn.textContent=total;btn.classList.add('filled');}
}
export function calcTapHTML(target,mod,dieStr,isD20,label,isCrit){
  const info=diceInfo(dieStr);
  const cls = isCrit ? 'calc-tap crit-tap' : 'calc-tap';
  return `<button class="${cls}" 
    data-calc-target="${target}" 
    data-calc-mod="${mod}" 
    data-calc-die="${dieStr}"
    data-calc-d20="${isD20?'1':'0'}"
    data-calc-min="${info.min}"
    data-calc-max="${info.max}"
    data-calc-label="${esc(label)}" 
    data-calc-crit="${isCrit?'1':'0'}"
    onclick="openNumpad('${target}')">?</button>`;
}

