import { diceInfo } from './calc.js';
import { fmtMod, esc } from './utils.js';
import { logHistory, categoryFromTarget, updateFab } from './history.js';
import { showToast, showCritToast } from './toast.js';

export let calcValues = {};
export let calcTimers = {};
export let numpadState = {target:null,mod:0,isD20:false,min:1,max:20,dieStr:'d20',label:'',value:'',value2:'',rollMode:'normal',activeRoll:0,onConfirm:null,mode:'dice',chips:null,isCritDamage:false,usageAction:null};

const numpadHooks = { classLevel: null, updateSlotTotal: null, actionUsed: null };
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
    value2:'',
    rollMode:'normal',
    activeRoll:0,
    onConfirm:opts.onConfirm||null,
    mode:opts.mode||'dice',
    chips:opts.chips||null,
    isCritDamage:opts.isCritDamage||false,
    usageAction:opts.usageAction||null
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
  syncRollModes();
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
    isCritDamage: btn.dataset.calcCrit==='1',
    usageAction: btn.dataset.calcUsageAction||null
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
  numpadState.rollMode='normal';numpadState.value2='';numpadState.activeRoll=0;
  document.getElementById('numpadOverlay').classList.remove('show');
  updateFab();
}
function isMultiRoll(){
  return numpadState.isD20 && numpadState.rollMode!=='normal';
}
function currentRollValue(){
  return isMultiRoll()&&numpadState.activeRoll===1?numpadState.value2:numpadState.value;
}
function setCurrentRollValue(value){
  if(isMultiRoll()&&numpadState.activeRoll===1)numpadState.value2=value;
  else numpadState.value=value;
}
function resolveRoll(){
  const min=numpadState.min,max=numpadState.max;
  const n1=parseInt(numpadState.value);
  const n2=parseInt(numpadState.value2);
  const valid1=Number.isInteger(n1)&&n1>=min&&n1<=max;
  if(!isMultiRoll())return{n:n1,valid:valid1,multi:false};
  const valid2=Number.isInteger(n2)&&n2>=min&&n2<=max;
  if(!valid1||!valid2)return{n:null,n1,n2,valid:false,multi:true};
  return{n:numpadState.rollMode==='adv'?Math.max(n1,n2):Math.min(n1,n2),n1,n2,valid:true,multi:true};
}
function syncRollModes(){
  const modes=document.getElementById('numpadRollModes');
  if(!modes)return;
  modes.style.display=numpadState.isD20&&numpadState.mode!=='number'?'':'none';
  const names=['normal','adv','dis'];
  modes.querySelectorAll('.numpad-mode-btn').forEach((btn,i)=>{
    btn.classList.toggle('active',names[i]===numpadState.rollMode);
  });
}
export function setRollMode(mode){
  if(!['normal','adv','dis'].includes(mode)||!numpadState.isD20)return;
  if(mode==='normal'){
    numpadState.rollMode='normal';
    numpadState.value2='';
    numpadState.activeRoll=0;
  }else{
    if(numpadState.rollMode==='normal'){
      numpadState.value2='';
      numpadState.activeRoll=numpadState.value?1:0;
    }
    numpadState.rollMode=mode;
  }
  syncRollModes();
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(10);
}
export function selectRollSlot(index){
  if(!isMultiRoll())return;
  numpadState.activeRoll=index===1?1:0;
  updateNumpadDisplay();
}
export function npDigit(d){
  const current=currentRollValue();
  const maxLen=String(numpadState.max).length;
  if(current.length>=maxLen)return;
  if(current===''&&d==='0')return;
  const candidate=current+d;
  const n=parseInt(candidate);
  if(n>numpadState.max&&candidate.length>=maxLen)return;
  setCurrentRollValue(candidate);
  if(isMultiRoll()&&numpadState.activeRoll===0&&candidate.length>=maxLen)numpadState.activeRoll=1;
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(8);
}
export function npDel(){
  setCurrentRollValue(currentRollValue().slice(0,-1));
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(8);
}
export function npChip(v){
  setCurrentRollValue(String(v));
  if(isMultiRoll()&&numpadState.activeRoll===0)numpadState.activeRoll=1;
  updateNumpadDisplay();
  if(navigator.vibrate)navigator.vibrate(12);
}
export function npConfirm(){
  if(!numpadState.target&&!numpadState.onConfirm)return;
  const resolved=resolveRoll();
  if(!resolved.valid){
    if(resolved.multi&&(!numpadState.value||!numpadState.value2))showToast('Digite os dois valores');
    else if(!resolved.multi&&!numpadState.value)showToast('Digite um valor');
    else showToast(`Valor deve estar entre ${numpadState.min} e ${numpadState.max}`);
    return;
  }
  const n=resolved.n;
  const v=String(n);
  const target=numpadState.target;
  const mod=numpadState.mod;
  const total=n+mod;
  const isD20=numpadState.isD20;
  const isCrit=isD20&&n===20;
  const isFail=isD20&&n===1;
  const baseLabel=numpadState.label;
  const label=resolved.multi?`${baseLabel} (${numpadState.rollMode==='adv'?'Vantagem':'Desvantagem'})`:baseLabel;
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
  if(numpadState.usageAction&&numpadHooks.actionUsed)numpadHooks.actionUsed(numpadState.usageAction);
  if(onConfirmCb){onConfirmCb(n,total);}
  
  document.getElementById('numpadOverlay').classList.remove('show');
  numpadState.target=null;numpadState.onConfirm=null;
  if(navigator.vibrate)navigator.vibrate(isCritDamage?[30,30,30]:20);
  updateFab();
  if(isEditMode)showToast(`${label}: ${n}`);
  else if(isCritDamage)showCritToast(`${label} — CRÍTICO: ${total}`);
  else if(resolved.multi)showToast(`${label}: ${resolved.n1}/${resolved.n2} → ${n}${fmtMod(mod)} = ${total}`);
  else showToast(`${label}: ${n}${fmtMod(mod)} = ${total}`);
}
export function updateNumpadDisplay(){
  const valueEl=document.getElementById('numpadValue');
  const total=document.getElementById('numpadTotal');
  total.classList.remove('filled','crit','fail','invalid');
  if(isMultiRoll()){
    const v1=numpadState.value||'—';
    const v2=numpadState.value2||'—';
    valueEl.innerHTML=`<span class="np-roll-slot ${numpadState.activeRoll===0?'active':''}" onclick="selectRollSlot(0)">${v1}</span><span class="np-roll-sep">/</span><span class="np-roll-slot ${numpadState.activeRoll===1?'active':''}" onclick="selectRollSlot(1)">${v2}</span>`;
    const r=resolveRoll();
    if(!r.valid){total.textContent='—';return;}
    total.textContent=r.n+numpadState.mod;
    if(r.n===20)total.classList.add('crit');
    else if(r.n===1)total.classList.add('fail');
    else total.classList.add('filled');
    return;
  }
  valueEl.textContent=numpadState.value||'0';
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
export function calcTapHTML(target,mod,dieStr,isD20,label,isCrit,usageAction){
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
    data-calc-usage-action="${usageAction||''}"
    onclick="openNumpad('${target}')">?</button>`;
}

