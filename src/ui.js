import { state, saveState as save, emptyBeast, ATTR_NAMES, ATTR_FULL, SKILLS, exportState, importState, getActiveCharacter, getActiveId, getCharacters, switchCharacter as switchCharacterState, createCharacter as createCharacterState, deleteCharacter as deleteCharacterState } from './state.js';
export { exportState, importState };
import { getMod, getProf as getProfPure, parseDice, diceInfo, calcWeaponAttack as calcWeaponAttackPure, calcBeastAttack as calcBeastAttackPure, getAutoSlots as getAutoSlotsPure } from './calc.js';
import { fmtMod, esc } from './utils.js';
import { logHistory, categoryFromTarget, updateFab, renderHistEntries } from './history.js';
import { calcTapHTML, openNumpadDirect, setNumpadHooks, calcValues, updateInlineResult } from './numpad.js';
import { showToast } from './toast.js';

let panelState = {combat:false,savesSkills:true,features:true,feats:true,spells:true,forms:true,inventory:true,conditions:false};
let histCurrentTab = 'skills';

function getProf(level) {
  if (level === undefined) level = getTotalLevel();
  return getProfPure(level);
}

function getAutoSlots(classes) {
  return getAutoSlotsPure(classes || (state.character ? state.character.classes : []));
}

const getTotalLevel=()=>Math.max(1,Math.min(20,state.character.classes.reduce((s,c)=>s+(parseInt(c.level)||0),0)));
const getAttrMod=(k)=>getMod(state.attrs[k]);
const getUnarmoredAC=()=>10+getAttrMod('dex')+getAttrMod('con');
const getBeastUnarmoredAC=(b)=>10+getMod(b?.attrs?.dex??10)+getMod(b?.attrs?.con??10);
const getSpellDC=()=>8+getProf()+getAttrMod(state.spellcasting.ability);
const getSpellAtk=()=>getProf()+getAttrMod(state.spellcasting.ability);
const getPassivePerc=()=>10+getSkillTotal('percepcao');
const isRage=()=>state.effects.find(e=>e.id==='rage')?.active;
const isWild=()=>hasDruidLevels()&&!!state.effects.find(e=>e.id==='wild')?.active;
const getActiveWeapon=()=>state.weapons.find(w=>w.active);
export function getSkillTotal(key){const s=SKILLS[key];return getAttrMod(s.attr)+(state.skills[key]?getProf():0);}
export function getSaveTotal(k){return getAttrMod(k)+(state.saves[k]?getProf():0);}
export function hasDruidLevels(){return state.character.classes.some(c=>(c.name||'').toLowerCase().includes('druida')&&parseInt(c.level)>0);}
export function hasTotemBear(){return state.features.some(f=>f.id==='f4'||(f.name||'').toLowerCase().includes('totem'));}

export function getActiveCombatFeats(){
  return state.feats.filter(f => f.combat && f.combat.active &&
    (f.combat.dice || f.combat.attackBonus || f.combat.damageBonus));
}
export function getCombatFeatAtkBonus(){return getActiveCombatFeats().reduce((s,f)=>s+(parseInt(f.combat.attackBonus)||0),0);}
export function getCombatFeatDmgBonus(){return getActiveCombatFeats().reduce((s,f)=>s+(parseInt(f.combat.damageBonus)||0),0);}
export function getCombatFeatDice(){
  return getActiveCombatFeats().filter(f=>f.combat.dice).map(f=>({
    dice: f.combat.dice, damageType: f.combat.damageType||'', name: f.name, featId: f.id
  }));
}
export function toggleCombatFeat(id){
  const f=state.feats.find(x=>x.id===id);if(!f||!f.combat)return;
  f.combat.active=!f.combat.active;
  renderAll();save();
  if(f.combat.active)showToast(`🌟 ${f.name} ativo em combate`);
  else showToast(`🌟 ${f.name} desativado`);
}

export function newTurn(){
  state.feats.forEach(f=>{ if(f.combat) f.usedThisTurn=false; });
  save();renderAll();
  showToast('🔄 Novo turno');
}

export function openHistoryModal(){
  histCurrentTab='skills';
  const html=`
    <div class="hist-tabs">
      <button class="hist-tab active" data-tab="skills" onclick="switchHistTab('skills')">📊 Perícias</button>
      <button class="hist-tab" data-tab="attacks" onclick="switchHistTab('attacks')">⚔ Ataques</button>
      <button class="hist-tab" data-tab="hp" onclick="switchHistTab('hp')">❤️ HP</button>
    </div>
    <div class="hist-panel active" id="hist-skills">${renderHistEntries('skills')}</div>
    <div class="hist-panel" id="hist-attacks">${renderHistEntries('attacks')}</div>
    <div class="hist-panel" id="hist-hp">${renderHistEntries('hp')}</div>`;
  openModal('📜 Histórico',html,null);
  document.getElementById('modalFooter').innerHTML=`
    <button class="btn-cancel" onclick="clearCurrentHist()">🗑 Limpar aba</button>
    <button class="btn-save" onclick="closeModal()">Fechar</button>`;
  updateFab();
}
export function switchHistTab(tab){
  histCurrentTab=tab;
  document.querySelectorAll('.hist-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.hist-panel').forEach(p=>p.classList.toggle('active',p.id==='hist-'+tab));
}
export function clearCurrentHist(){
  const names={skills:'Perícias',attacks:'Ataques',hp:'HP'};
  if(!confirm('Limpar histórico de '+names[histCurrentTab]+'?'))return;
  state.history[histCurrentTab]=[];
  save();
  document.getElementById('hist-'+histCurrentTab).innerHTML=renderHistEntries(histCurrentTab);
  updateFab();showToast('🗑 Histórico limpo');
}

export function calcSpellDamageStr(sp, isCrit){
  if(!sp.damage) return null;
  const d = parseDice(sp.damage);
  if(!d) return null;
  const count = isCrit ? d.count*2 : d.count;
  const diceStr = `${count}d${d.sides}`;
  const dmgMod = parseInt(sp.damageMod)||0;
  const parts = [diceStr];
  if(dmgMod !== 0) parts.push(fmtMod(dmgMod));
  const damage = parts.join(' ') + (sp.damageType?' '+sp.damageType:'');
  return {damage, diceStr, dmgMod, isCrit:!!isCrit};
}

export function calcWeaponAttack(w, isCrit) {
  return calcWeaponAttackPure(w, isCrit, state);
}

export function calcBeastAttack(beast, atk, isCrit) {
  return calcBeastAttackPure(beast, atk, isCrit, isRage());
}

export function applyDamage(amount){
  if(amount<=0)return;
  let logEntry={type:'damage',amount:-amount,target:'human',before:state.hp.current,after:0,tempAbsorvido:0};
  if(isWild()&&state.wildHp.current>0){
    logEntry.target='wild';logEntry.before=state.wildHp.current;
    const absorbed=Math.min(state.wildHp.current,amount);
    state.wildHp.current-=absorbed;
    const overflow=amount-absorbed;
    logEntry.after=state.wildHp.current;
    if(state.wildHp.current===0){
      const wn=state.beasts[state.activeBeast]?.name||'Fera';
      state.effects.find(e=>e.id==='wild').active=false;
      state.wildHp={current:0,max:0};
      if(overflow>0){
        let rem=overflow;
        if(state.hp.temp>0){
          const t=Math.min(state.hp.temp,rem);
          state.hp.temp-=t;rem-=t;logEntry.tempAbsorvido=t;
        }
        logEntry.overflowBefore=state.hp.current;
        state.hp.current=Math.max(0,state.hp.current-rem);
        logEntry.overflowAfter=state.hp.current;
        showToast(`🐻 ${wn} caiu! ${overflow} passou pra forma humana`);
      }else showToast(`🐻 ${wn} caiu! Forma humana intacta`);
    }else showToast(`🐻 −${amount} HP (wild: ${state.wildHp.current}/${state.wildHp.max})`);
  }else{
    let rem=amount;
    if(state.hp.temp>0){
      const t=Math.min(state.hp.temp,rem);
      state.hp.temp-=t;rem-=t;logEntry.tempAbsorvido=t;
    }
    state.hp.current=Math.max(0,state.hp.current-rem);
    logEntry.after=state.hp.current;
    showToast(logEntry.tempAbsorvido>0?`👤 −${amount} HP (${logEntry.tempAbsorvido} temp)`: `👤 −${amount} HP`);
  }
  logHistory('hp',logEntry);
  if(navigator.vibrate)navigator.vibrate(60);
  renderAll();save();
}
export function applyHealing(amount){
  if(amount<=0)return;
  let logEntry={type:'heal',amount:amount,target:'human',before:state.hp.current,after:0};
  if(isWild()){
    logEntry.target='wild';logEntry.before=state.wildHp.current;
    state.wildHp.current=Math.min(state.wildHp.max,state.wildHp.current+amount);
    logEntry.after=state.wildHp.current;
    showToast(`🐻 +${state.wildHp.current-logEntry.before} HP`);
  }else{
    state.hp.current=Math.min(state.hp.max,state.hp.current+amount);
    logEntry.after=state.hp.current;
    showToast(`👤 +${state.hp.current-logEntry.before} HP`);
  }
  logHistory('hp',logEntry);
  renderAll();save();
}
export function quickHP(delta){if(delta<0)applyDamage(-delta);else applyHealing(delta);}

export function openHPModal(){
  const wildActive=isWild();
  const html=`
    <div class="hp-status">
      ${wildActive?`<div class="hp-status-row wild"><span class="k">🐻 ${esc(state.beasts[state.activeBeast]?.name||'Fera')}</span><span class="v">${state.wildHp.current} / ${state.wildHp.max}</span></div>`:''}
      <div class="hp-status-row human"><span class="k">👤 Forma Humana</span><span class="v">${state.hp.current} / ${state.hp.max}</span></div>
    </div>
    <div class="modal-sub">Tomar Dano</div>
    <div class="field-row">
      <div class="field"><label>Qtd</label><input type="number" id="dmgAmount" value="0" min="0"></div>
      <div><button type="button" class="btn-action danger" onclick="applyDamageModal()">Aplicar</button></div>
    </div>
    <div class="modal-sub">Curar</div>
    <div class="field-row">
      <div class="field"><label>Qtd</label><input type="number" id="healAmount" value="0" min="0"></div>
      <div><button type="button" class="btn-action success" onclick="applyHealModal()">Aplicar</button></div>
    </div>
    <div class="modal-sub">Ajustar Manualmente</div>
    <div class="field-row">
      <div class="field"><label>HP Humano</label><input type="number" name="hpCur" value="${state.hp.current}" min="0"></div>
      <div class="field"><label>HP Máx</label><input type="number" name="hpMax" value="${state.hp.max}" min="1"></div>
    </div>
    ${wildActive?`<div class="field-row">
      <div class="field"><label>🐻 Wild Atual</label><input type="number" name="wildCur" value="${state.wildHp.current}" min="0"></div>
      <div class="field"><label>🐻 Wild Máx</label><input type="number" name="wildHpMax" value="${state.wildHp.max}" min="0"></div>
    </div>`:''}`;
  openModal('Gerenciar HP',html,data=>{
    const oldHuman=state.hp.current,oldWild=state.wildHp.current;
    state.hp.max=Math.max(1,parseInt(data.hpMax)||1);
    state.hp.current=Math.max(0,Math.min(state.hp.max,parseInt(data.hpCur)||0));
    if(wildActive){
      state.wildHp.max=Math.max(0,parseInt(data.wildHpMax)||0);
      state.wildHp.current=Math.max(0,Math.min(state.wildHp.max,parseInt(data.wildCur)||0));
    }
    if(state.hp.current!==oldHuman){
      logHistory('hp',{type:state.hp.current>oldHuman?'heal':'damage',
        amount:state.hp.current-oldHuman,target:'human',before:oldHuman,after:state.hp.current,label:'Manual'});
    }
    if(wildActive&&state.wildHp.current!==oldWild){
      logHistory('hp',{type:state.wildHp.current>oldWild?'heal':'damage',
        amount:state.wildHp.current-oldWild,target:'wild',before:oldWild,after:state.wildHp.current,label:'Manual'});
    }
    renderAll();save();showToast('✓ HP atualizado');
  });
  document.getElementById('modalFooter').innerHTML='<button class="btn-cancel" onclick="closeModal()">Fechar</button>';
  updateFab();
}
export function applyDamageModal(){const a=parseInt(document.getElementById('dmgAmount').value)||0;if(a>0){applyDamage(a);closeModal();}}
export function applyHealModal(){const a=parseInt(document.getElementById('healAmount').value)||0;if(a>0){applyHealing(a);closeModal();}}

export function getACBreakdown(){
  const bonus=parseInt(state.caBonus)||0;
  if(isWild()){
    const b=state.beasts[state.activeBeast];
    if(!b)return{source:'Fera não definida',base:10,bonus,total:10+bonus,isWild:true};
    const beastCA=b.ca||10;const beastUA=getBeastUnarmoredAC(b);const mode=state.caWildMode||'auto';
    let base,source;
    if(mode==='beast'){base=beastCA;source='CA da Fera';}
    else if(mode==='unarmored'){base=beastUA;source='UA da Fera';}
    else{if(beastUA>beastCA){base=beastUA;source='UA da Fera';}else{base=beastCA;source='CA da Fera';}}
    return{source,base,bonus,total:base+bonus,beastCA,beastUA,isWild:true,wildMode:mode};
  }
  const unarmored=getUnarmoredAC();
  if(state.caOverride>0)return{source:'Manual',base:state.caOverride,bonus,total:state.caOverride+bonus,unarmored,isWild:false};
  return{source:'Defesa sem Armadura',base:unarmored,bonus,total:unarmored+bonus,unarmored,isWild:false};
}
export function getDisplaySpeed(){
  if(isWild()){
    const b=state.beasts[state.activeBeast];
    if(b){
      const p=[];
      if(b.speedWalk)p.push(`${b.speedWalk}m`);
      if(b.speedClimb)p.push(`esc ${b.speedClimb}m`);
      if(b.speedSwim)p.push(`nat ${b.speedSwim}m`);
      if(b.speedFly)p.push(`voo ${b.speedFly}m`);
      return p.join(', ')||'—';
    }
  }
  return `${state.speed||9}m`;
}
export function fmtSpeed(b){
  const p=[];
  if(b.speedWalk)p.push(`${b.speedWalk}m`);
  if(b.speedClimb)p.push(`esc ${b.speedClimb}m`);
  if(b.speedSwim)p.push(`nat ${b.speedSwim}m`);
  if(b.speedFly)p.push(`voo ${b.speedFly}m`);
  return p.join(', ')||'—';
}

export function computeCasterLevel(){
  const full=['mago','clérigo','clerigo','druida','bardo','feiticeiro'];
  const half=['paladino','patrulheiro'];
  let lvl=0;
  state.character.classes.forEach(c=>{
    const n=(c.name||'').toLowerCase();const l=parseInt(c.level)||0;
    if(full.some(x=>n.includes(x)))lvl+=l;
    else if(half.some(x=>n.includes(x)))lvl+=Math.floor(l/2);
  });
  return lvl;
}
export function getMaxSlots(){
  const result = getAutoSlots(state.character.classes);
  Object.keys(state.spellSlotsOverride||{}).forEach(lvl=>{
    const v = parseInt(state.spellSlotsOverride[lvl])||0;
    if(v > 0) result[lvl] = v;
  });
  Object.keys(state.spellSlotsBonus||{}).forEach(lvl=>{
    const v = parseInt(state.spellSlotsBonus[lvl])||0;
    if(v > 0){
      if(!result[lvl]) result[lvl] = 0;
      result[lvl] += v;
    }
  });
  Object.keys(result).forEach(lvl=>{
    if(result[lvl] <= 0) delete result[lvl];
  });
  return result;
}
export function getCurrentSlots(){
  const max=getMaxSlots();const cur={...state.spellSlots};
  Object.keys(max).forEach(lvl=>{
    if(cur[lvl]===undefined)cur[lvl]=max[lvl];
    cur[lvl]=Math.min(cur[lvl],max[lvl]);cur[lvl]=Math.max(0,cur[lvl]);
  });
  Object.keys(cur).forEach(lvl=>{if(!(lvl in max))delete cur[lvl];});
  return cur;
}
export function getLowestAvailableSlot(){
  const cur=getCurrentSlots();
  const lvls=Object.keys(cur).map(Number).sort((a,b)=>a-b);
  for(const l of lvls)if(cur[l]>0)return l;
  return null;
}
export function expendSlot(lvl){
  const cur=getCurrentSlots();
  if(!cur[lvl]||cur[lvl]<=0)return false;
  cur[lvl]--;state.spellSlots=cur;return true;
}
export function toggleSlot(lvl,idx){
  const cur=getCurrentSlots();const max=getMaxSlots()[lvl]||0;
  if(idx<cur[lvl])cur[lvl]--;else if(cur[lvl]<max)cur[lvl]++;
  state.spellSlots=cur;renderAll();save();
}
export function openSlotsModal(){
  const autoSlots = getAutoSlots(state.character.classes);
  const maxLevel = Math.min(9, Math.max(
    3,
    ...Object.keys(autoSlots).map(Number),
    ...Object.keys(state.spellSlotsOverride||{}).map(Number),
    ...Object.keys(state.spellSlotsBonus||{}).map(Number)
  ));
  let rows = `
    <span class="slot-grid-header">Nível</span>
    <span class="slot-grid-header">Manual</span>
    <span class="slot-grid-header">+Bônus</span>
    <span class="slot-grid-header">Total</span>
  `;
  for(let lvl=1; lvl<=maxLevel; lvl++){
    const autoVal = autoSlots[lvl] || 0;
    const overrideVal = (state.spellSlotsOverride||{})[lvl] || 0;
    const bonusVal = (state.spellSlotsBonus||{})[lvl] || 0;
    const total = (overrideVal > 0 ? overrideVal : autoVal) + bonusVal;
    rows += `
      <div class="slot-grid-lvl">
        <div>${lvl}º</div>
        <div class="auto" id="slotAuto_${lvl}" data-auto="${autoVal}">auto: ${autoVal}</div>
      </div>
      <div class="num-field" data-target="slotO_${lvl}" data-min="0" data-max="20" data-value="${overrideVal}" data-label="Máx manual nível ${lvl}" data-chips="0,1,2,3,4" data-callback="updateSlotTotal" data-index="${lvl}" onclick="openNumberEditor(this)">${overrideVal}</div>
      <div class="num-field" data-target="slotB_${lvl}" data-min="0" data-max="10" data-value="${bonusVal}" data-label="Bônus nível ${lvl}" data-chips="0,1,2,3" data-callback="updateSlotTotal" data-index="${lvl}" onclick="openNumberEditor(this)">${bonusVal}</div>
      <div class="slot-grid-total" id="slotTotal_${lvl}">${total}</div>
    `;
  }
  const html = `
    <p class="helper" style="margin:0 0 10px">
      <b>Manual:</b> sobrescreve o valor automático (0 = usar auto).<br>
      <b>+Bônus:</b> slots extras somados ao máximo do nível.<br>
      <span style="font-size:10px;opacity:0.75">Ex: Druida 2 dá 3 slots de 1º. Coloque Manual=5 para ter 5 slots manuais.</span>
    </p>
    <div class="slot-grid">${rows}</div>
  `;
  openModal('✨ Controle de Espaços de Magia', html, (data)=>{
    const autoSlotsSave = getAutoSlots(state.character.classes);
    const newOverride = {};
    const newBonus = {};
    for(let lvl=1; lvl<=maxLevel; lvl++){
      const o = parseInt(data[`slotO_${lvl}`])||0;
      const b = parseInt(data[`slotB_${lvl}`])||0;
      const a = autoSlotsSave[lvl]||0;
      if(o > 0 && o !== a) newOverride[lvl] = o;
      if(b > 0) newBonus[lvl] = b;
    }
    state.spellSlotsOverride = newOverride;
    state.spellSlotsBonus = newBonus;
    const newMax = getMaxSlots();
    const cur = getCurrentSlots();
    Object.keys(cur).forEach(lvl=>{
      if(newMax[lvl]) cur[lvl] = Math.min(cur[lvl], newMax[lvl]);
      else delete cur[lvl];
    });
    state.spellSlots = cur;
    renderAll();
    save();
    showToast('✓ Espaços de magia atualizados');
  });
}
export function updateSlotTotalDisplay(lvl){
  const oEl = document.querySelector(`#modalBody [data-target="slotO_${lvl}"]`);
  const bEl = document.querySelector(`#modalBody [data-target="slotB_${lvl}"]`);
  const aEl = document.getElementById(`slotAuto_${lvl}`);
  const tEl = document.getElementById(`slotTotal_${lvl}`);
  if(!oEl||!bEl||!aEl||!tEl)return;
  const o = parseInt(oEl.dataset.value)||0;
  const b = parseInt(bEl.dataset.value)||0;
  const a = parseInt(aEl.dataset.auto)||0;
  const total = (o > 0 ? o : a) + b;
  tEl.textContent = total;
  tEl.style.color = total > 0 ? 'var(--ink)' : 'var(--ink-dim)';
}

export function getReminders(){return state.inventory.filter(it=>it.reminder&&(it.qty||0)>0);}
export function isItemAvailable(it){if(!isWild())return true;return !!it.availableInWild;}
export function renderReminders(){
  const reminders=getReminders();
  if(!reminders.length)return '';
  const items=reminders.map(it=>{
    const avail=isItemAvailable(it);
    return `<div class="reminder-item ${avail?'':'dim'}">
      <div style="flex:1;min-width:0">
        <span class="reminder-name">${esc(it.name)}</span>
        ${it.reminderNote?`<span class="reminder-note">${esc(it.reminderNote)}</span>`:''}
        ${!avail?`<span class="reminder-wild">🚫 indisponível na forma</span>`:''}
      </div>
      <span class="reminder-qty">×${it.qty}</span>
      <button class="reminder-btn" onclick="event.stopPropagation();consumeReminder('${it.id}')" ${!avail?'disabled':''}>−</button>
      <button class="reminder-btn off" onclick="event.stopPropagation();toggleReminder('${it.id}')">✕</button>
    </div>`;
  }).join('');
  return `<div class="reminders">
    <div class="reminders-title"><span>🔔 Lembretes</span><span class="count">${reminders.length}</span></div>
    ${items}</div>`;
}
export function toggleReminder(id){
  const it=state.inventory.find(x=>x.id===id);if(!it)return;
  it.reminder=!it.reminder;renderAll();save();
  showToast(it.reminder?'🔔 Lembrete ativado':'🔕 Lembrete desativado');
}
export function consumeReminder(id){
  const it=state.inventory.find(x=>x.id===id);if(!it)return;
  if(!isItemAvailable(it)){showToast('Indisponível na Forma Selvagem');return;}
  if(it.qty<=0){showToast('Sem unidades');return;}
  it.qty--;if(it.qty===0)it.reminder=false;
  renderAll();save();showToast(`Consumido: ${it.name} (${it.qty} restantes)`);
}
export function toggleItemWild(id){
  const it=state.inventory.find(x=>x.id===id);if(!it)return;
  it.availableInWild=!it.availableInWild;renderAll();save();
  showToast(it.availableInWild?'✓ Disponível na forma':'🚫 Indisponível na forma');
}

export function openWildHealNumpad(){
  if(!isWild())return showToast('Ative a Forma Selvagem primeiro');
  if(!hasDruidLevels())return showToast('Requer níveis de Druida');
  const slotLvl=getLowestAvailableSlot();
  if(slotLvl===null)return showToast('Sem espaços de magia disponíveis');
  const minRoll=slotLvl, maxRoll=slotLvl*8;
  openNumpadDirect({
    target:'wildheal',mod:0,isD20:false,min:minRoll,max:maxRoll,
    dieStr:slotLvl+'d8',label:'Círculo da Lua (slot '+slotLvl+'º)',
    onConfirm:(n)=>{
      const before=state.wildHp.current;
      state.wildHp.current=Math.min(state.wildHp.max,state.wildHp.current+n);
      expendSlot(slotLvl);
      logHistory('hp',{type:'heal',amount:state.wildHp.current-before,target:'wild',
        before:before,after:state.wildHp.current,label:'Círculo da Lua'});
      showToast('🌙 +'+n+' HP (slot '+slotLvl+'º)');
      renderAll();save();
    }
  });
}
export function openHitDieNumpad(){
  if(state.hitDice.current<=0)return showToast('Sem DVs');
  if(state.hp.current>=state.hp.max)return showToast('HP já cheio');
  const size=getHitDieSize();
  const conMod=getAttrMod('con');
  openNumpadDirect({
    target:'hitdie',mod:conMod,isD20:false,min:1,max:size,dieStr:'1d'+size,
    label:'Dado de Vida (1d'+size+fmtMod(conMod)+')',
    onConfirm:(n)=>{
      const heal=Math.max(1,n+conMod);
      const before=state.hp.current;
      state.hp.current=Math.min(state.hp.max,state.hp.current+heal);
      state.hitDice.current--;
      logHistory('hp',{type:'heal',amount:state.hp.current-before,target:'human',
        before:before,after:state.hp.current,label:'Dado de Vida'});
      showToast(`🎲 +${heal} HP (${state.hitDice.current}/${state.hitDice.max} DV)`);
      renderAll();save();
    }
  });
}
export function openInitiativeNumpad(){
  const mod=getAttrMod('dex');
  openNumpadDirect({target:'initiative',mod,isD20:true,min:1,max:20,dieStr:'d20',
    label:'Iniciativa (d20'+fmtMod(mod)+')'});
}
export function openAbilityCheckNumpad(attr){
  const mod=getAttrMod(attr);
  openNumpadDirect({target:'ability-'+attr,mod,isD20:true,min:1,max:20,dieStr:'d20',
    label:'Teste de '+ATTR_FULL[attr]+' (d20'+fmtMod(mod)+')'});
}
export function openPoisonNumpad(featId){
  const feat=state.feats.find(f=>f.id===featId);
  if(!feat||!feat.damage)return;
  const info=diceInfo(feat.damage);
  openNumpadDirect({
    target:'poison-'+featId,mod:0,isD20:false,min:info.min,max:info.max,
    dieStr:feat.damage,label:feat.name+' — '+feat.damageType,
    onConfirm:(n,total)=>{
      if(feat.combat && feat.combat.oncePerTurn){ feat.usedThisTurn=true; save(); renderAll(); }
    }
  });
}

export function spendFeatUse(id){
  const f=state.feats.find(x=>x.id===id);
  if(!f||!f.uses)return;
  if(f.uses.current<=0){showToast('Sem usos restantes');return;}
  f.uses.current--;
  save();renderAll();
  showToast(`${f.name}: ${f.uses.current}/${f.uses.max} usos`);
}
export function refundFeatUse(id){
  const f=state.feats.find(x=>x.id===id);if(!f||!f.uses)return;
  if(f.uses.current>=f.uses.max)return;
  f.uses.current++;renderAll();save();
}
export function spendFeatureUse(id){
  const f=state.features.find(x=>x.id===id);if(!f||!f.uses)return;
  if(f.uses.current<=0){showToast('Sem usos restantes');return;}
  f.uses.current--;renderAll();save();
  showToast(`${f.name}: ${f.uses.current}/${f.uses.max} usos`);
}
export function refundFeatureUse(id){
  const f=state.features.find(x=>x.id===id);if(!f||!f.uses)return;
  if(f.uses.current>=f.uses.max)return;
  f.uses.current++;renderAll();save();
}

export function getHitDieSize(){return state.hitDieSize||12;}
export function doShortRest(){
  state.features.forEach(f=>{if(f.recharge==='short'&&f.uses)f.uses.current=f.uses.max;});
  state.feats.forEach(f=>{if(f.recharge==='short'&&f.uses)f.uses.current=f.uses.max;});
  showToast('☀️ Descanso curto');
  save();renderAll();
}
export function shortRest(){doShortRest();}
export function doLongRest(){
  state.hp.current=state.hp.max;
  state.hp.temp=0;
  state.wildHp={current:0,max:0};
  const wild=state.effects.find(e=>e.id==='wild');if(wild)wild.active=false;
  const rage=state.effects.find(e=>e.id==='rage');if(rage)rage.active=false;
  const regained=Math.max(1,Math.floor(state.hitDice.max/2));
  state.hitDice.current=Math.min(state.hitDice.max,(state.hitDice.current||0)+regained);
  state.features.forEach(f=>{if(f.uses&&(f.recharge==='short'||f.recharge==='long'))f.uses.current=f.uses.max;});
  state.feats.forEach(f=>{if(f.uses&&(f.recharge==='short'||f.recharge==='long'))f.uses.current=f.uses.max;});
  state.spellSlots={};
  showToast('🌙 Descanso longo');
  save();renderAll();
}
export function longRest(){
  if(!confirm('Descanso Longo?\n• HP ao máximo\n• Usos restaurados\n• Espaços restaurados\n• Metade dos DVs\n• Forma revertida'))return;
  doLongRest();
}

export function setSituation(sit){
  state.situation=sit;
  if(sit==='combat'){panelState.combat=false;panelState.savesSkills=true;}
  else if(sit==='exploration'){panelState.combat=true;panelState.savesSkills=false;}
  else if(sit==='rest'){panelState.combat=true;panelState.savesSkills=true;}
  renderAll();save();
}
export function renderSituationBar(){
  const sit=state.situation||'combat';
  return `<div class="situation-bar">
    <button class="situation-btn combat ${sit==='combat'?'active':''}" onclick="setSituation('combat')">
      <span class="sit-icon">⚔️</span><span class="sit-label">Combate</span></button>
    <button class="situation-btn exploration ${sit==='exploration'?'active':''}" onclick="setSituation('exploration')">
      <span class="sit-icon">🧭</span><span class="sit-label">Exploração</span></button>
    <button class="situation-btn rest ${sit==='rest'?'active':''}" onclick="setSituation('rest')">
      <span class="sit-icon">🌙</span><span class="sit-label">Descanso</span></button>
  </div>`;
}
export function renderCharTabs(){
  const characters=getCharacters();
  const activeId=getActiveId();
  const tabs=Object.entries(characters).map(([id,character])=>{
    const name=(character.character&&character.character.name)||'Sem Nome';
    const active=id===activeId;
    return `<button class="char-tab ${active?'active':''}" onclick="switchCharacterTab('${id}')" title="${esc(name)}">
      <span class="char-tab-name">${esc(name)}</span>
      ${active?`<span class="char-tab-close" onclick="event.stopPropagation();confirmDeleteCharacter('${id}')" title="Excluir personagem" aria-label="Excluir personagem">✕</span>`:''}
    </button>`;
  }).join('');
  return `<div class="char-tabs">${tabs}<button class="char-tab-add" onclick="promptNewCharacter()" title="Novo personagem" aria-label="Novo personagem">+</button></div>`;
}
export function switchCharacterTab(id){
  const character=switchCharacterState(id);
  if(!character)return;
  renderAll();
  showToast(`👤 ${character.character.name}`);
}
export function promptNewCharacter(){
  const name=prompt('Nome do novo personagem:','Novo Herói');
  if(name===null)return;
  const clean=name.trim();
  if(!clean){showToast('⚠ Informe um nome');return;}
  const character=createCharacterState(clean);
  renderAll();
  showToast(`✨ ${character.character.name} criado`);
}
export function confirmDeleteCharacter(id){
  const character=getCharacters()[id];
  if(!character)return;
  const name=character.character.name||'Sem Nome';
  if(!confirm(`Excluir "${name}"?\nEssa ação não pode ser desfeita.`))return;
  if(!deleteCharacterState(id)){
    showToast('⚠ Mantenha pelo menos um personagem');
    return;
  }
  renderAll();
  showToast('🗑 Personagem excluído');
}
export function renderHeader(){
  const character=getActiveCharacter();
  const cls=character.character.classes.map(c=>`${c.name} ${c.level}`).join(' • ');
  const inspired=!!character.inspiration;
  return `<div class="sheet-header">
    <div class="header-actions">
      <button class="header-btn inspiration ${inspired?'active':''}" onclick="toggleInspiration()" title="Inspiração" aria-label="Inspiração" aria-pressed="${inspired}">🌟</button>
      <button class="header-btn" onclick="exportState()" title="Exportar ficha" aria-label="Exportar ficha">📤</button>
      <button class="header-btn" onclick="document.getElementById('importFile').click()" title="Importar ficha" aria-label="Importar ficha">📥</button>
      <button class="edit-float" onclick="openCharModal()">✏ Editar</button>
      <input type="file" id="importFile" accept=".json,application/json" hidden onchange="handleImportFile(this)">
    </div>
    <div class="char-name">${esc(character.character.name)||'— Sem Nome —'}</div>
    <div class="char-line">${esc(cls)}</div>
    <div class="char-line-sub">${esc(character.character.race||'')} • Nível ${getTotalLevel()} • Prof +${getProf()}</div>
  </div>`;
}
export function toggleInspiration(){
  state.inspiration=!state.inspiration;
  save();renderAll();
  showToast(state.inspiration?'🌟 Inspiração ativa':'Inspiração removida');
}
export function handleImportFile(input){
  const file=input.files&&input.files[0];
  input.value='';
  if(!file)return;
  importState(file).catch(()=>{});
}
export function renderStatsBar(){
  const ac=getACBreakdown();
  const sourceTag=ac.isWild?`<div class="sub">${ac.source.includes('Fera')&&!ac.source.includes('UA')?'🐻 Fera':'🛡 UA'}</div>`:'';
  const wild=isWild();
  const hpDisplay=wild
    ?`<div class="val hp" style="font-size:15px">🐻 ${state.wildHp.current}/${state.wildHp.max}</div>
      <div class="hp-sub">👤 ${state.hp.current}/${state.hp.max}</div>`
    :`<div class="val hp">${state.hp.current}/${state.hp.max}</div>`;
  const initMod=getAttrMod('dex');
  return `<div class="stats-bar">
    <div class="stat-box"><div class="lbl">CA</div>
      <div class="val editable" onclick="openCAModal()">${ac.total}</div>${sourceTag}</div>
    <div class="stat-box" onclick="openHPModal()" style="cursor:pointer"><div class="lbl">HP</div>${hpDisplay}
      <div class="hp-controls">
        <button class="hp-btn" onclick="event.stopPropagation();quickHP(-1)">−</button>
        <button class="hp-btn" onclick="event.stopPropagation();quickHP(1)">+</button>
      </div></div>
    <div class="stat-box rollable" onclick="openInitiativeNumpad()"><div class="lbl">Iniciativa</div>
      <div class="val">${fmtMod(initMod)}</div></div>
    <div class="stat-box"><div class="lbl">Desloc.</div>
      <div class="val" style="font-size:${wild?'12px':'19px'}">${getDisplaySpeed()}</div></div>
    <div class="stat-box perc-pass"><div class="lbl">Perc. Passiva</div>
      <div class="val">${getPassivePerc()}</div></div>
  </div>`;
}
export function renderConditions(){
  const level=state.exhaustion||0;
  const active=new Set(state.conditions||[]);
  const common=['Caído','Envenenado','Amedrontado','Atordoado','Inconsciente'];
  const dots=Array.from({length:6},(_,i)=>
    `<button class="exh-dot ${i<level?'filled':''}" onclick="setExhaustion(${i+1})" title="Exaustão ${i+1}" aria-label="Exaustão ${i+1}"></button>`).join('');
  const chips=common.map(c=>
    `<button class="condition-chip ${active.has(c)?'active':''}" onclick="toggleCondition('${c}')">${c}</button>`).join('');
  return `<div class="panel ${panelState.conditions?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('conditions')">💀 Condições & Exaustão</div>
    <div class="panel-body">
      <div class="exhaustion-row">
        <span class="exhaustion-label">Exaustão</span>
        <div class="exhaustion-controls">
          <button class="exh-step" onclick="setExhaustion(${level-1})" ${level<=0?'disabled':''} aria-label="Reduzir exaustão">−</button>
          <div class="exh-dots">${dots}</div>
          <button class="exh-step" onclick="setExhaustion(${level+1})" ${level>=6?'disabled':''} aria-label="Aumentar exaustão">+</button>
        </div>
        <span class="exh-value">${level}/6</span>
      </div>
      <div class="condition-chips">${chips}</div>
    </div>
  </div>`;
}
export function setExhaustion(level){
  state.exhaustion=Math.max(0,Math.min(6,Math.round(Number(level)||0)));
  save();renderAll();
  showToast(state.exhaustion?`😵 Exaustão nível ${state.exhaustion}`:'✓ Exaustão removida');
}
export function toggleCondition(condition){
  if(!Array.isArray(state.conditions))state.conditions=[];
  const idx=state.conditions.indexOf(condition);
  if(idx>=0){
    state.conditions.splice(idx,1);
    showToast(`Condição removida: ${condition}`);
  }else{
    state.conditions.push(condition);
    showToast(`Condição ativa: ${condition}`);
  }
  save();renderAll();
}
export function renderAbilities(){
  return `<div class="ability-grid">`+Object.keys(ATTR_NAMES).map(k=>{
    const score=state.attrs[k];
    return `<div class="ability" onclick="openAbilityCheckNumpad('${k}')">
      <div class="ability-name">${ATTR_NAMES[k]}</div>
      <div class="ability-score">${score}</div>
      <div class="ability-mod">${fmtMod(getMod(score))}</div>
    </div>`;
  }).join('')+`</div>`;
}
export function renderSpellSlots(){
  const max=getMaxSlots();const cur=getCurrentSlots();
  const levels=Object.keys(max).map(Number).sort((a,b)=>a-b);
  const hasOverride=state.spellSlotsOverride && Object.keys(state.spellSlotsOverride).length>0;
  const hasBonus=state.spellSlotsBonus && Object.keys(state.spellSlotsBonus).length>0;
  const isCustomized = hasOverride || hasBonus;
  const btnCls = 'slots-edit-btn' + (isCustomized ? ' active' : '');
  if(!levels.length){
    return `<div class="slots-strip">
      <div class="slots-title-wrap">
        <span class="slots-title">✨ Espaços</span>
        <button class="${btnCls}" onclick="openSlotsModal()" title="Configurar espaços de magia">⚙</button>
      </div>
      <span class="slots-empty-hint">Nenhum espaço configurado</span>
    </div>`;
  }
  const groups=levels.map(lvl=>{
    const m=max[lvl],c=cur[lvl];const dots=[];
    for(let i=0;i<m;i++)dots.push(`<button class="slot-dot ${i<c?'filled':''}" onclick="toggleSlot(${lvl},${i})"></button>`);
    return `<div class="slot-group"><span class="slot-lvl">${lvl}º</span>
      <div class="slot-dots">${dots.join('')}</div>
      <span class="slot-count">${c}/${m}</span></div>`;
  }).join('');
  return `<div class="slots-strip">
    <div class="slots-title-wrap">
      <span class="slots-title">✨ Espaços</span>
      <button class="${btnCls}" onclick="openSlotsModal()" title="Configurar espaços de magia">⚙</button>
    </div>
    <div class="slots-groups">${groups}</div>
  </div>`;
}
export function renderRestPanel(){
  const maxSlots=getMaxSlots();const curSlots=getCurrentSlots();
  const rows=[];
  const hpLow=state.hp.current<state.hp.max;
  rows.push(`<div class="rest-res-row"><span class="k">👤 HP</span><span class="v ${hpLow?'low':''}">${state.hp.current}/${state.hp.max}</span></div>`);
  const hdLow=state.hitDice.current<state.hitDice.max?'low':'';
  rows.push(`<div class="rest-res-row"><span class="k">🎲 DVs</span><span class="v ${hdLow}">${state.hitDice.current}/${state.hitDice.max} (d${getHitDieSize()})</span></div>`);
  state.features.forEach(f=>{
    if(f.uses){
      const isLow=f.uses.current<f.uses.max;
      const rt=f.recharge==='short'?'<span class="recharge-tag recharge-short">curto</span>':
               f.recharge==='long'?'<span class="recharge-tag recharge-long">longo</span>':'';
      rows.push(`<div class="rest-res-row"><span class="k">${esc(f.name)}</span><span class="v ${isLow?'low':''}">${f.uses.current}/${f.uses.max}${rt}</span></div>`);
    }
  });
  state.feats.forEach(f=>{
    if(f.uses){
      const isLow=f.uses.current<f.uses.max;
      const rt=f.recharge==='short'?'<span class="recharge-tag recharge-short">curto</span>':
               f.recharge==='long'?'<span class="recharge-tag recharge-long">longo</span>':'';
      rows.push(`<div class="rest-res-row"><span class="k">🌟 ${esc(f.name)}</span><span class="v ${isLow?'low':''}">${f.uses.current}/${f.uses.max}${rt}</span></div>`);
    }
  });
  Object.keys(maxSlots).forEach(lvl=>{
    const m=maxSlots[lvl],c=curSlots[lvl];const isLow=c<m;
    rows.push(`<div class="rest-res-row"><span class="k">✨ Slot ${lvl}º</span><span class="v ${isLow?'low':''}">${c}/${m}</span></div>`);
  });
  const conMod=getAttrMod('con');
  const canRoll=state.hitDice.current>0&&state.hp.current<state.hp.max;
  const dieLabel='1d'+getHitDieSize()+fmtMod(conMod);
  return `<div class="rest-panel">
    <div class="rest-panel-title">🌙 Descanso</div>
    <div class="rest-panel-body">
      <div class="rest-resources"><div class="rest-res-title">Recursos</div>${rows.join('')}</div>
      <div class="rest-actions">
        <button class="rest-btn short" onclick="shortRest()">
          <span class="rest-emoji">☕</span><span>Descanso Curto</span><span class="rest-desc">Recursos curtos</span></button>
        <button class="rest-btn long" onclick="longRest()">
          <span class="rest-emoji">🌙</span><span>Descanso Longo</span><span class="rest-desc">Tudo</span></button>
      </div>
      <div class="rest-hd-box">
        <div class="rest-hd-header">
          <span class="rest-hd-title">🎲 Dado de Vida</span>
          <span class="hd-badge">${state.hitDice.current}/${state.hitDice.max}</span>
        </div>
        <div class="rest-hd-body">
          <div class="rest-hd-info">${dieLabel}</div>
          <button class="btn-hd-roll" onclick="openHitDieNumpad()" ${canRoll?'':'disabled'}>🎲 Rolar</button>
        </div>
        ${!canRoll?`<div class="rest-hd-helper">${state.hp.current>=state.hp.max?'HP já está cheio':'Sem DVs disponíveis'}</div>`:''}
      </div>
    </div>
  </div>`;
}
export function renderCombatFeatToggles(){
  const combatFeats=state.feats.filter(f=>f.combat&&(f.combat.dice||f.combat.attackBonus||f.combat.damageBonus));
  if(!combatFeats.length)return '';
  const toggles=combatFeats.map(f=>{
    const parts=[];
    if(f.combat.dice)parts.push(f.combat.dice+(f.combat.damageType?' '+f.combat.damageType:''));
    if(f.combat.attackBonus)parts.push(fmtMod(f.combat.attackBonus)+' acerto');
    if(f.combat.damageBonus)parts.push(fmtMod(f.combat.damageBonus)+' dano');
    const label=parts.join(' + ');
    const onceBadge=f.combat.oncePerTurn?`<span class="once-badge">1/turno${f.usedThisTurn?' • gasto':''}</span>`:'';
    const spent=f.combat.oncePerTurn && f.usedThisTurn;
    const style=spent?' style="opacity:0.5"':'';
    return `<button class="toggle-btn feat ${f.combat.active?'active':''}"${style} onclick="toggleCombatFeat('${f.id}')">
      🌟 ${esc(f.name)}${label?' '+label:''}${onceBadge}
    </button>`;
  }).join('');
  return `<div class="combat-feat-section">
    <div class="combat-feat-title">🌟 Talentos em Combate<span class="hint">— toque para aplicar</span></div>
    <div class="toggles" style="padding:0;border-bottom:none;margin-bottom:0">${toggles}</div>
    <button class="btn-action" style="margin-top:6px;font-size:11px;padding:4px 8px" onclick="newTurn()">🔄 Novo Turno</button>
  </div>`;
}
export function renderCombat(){
  const effects=state.effects.filter(e=>e.id!=='wild'||hasDruidLevels());
  const toggles=effects.map(e=>{
    const feat=state.features.find(f=>f.name===e.name);
    let usesBadge='';
    if(feat&&feat.uses)usesBadge=`<span class="uses-badge">${feat.uses.current}/${feat.uses.max}</span>`;
    const totemHint=(e.id==='rage'&&hasTotemBear())?`<span class="totem-hint">🐾</span>`:'';
    const icon=e.type==='rage'?'🔥 ':e.type==='wild'?'🐻 ':'';
    return `<button class="toggle-btn ${e.active?'active':''} ${e.type||''}"
      onclick="toggleEffect('${e.id}')">${icon}${esc(e.name)}${totemHint}${usesBadge}</button>`;
  }).join('');
  return `<div class="panel ${panelState.combat?'collapsed':''} major">
    <div class="panel-title" onclick="togglePanelKey('combat')">⚔ Combate</div>
    <div class="panel-body">
      <div class="toggles">${toggles}</div>
      ${renderCombatFeatToggles()}
      ${renderScenario()}
      ${isWild()?renderWildActions():''}
      ${isWild()?renderActiveBeast():renderWeapons()}
    </div>
  </div>`;
}
export function renderWildActions(){
  if(!hasDruidLevels())return '';
  const slotLvl=getLowestAvailableSlot();
  const cur=getCurrentSlots();
  const totalSlots=Object.values(cur).reduce((s,n)=>s+n,0);
  return `<button class="wild-heal-btn" onclick="openWildHealNumpad()" ${slotLvl===null?'disabled':''}>
    🌙 Curar na Forma (1d8×nível)
    <span class="slots-mini">${totalSlots} slot${totalSlots!==1?'s':''}</span></button>`;
}
export function renderScenario(){
  const ac=getACBreakdown();
  const effectsActive=state.effects.filter(e=>e.active).map(e=>e.name);
  let rows='';
  if(isWild()){
    const b=state.beasts[state.activeBeast];
    if(b){
      const mainAtk=b.attacks.reduce((a,c)=>{
        const avg=(x)=>{const d=parseDice(x.die);return d?d.count*(d.sides+1)/2+x.mod:0;};
        return avg(a)>=avg(c)?a:c;
      },b.attacks[0]);
      const calc=calcBeastAttack(b,mainAtk,false);
      rows=`
        <div class="scenario-row"><span class="k">Forma</span><span class="v">${esc(b.name)}</span></div>
        <div class="scenario-row"><span class="k">Ataque</span><span class="v">${esc(mainAtk.name)}</span></div>
        <div class="scenario-row"><span class="k">Acerto</span><span class="v hot">${fmtMod(calc.toHit)}</span></div>
        <div class="scenario-row"><span class="k">Dano</span><span class="v hot">${calc.damage}</span></div>
        <div class="scenario-row"><span class="k">CA</span><span class="v wild">${ac.total} <small style="color:var(--ink-soft);font-size:10px">(${ac.source})</small></span></div>`;
    }
  }else{
    const w=getActiveWeapon();
    if(w){
      const calc=calcWeaponAttack(w,false);
      rows=`
        <div class="scenario-row"><span class="k">Arma</span><span class="v">${esc(w.name)}</span></div>
        <div class="scenario-row"><span class="k">Acerto</span><span class="v hot">${fmtMod(calc.toHit)}</span></div>
        <div class="scenario-row"><span class="k">Dano</span><span class="v hot">${calc.damage}</span></div>
        <div class="scenario-row"><span class="k">CA</span><span class="v">${ac.total}</span></div>`;
      if(calc.featDice.length){
        rows+=`<div class="scenario-row"><span class="k">🌟 Feat</span><span class="v feat">${calc.featDice.map(f=>'+'+f.dice+(f.damageType?' '+f.damageType:'')).join(' ')}</span></div>`;
      }
    }else{rows=`<div class="scenario-row"><span class="k">Nenhuma arma ativa</span></div>`;}
  }
  if(isRage())rows+=`<div class="scenario-row"><span class="k">🛡 Resist.</span><span class="v resist">Tudo exceto psíquico</span></div>`;
  const effLine=effectsActive.length?`<div class="scenario-effects">✓ ${effectsActive.map(esc).join(' • ')}${isRage()&&hasTotemBear()?' (🐾 totem)':''}</div>`:'';
  return `<div class="scenario"><div class="scenario-title">Cenário Atual</div>${rows}${effLine}</div>`;
}
export function renderWeapons(){
  if(!state.weapons.length)return '<div class="empty">Nenhuma arma.</div>';
  return state.weapons.map(w=>{
    const normal=calcWeaponAttack(w,false);
    const crit=calcWeaponAttack(w,true);
    return `<div class="atk-card ${w.active?'active':''}">
      <div class="atk-header">
        <div class="atk-name" onclick="selectWeapon('${w.id}')">${esc(w.name)}${w.active?'<span class="atk-tag">Ativa</span>':''}</div>
        <div class="atk-actions">
          <button class="btn-icon" onclick="event.stopPropagation();openWeaponModal('${w.id}')">✏️</button>
          <button class="btn-icon" onclick="event.stopPropagation();deleteWeapon('${w.id}')">🗑️</button>
        </div>
      </div>
      <div class="atk-line">
        <span class="ico">⚔</span><span class="lbl">Acerto:</span>
        <span class="val">${fmtMod(normal.toHit)}</span>
        ${calcTapHTML('watk-'+w.id,normal.toHit,'d20',true,w.name+' — Ataque')}
      </div>
      <div class="atk-line">
        <span class="ico">💥</span><span class="lbl">Dano:</span>
        <span class="val">${normal.damage}</span>
        ${calcTapHTML('wdmg-'+w.id,normal.flatBonus,normal.diceStr,false,w.name+' — Dano')}
      </div>
      <div class="atk-line crit-line">
        <span class="ico">⭐</span><span class="lbl">Crítico:</span>
        <span class="val">${crit.damage}</span>
        ${calcTapHTML('wcrit-'+w.id,crit.flatBonus,crit.diceStr,false,w.name+' — CRÍTICO',true)}
      </div>
      ${w.props?`<div class="atk-props">${esc(w.props)}</div>`:''}
    </div>`;
  }).join('')+`<button class="btn-add" onclick="openWeaponModal()">+ Nova Arma</button>`;
}
export function beastStatBlock(b){
  const attrGrid=Object.keys(ATTR_NAMES).map(k=>{
    const s=b.attrs[k]!==undefined?b.attrs[k]:10;
    return `<div class="beast-ab"><div class="n">${ATTR_NAMES[k]}</div>
      <div class="s">${s}</div><div class="m">${fmtMod(getMod(s))}</div></div>`;
  }).join('');
  const skillList=Object.keys(b.skills||{}).map(k=>{
    const s=SKILLS[k];if(!s)return '';
    const base=getMod(b.attrs[s.attr]!==undefined?b.attrs[s.attr]:10);
    return `${s.name} ${fmtMod(base+2)}`;
  }).filter(Boolean).join(', ');
  const traitsHTML=(b.traits||[]).length?`<div class="beast-traits">
    ${b.traits.map(t=>`<div class="trait-item"><strong>${esc(t.name)}.</strong> ${esc(t.desc||'')}</div>`).join('')}
  </div>`:'';
  const beastKey=state.activeBeast;
  const attacksHTML=b.attacks.map((atk,i)=>{
    const normal=calcBeastAttack(b,atk,false);
    const crit=calcBeastAttack(b,atk,true);
    return `<div class="beast-attack-block">
      <div class="beast-atk-title">${esc(atk.name)}${atk.reach?` <span style="font-size:10px;color:var(--ink-dim);font-weight:400">(${esc(atk.reach)})</span>`:''}</div>
      <div class="atk-line">
        <span class="ico">⚔</span><span class="lbl">Acerto:</span>
        <span class="val">${fmtMod(normal.toHit)}</span>
        ${calcTapHTML('batk-'+beastKey+'-'+i,normal.toHit,'d20',true,`${b.name} — ${atk.name}`)}
      </div>
      <div class="atk-line">
        <span class="ico">💥</span><span class="lbl">Dano:</span>
        <span class="val">${normal.damage}</span>
        ${calcTapHTML('bdmg-'+beastKey+'-'+i,normal.dmgMod,normal.diceStr,false,`${b.name} — ${atk.name} dano`)}
      </div>
      <div class="atk-line crit-line">
        <span class="ico">⭐</span><span class="lbl">Crítico:</span>
        <span class="val">${crit.damage}</span>
        ${calcTapHTML('bcrit-'+beastKey+'-'+i,crit.dmgMod,crit.diceStr,false,`${b.name} — ${atk.name} CRÍTICO`,true)}
      </div>
      ${atk.extra?`<div style="font-size:10px;color:var(--ink-soft);font-style:italic;margin-top:3px;">${esc(atk.extra)}</div>`:''}
    </div>`;
  }).join('');
  return `<div class="beast-meta">
      <strong>CR ${esc(b.cr)}</strong> • CA ${b.ca} • HP ${b.hp} • Desloc. ${fmtSpeed(b)}
    </div>
    <div class="beast-abilities">${attrGrid}</div>
    ${skillList?`<div class="beast-info"><strong>Perícias:</strong> ${skillList}</div>`:''}
    ${b.senses?`<div class="beast-info"><strong>Sentidos:</strong> ${esc(b.senses)}</div>`:''}
    ${traitsHTML}
    ${b.multiattack?`<div class="beast-info" style="color:var(--green)"><strong>Multiataque:</strong> ${esc(b.multiattack)}</div>`:''}
    <div class="beast-attacks">${attacksHTML}</div>`;
}
export function renderActiveBeast(){
  const b=state.beasts[state.activeBeast];
  if(!b)return '<div class="empty">Fera não definida.</div>';
  return `<div class="beast-card active">
    <div class="beast-header">
      <div class="beast-name">${esc(b.name)} <span class="atk-tag">Ativa</span></div>
      <span style="font-family:var(--serif);font-weight:700;color:var(--green);font-size:14px">HP ${state.wildHp.current}/${state.wildHp.max}</span>
    </div>
    ${beastStatBlock(b)}
  </div>`;
}
export function renderSavesSkills(){
  const saves=Object.keys(ATTR_NAMES).map(k=>{
    const total=getSaveTotal(k);const prof=state.saves[k];
    return `<div class="stat-row ${prof?'prof':''}">
      <label class="stat-toggle">
        <input type="checkbox" ${prof?'checked':''} onchange="toggleSave('${k}')">
        <span class="stat-bonus">${fmtMod(total)}</span>
        <span class="stat-name">${ATTR_FULL[k]}</span>
        <span class="stat-attr">${ATTR_NAMES[k]}</span>
      </label>
      ${calcTapHTML('save-'+k,total,'d20',true,`Resist. ${ATTR_FULL[k]}`)}
    </div>`;
  }).join('');
  const skills=Object.keys(SKILLS).map(k=>{
    const s=SKILLS[k];const total=getSkillTotal(k);const prof=state.skills[k];
    return `<div class="stat-row ${prof?'prof':''}">
      <label class="stat-toggle">
        <input type="checkbox" ${prof?'checked':''} onchange="toggleSkill('${k}')">
        <span class="stat-bonus">${fmtMod(total)}</span>
        <span class="stat-name">${esc(s.name)}</span>
        <span class="stat-attr">${ATTR_NAMES[s.attr]}</span>
      </label>
      ${calcTapHTML('skill-'+k,total,'d20',true,s.name)}
    </div>`;
  }).join('');
  return `<div class="panel ${panelState.savesSkills?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('savesSkills')">📊 Resistências e Perícias</div>
    <div class="panel-body">
      <div class="saves-skills-grid">
        <div><div class="sub-title">Testes de Resistência</div>${saves}</div>
        <div><div class="sub-title">Perícias</div>${skills}</div>
      </div>
      <p class="helper">Toque em ? para inserir o resultado. Auto-limpa após 8s. Histórico em 📜.</p>
    </div>
  </div>`;
}
export function renderFeatures(){
  const features=hasDruidLevels()?state.features:state.features.filter(f=>f.id!=='f5'&&f.id!=='f6');
  const cards=features.map(f=>{
    let usesHTML='';
    if(f.uses){
      const low=f.uses.current<=0?'low':'';
      const rt=f.recharge==='short'?'<span class="recharge-tag recharge-short">curto</span>':
               f.recharge==='long'?'<span class="recharge-tag recharge-long">longo</span>':'';
      usesHTML=`<div class="feature-uses">
        <button class="btn-use" onclick="spendFeatureUse('${f.id}')" ${f.uses.current<=0?'disabled':''}>−</button>
        <span class="num ${low}">${f.uses.current}/${f.uses.max}</span>
        <button class="btn-use" onclick="refundFeatureUse('${f.id}')" ${f.uses.current>=f.uses.max?'disabled':''}>+</button>
        ${rt}</div>`;
    }
    const totemTag=(f.totemBear||f.id==='f4')?'<span class="feature-totem-tag">🐾 totem</span>':'';
    return `<div class="feature-card">
      <div class="feature-header">
        <div class="feature-name">${esc(f.name)}${totemTag}</div>
        <span class="feature-source">${esc(f.source||'')}</span>
        <button class="btn-icon" onclick="openFeatureModal('${f.id}')">✏️</button>
      </div>
      ${usesHTML}
      <div class="feature-desc">${esc(f.desc||'')}</div>
    </div>`;
  }).join('');
  return `<div class="panel ${panelState.features?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('features')">✨ Habilidades</div>
    <div class="panel-body">
      ${cards||'<div class="empty">Nenhuma habilidade</div>'}
      <button class="btn-add" onclick="openFeatureModal()">+ Nova Habilidade</button>
    </div>
  </div>`;
}
export function renderFeats(){
  const cards=state.feats.map(f=>{
    let usesHTML='';
    if(f.uses){
      const low=f.uses.current<=0?'low':'';
      const rt=f.recharge==='short'?'<span class="recharge-tag recharge-short">curto</span>':
               f.recharge==='long'?'<span class="recharge-tag recharge-long">longo</span>':'';
      usesHTML=`<div class="feature-uses">
        <button class="btn-use" onclick="spendFeatUse('${f.id}')" ${f.uses.current<=0?'disabled':''}>−</button>
        <span class="num ${low}">${f.uses.current}/${f.uses.max}</span>
        <button class="btn-use" onclick="refundFeatUse('${f.id}')" ${f.uses.current>=f.uses.max?'disabled':''}>+</button>
        ${rt}</div>`;
    }
    let combatInfo='';
    if(f.combat&&(f.combat.dice||f.combat.attackBonus||f.combat.damageBonus)){
      const parts=[];
      if(f.combat.dice)parts.push(f.combat.dice+(f.combat.damageType?' '+f.combat.damageType:''));
      if(f.combat.attackBonus)parts.push(fmtMod(f.combat.attackBonus)+' acerto');
      if(f.combat.damageBonus)parts.push(fmtMod(f.combat.damageBonus)+' dano');
      const once = f.combat.oncePerTurn ? ` • 1/turno${f.usedThisTurn?' (gasto)':''}` : '';
      const activeLabel=f.combat.active
        ? '<span style="color:var(--green);font-weight:800"> • ATIVO EM COMBATE</span>'
        : '<span style="color:var(--ink-dim)"> • toque no combate para ativar</span>';
      combatInfo=`<div class="feat-combat-info ${f.combat.active?'active':''}" style="${f.usedThisTurn?'opacity:0.6':''}">
        <b>Em combate:</b> ${parts.join(' + ')}${once}${activeLabel}
      </div>`;
    }
    let damageBtn='';
    if(f.damage){
      damageBtn=`<button class="btn-roll-feat" onclick="openPoisonNumpad('${f.id}')">🎲 Rolar ${f.damage} ${f.damageType||''} (avulso)</button>`;
    }
    return `<div class="feature-card feat-card">
      <div class="feature-header">
        <div class="feature-name">${esc(f.name)}<span class="feat-tag">🌟 ${esc(f.source||'Talento')}</span></div>
        <button class="btn-icon" onclick="openFeatModal('${f.id}')">✏️</button>
      </div>
      ${usesHTML}
      <div class="feature-desc" style="white-space:pre-line">${esc(f.desc||'')}</div>
      ${combatInfo}
      ${damageBtn}
    </div>`;
  }).join('');
  return `<div class="panel ${panelState.feats?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('feats')">🌟 Talentos</div>
    <div class="panel-body">
      ${cards||'<div class="empty">Nenhum talento</div>'}
      <button class="btn-add" onclick="openFeatModal()">+ Novo Talento</button>
    </div>
  </div>`;
}
export function renderSpells(){
  const dc=getSpellDC(),atk=getSpellAtk();
  const cantrips=state.spells.filter(s=>s.level===0);
  const byLevel={};
  state.spells.filter(s=>s.level>0).forEach(s=>{
    if(!byLevel[s.level])byLevel[s.level]=[];
    byLevel[s.level].push(s);
  });
  const renderSpell=(sp)=>{
    const dmgLine=sp.damage&&sp.damageType?`<strong>${sp.damage} ${sp.damageType}</strong>`:'';
    let combatInfo='';
    if(sp.attackType==='spell')combatInfo=`<div class="spell-combat">⚔ Ataque mágico: ${fmtMod(atk)} • 💥 ${dmgLine}</div>`;
    else if(sp.attackType==='melee')combatInfo=`<div class="spell-combat">⚔ Corpo a corpo • 💥 ${dmgLine}</div>`;
    else if(sp.attackType==='save')combatInfo=`<div class="spell-combat">🛡 CD ${dc} (${ATTR_NAMES[sp.saveAbility].toUpperCase()})${dmgLine?' • 💥 '+dmgLine:''}</div>`;
    else if(dmgLine)combatInfo=`<div class="spell-combat">💥 ${dmgLine}</div>`;
    const isFeat=sp.source==='feat';
    const atkRow=(sp.attackType==='spell'||sp.attackType==='melee')?
      `<div class="atk-line"><span class="ico">⚔</span><span class="lbl">Acerto:</span>
        <span class="val">${fmtMod(atk)}</span>
        ${calcTapHTML('spatk-'+sp.id,atk,'d20',true,`${sp.name} — Ataque`)}</div>`:'';
    let dmgRow='';
    if(sp.damage){
      const normalCalc = calcSpellDamageStr(sp,false);
      const isCure = sp.damageType==='cura';
      dmgRow=`<div class="atk-line">
        <span class="ico">${isCure?'💚':'💥'}</span>
        <span class="lbl">${isCure?'Cura':'Dano'}:</span>
        <span class="val">${normalCalc.damage}</span>
        ${calcTapHTML('spdmg-'+sp.id,normalCalc.dmgMod,normalCalc.diceStr,false,`${sp.name} — ${isCure?'Cura':'Dano'}`)}
      </div>`;
    }
    let critRow='';
    const canCrit = sp.damage && sp.damageType!=='cura' && (sp.attackType==='spell'||sp.attackType==='melee');
    if(canCrit){
      const critCalc = calcSpellDamageStr(sp,true);
      critRow=`<div class="atk-line crit-line">
        <span class="ico">⭐</span>
        <span class="lbl">Crítico:</span>
        <span class="val">${critCalc.damage}</span>
        ${calcTapHTML('spcrit-'+sp.id,critCalc.dmgMod,critCalc.diceStr,false,`${sp.name} — CRÍTICO`,true)}
      </div>`;
    }
    return `<div class="spell-card${isFeat?' feat-spell':''}">
      <div class="spell-header">
        <div class="spell-name">${esc(sp.name)}</div>
        <span class="spell-level${isFeat?' feat':''}">${isFeat?'🌟 '+(sp.level===0?'Truque':'Nv '+sp.level):(sp.level===0?'Truque':'Nv '+sp.level)}</span>
        <button class="btn-icon" onclick="openSpellModal('${sp.id}')">✏️</button>
      </div>
      <div class="spell-meta">
        <span><strong>${esc(sp.school||'—')}</strong></span>
        <span>${esc(sp.castTime||'')}</span>
        <span>${esc(sp.range||'')}</span>
      </div>
      <div class="spell-meta">
        <span>${esc(sp.components||'—')}</span>
        <span>${esc(sp.duration||'')}</span>
      </div>
      ${combatInfo}
      ${atkRow}
      ${dmgRow}
      ${critRow}
      <div class="spell-desc">${esc(sp.description||'')}</div>
    </div>`;
  };
  let spellsHTML='';
  Object.keys(byLevel).sort((a,b)=>a-b).forEach(lvl=>{
    spellsHTML+=`<div class="sub-title">Nível ${lvl}</div>`+byLevel[lvl].map(renderSpell).join('');
  });
  const emptyMsg = state.spells.length===0 ? '<div class="empty">Nenhuma magia cadastrada. Toque em "+ Nova Magia" para adicionar.</div>' : '';
  return `<div class="panel ${panelState.spells?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('spells')">🔮 Magias</div>
    <div class="panel-body">
      <div class="scenario" style="margin-bottom:10px">
        <div class="scenario-title">Conjuração (${ATTR_NAMES[state.spellcasting.ability]})</div>
        <div class="scenario-row"><span class="k">CD de Magia</span><span class="v hot">${dc}</span></div>
        <div class="scenario-row"><span class="k">Ataque Mágico</span><span class="v hot">${fmtMod(atk)}</span></div>
      </div>
      ${emptyMsg}
      ${cantrips.length?`<div class="sub-title">Truques</div>`+cantrips.map(renderSpell).join(''):''}
      ${spellsHTML}
      <button class="btn-add" onclick="openSpellModal()">+ Nova Magia</button>
    </div>
  </div>`;
}
export function renderForms(){
  if(!hasDruidLevels())return '';
  const cards=Object.keys(state.beasts).map(key=>{
    const b=state.beasts[key];const isActive=key===state.activeBeast;
    return `<div class="beast-card ${isActive?'active':''}">
      <div class="beast-header">
        <div class="beast-name" onclick="selectBeast('${key}')">${esc(b.name)}${isActive?'<span class="atk-tag">Ativa</span>':''}</div>
        <div class="atk-actions">
          <button class="btn-icon" onclick="openBeastModal('${key}')">✏️</button>
          <button class="btn-icon" onclick="deleteBeast('${key}')">🗑️</button>
        </div>
      </div>
      ${beastStatBlock(b)}
    </div>`;
  }).join('');
  return `<div class="panel ${panelState.forms?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('forms')">🐻 Formas Selvagens</div>
    <div class="panel-body">
      <p class="helper">Toque no nome para ativar.</p>
      ${cards||'<div class="empty">Nenhuma forma</div>'}
      <button class="btn-add" onclick="openBeastModal()">+ Nova Forma</button>
    </div>
  </div>`;
}
export function renderInventory(){
  const wildActive=isWild();
  const cards=state.inventory.map(it=>{
    const avail=isItemAvailable(it);const showBadge=wildActive;
    return `<div class="inv-card ${it.reminder?'reminder-on':''} ${!avail&&wildActive?'unavailable-wild':''}">
      <div style="flex:1;min-width:0">
        <div class="inv-name">${esc(it.name)}
          ${showBadge?`<span class="inv-wild-badge ${avail?'':'no'}">${avail?'✓ forma':'🚫 forma'}</span>`:''}
        </div>
        <div class="inv-desc">${esc(it.desc||'')}${it.weight?` • ${((it.qty||0)*(it.weight||0)).toFixed(1)} lbs`:''}</div>
        ${it.reminder&&it.reminderNote?`<div class="inv-note">🔔 ${esc(it.reminderNote)}</div>`:''}
      </div>
      <div style="display:flex;gap:2px;align-items:center;flex-shrink:0">
        <button class="btn-wild-toggle ${it.availableInWild?'on':''}" onclick="toggleItemWild('${it.id}')">${it.availableInWild?'🐻':'🚫'}</button>
        <button class="btn-reminder ${it.reminder?'on':''}" onclick="toggleReminder('${it.id}')">${it.reminder?'🔔':'🔕'}</button>
        <span class="inv-qty">×${it.qty}</span>
        <button class="btn-icon" onclick="openInvModal('${it.id}')">✏️</button>
        <button class="btn-icon" onclick="deleteInv('${it.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
  const totalWeight=state.inventory.reduce((s,i)=>s+(i.qty||0)*(i.weight||0),0);
  const capacity=state.attrs.str*15;const over=totalWeight>capacity;
  const emptyMsg = state.inventory.length===0 ? '<div class="empty">Inventário vazio. Toque em "+ Novo Item" para adicionar.</div>' : '';
  return `<div class="panel ${panelState.inventory?'collapsed':''}">
    <div class="panel-title" onclick="togglePanelKey('inventory')">🎒 Inventário</div>
    <div class="panel-body">
      ${emptyMsg}
      ${cards}
      <button class="btn-add" onclick="openInvModal()">+ Novo Item</button>
      <div class="inv-total ${over?'inv-over':''}">Peso: <strong>${totalWeight.toFixed(1)}</strong> / ${capacity} lbs</div>
    </div>
  </div>`;
}
export function renderAll(){
  document.body.className='mode-'+(state.situation||'combat');
  const sit=state.situation||'combat';
  let content='';
  content+=renderCharTabs()+renderHeader()+renderSituationBar();
  if(sit==='rest'){
    content+=renderRestPanel()+renderStatsBar()+renderReminders()+renderSpellSlots()+
      renderAbilities()+renderCombat()+renderConditions()+renderSavesSkills()+renderFeatures()+renderFeats()+
      renderSpells()+renderForms()+renderInventory();
  }else if(sit==='exploration'){
    content+=renderStatsBar()+renderAbilities()+renderSavesSkills()+renderReminders()+
      renderSpellSlots()+renderCombat()+renderConditions()+renderFeatures()+renderFeats()+renderSpells()+renderForms()+renderInventory();
  }else{
    content+=renderReminders()+renderStatsBar()+renderAbilities()+renderSpellSlots()+
      renderCombat()+renderConditions()+renderSavesSkills()+renderFeatures()+renderFeats()+renderSpells()+renderForms()+renderInventory();
  }
  document.getElementById('app').innerHTML=content;
  Object.keys(calcValues).forEach(target=>updateInlineResult(target));
  updateFab();
}

export function togglePanelKey(key){panelState[key]=!panelState[key];renderAll();}
export function collapsePanel(name){togglePanelKey(name);}
export function toggleEffect(id){
  const e=state.effects.find(x=>x.id===id);if(!e)return;
  const feat=state.features.find(f=>f.name===e.name);
  if(!e.active){
    if(feat&&feat.uses){
      if(feat.uses.current<=0){showToast(`Sem usos de ${feat.name}. Use um descanso.`);return;}
      feat.uses.current--;
    }
    e.active=true;
    if(id==='rage'&&hasTotemBear())showToast('🔥 Fúria — 🐾 resistência a tudo exceto psíquico');
    if(id==='wild'){
      const b=state.beasts[state.activeBeast];
      if(b){state.wildHp={current:b.hp,max:b.hp};showToast(`🐻 Forma Selvagem: ${b.name} (${b.hp} HP)`);}
    }
  }else{
    e.active=false;
    if(id==='wild'){
      const remaining=state.wildHp.current;
      state.wildHp={current:0,max:0};
      showToast(remaining>0?`👤 Forma revertida (HP humano: ${state.hp.current}/${state.hp.max})`:'👤 Forma revertida');
    }
  }
  renderAll();save();
}
export function toggleSave(k){state.saves[k]=!state.saves[k];renderAll();save();}
export function toggleSkill(k){state.skills[k]=!state.skills[k];renderAll();save();}
export function selectWeapon(id){
  if(isWild())return showToast('Desative Forma Selvagem primeiro');
  state.weapons.forEach(w=>w.active=w.id===id);
  renderAll();save();
}
export function toggleWeapon(id){selectWeapon(id);}
export function selectBeast(key){
  if(isWild()&&state.wildHp.current>0){
    if(!confirm(`Trocar para ${state.beasts[key].name}? Wild HP será resetado para ${state.beasts[key].hp}.`))return;
    state.wildHp={current:state.beasts[key].hp,max:state.beasts[key].hp};
  }
  state.activeBeast=key;renderAll();save();
}
export function setActiveBeast(key){selectBeast(key);}

let modalCtx=null;
export function openModal(title,bodyHTML,onSave){
  modalCtx={onSave};
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=bodyHTML;
  document.getElementById('modalFooter').innerHTML=`
    <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
    <button class="btn-save" onclick="saveModal()">Salvar</button>`;
  document.getElementById('modalOverlay').classList.add('show');
  document.body.style.overflow='hidden';
  updateFab();
}
export function closeModal(){
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow='';modalCtx=null;
  updateFab();
}
export function saveModal(){
  if(!modalCtx||!modalCtx.onSave)return;
  const data={};
  document.querySelectorAll('#modalBody [name]').forEach(el=>{data[el.name]=el.value;});
  document.querySelectorAll('#modalBody [name][type=checkbox]').forEach(el=>{data[el.name]=el.checked;});
  document.querySelectorAll('#modalBody [name][type=radio]:checked').forEach(el=>{data[el.name]=el.value;});
  document.querySelectorAll('#modalBody .num-field[data-target]').forEach(el=>{
    data[el.dataset.target]=el.dataset.value;
  });
  modalCtx.onSave(data);
  closeModal();
}

export function openCAModal(){
  const ac=getACBreakdown();const unarmored=getUnarmoredAC();
  const b=isWild()?state.beasts[state.activeBeast]:null;
  const beastUA=b?getBeastUnarmoredAC(b):null;const beastCA=b?(b.ca||10):null;
  const mode=state.caWildMode||'auto';
  let breakdownHTML='';
  if(isWild()&&b){
    breakdownHTML=`<div class="ca-info-row"><span class="k">CA da Fera (${esc(b.name)})</span><span class="v ${mode==='beast'?'hot':''}">${beastCA}</span></div>
      <div class="ca-info-row"><span class="k">UA da Fera</span><span class="v ${mode==='unarmored'?'hot':''}">${beastUA}</span></div>
      <div class="ca-info-row"><span class="k">Base usada</span><span class="v hot">${ac.base}</span></div>`;
  }else{
    if(state.caOverride>0)breakdownHTML=`<div class="ca-info-row"><span class="k">CA Manual</span><span class="v hot">${state.caOverride}</span></div>`;
    else breakdownHTML=`<div class="ca-info-row"><span class="k">Defesa sem Armadura</span><span class="v hot">10 + ${fmtMod(getAttrMod('dex'))} + ${fmtMod(getAttrMod('con'))} = ${unarmored}</span></div>`;
  }
  const wildSection=isWild()?`<div class="modal-sub">Modo de CA na Forma</div>
    <div class="radio-group">
      <label class="radio-option ${mode==='auto'?'checked':''}">
        <input type="radio" name="wildMode" value="auto" ${mode==='auto'?'checked':''}>
        <span class="radio-label">Automático (maior)</span><span class="radio-desc">${Math.max(beastCA,beastUA)}</span></label>
      <label class="radio-option ${mode==='beast'?'checked':''}">
        <input type="radio" name="wildMode" value="beast" ${mode==='beast'?'checked':''}>
        <span class="radio-label">CA da Fera</span><span class="radio-desc">${beastCA}</span></label>
      <label class="radio-option ${mode==='unarmored'?'checked':''}">
        <input type="radio" name="wildMode" value="unarmored" ${mode==='unarmored'?'checked':''}>
        <span class="radio-label">UA da Fera</span><span class="radio-desc">${beastUA}</span></label>
    </div>`:'';
  const overrideSection=isWild()?`<p class="helper" style="margin:8px 0;">Na Forma Selvagem, use os modificadores da fera.</p>`:
    `<div class="field"><label>CA Manual (0 = automático)</label><input type="number" name="override" value="${state.caOverride||0}" min="0"></div>`;
  const html=`
    <div class="ca-info"><div class="ca-info-title">Cálculo Atual ${isWild()?'— 🐻 Forma':''}</div>
      ${breakdownHTML}
      <div class="ca-info-row"><span class="k">Bônus de CA</span><span class="v">${ac.bonus>=0?'+':''}${ac.bonus}</span></div>
      <div class="ca-info-total"><span>Total</span><span class="v">${ac.total}</span></div></div>
    ${overrideSection}${wildSection}
    <div class="field" style="margin-top:14px"><label>Bônus de CA</label>
      <input type="number" name="bonus" value="${state.caBonus||0}"></div>`;
  openModal('Editar CA',html,data=>{
    if(!isWild())state.caOverride=Math.max(0,parseInt(data.override)||0);
    if(data.wildMode)state.caWildMode=data.wildMode;
    state.caBonus=parseInt(data.bonus)||0;
    renderAll();save();showToast('✓ CA atualizada');
  });
}

export let modalClasses=[];
export function openCharModal(){
  modalClasses.length=0;modalClasses.push(...JSON.parse(JSON.stringify(state.character.classes)));
  const a=state.attrs;
  const html=`
    <div class="modal-sub" style="margin-top:0;padding-top:0;border-top:none;">Identidade</div>
    <div class="field-row">
      <div class="field"><label>Nome</label><input name="name" value="${esc(state.character.name)}"></div>
      <div class="field"><label>Raça</label><input name="race" value="${esc(state.character.race||'')}"></div>
    </div>
    <div class="modal-sub">Classes</div>
    <div class="class-list" id="modalClassList"></div>
    <button type="button" class="btn-add" onclick="modalAddClass()">+ Adicionar Classe</button>
    <div class="modal-sub">Combate</div>
    <div class="field-row-3">
      <div class="field"><label>HP Máx</label>
        <div class="num-field" data-target="hpMax" data-min="1" data-max="999" data-value="${state.hp.max}" data-label="HP Máximo" data-chips="20,40,60,80" onclick="openNumberEditor(this)">${state.hp.max}</div>
      </div>
      <div class="field"><label>HP Atual</label>
        <div class="num-field" data-target="hpCur" data-min="0" data-max="999" data-value="${state.hp.current}" data-label="HP Atual" data-chips="10,20,30,40" onclick="openNumberEditor(this)">${state.hp.current}</div>
      </div>
      <div class="field"><label>Desloc. (m)</label>
        <div class="num-field" data-target="speed" data-min="0" data-max="60" data-value="${state.speed||9}" data-label="Deslocamento" data-chips="6,9,12,15" onclick="openNumberEditor(this)">${state.speed||9}</div>
      </div>
    </div>
    <div class="field-row-3">
      <div class="field"><label>DVs Máx</label>
        <div class="num-field" data-target="hdMax" data-min="1" data-max="20" data-value="${state.hitDice.max}" data-label="Dados de Vida Máx" data-chips="3,5,8,10" onclick="openNumberEditor(this)">${state.hitDice.max}</div>
      </div>
      <div class="field"><label>DVs Atuais</label>
        <div class="num-field" data-target="hdCur" data-min="0" data-max="20" data-value="${state.hitDice.current}" data-label="Dados de Vida Atuais" data-chips="0,1,3,5" onclick="openNumberEditor(this)">${state.hitDice.current}</div>
      </div>
      <div class="field"><label>Tipo</label>
        <select name="hitDieSize">
          <option value="6" ${state.hitDieSize===6?'selected':''}>d6</option>
          <option value="8" ${state.hitDieSize===8?'selected':''}>d8</option>
          <option value="10" ${state.hitDieSize===10?'selected':''}>d10</option>
          <option value="12" ${state.hitDieSize===12?'selected':''}>d12</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>CA Manual (0 = auto)</label>
        <div class="num-field" data-target="caOverride" data-min="0" data-max="30" data-value="${state.caOverride||0}" data-label="CA Manual" data-chips="10,12,14,16" onclick="openNumberEditor(this)">${state.caOverride||0}</div>
      </div>
      <div class="field"><label>Bônus de CA</label>
        <div class="num-field" data-target="caBonus" data-min="0" data-max="10" data-value="${state.caBonus||0}" data-label="Bônus CA" data-chips="0,1,2,3" onclick="openNumberEditor(this)">${state.caBonus||0}</div>
      </div>
    </div>
    <div class="modal-sub">Atributos</div>
    <div class="field-row-3">
      <div class="field"><label>FOR</label>
        <div class="num-field" data-target="attrStr" data-min="0" data-max="30" data-value="${a.str}" data-label="Força" data-chips="8,12,16,20" onclick="openNumberEditor(this)">${a.str}</div>
      </div>
      <div class="field"><label>DES</label>
        <div class="num-field" data-target="attrDex" data-min="0" data-max="30" data-value="${a.dex}" data-label="Destreza" data-chips="8,12,16,20" onclick="openNumberEditor(this)">${a.dex}</div>
      </div>
      <div class="field"><label>CON</label>
        <div class="num-field" data-target="attrCon" data-min="0" data-max="30" data-value="${a.con}" data-label="Constituição" data-chips="8,12,16,20" onclick="openNumberEditor(this)">${a.con}</div>
      </div>
    </div>
    <div class="field-row-3">
      <div class="field"><label>INT</label>
        <div class="num-field" data-target="attrInt" data-min="0" data-max="30" data-value="${a.int}" data-label="Inteligência" data-chips="8,12,16,20" onclick="openNumberEditor(this)">${a.int}</div>
      </div>
      <div class="field"><label>SAB</label>
        <div class="num-field" data-target="attrWis" data-min="0" data-max="30" data-value="${a.wis}" data-label="Sabedoria" data-chips="8,12,16,20" onclick="openNumberEditor(this)">${a.wis}</div>
      </div>
      <div class="field"><label>CAR</label>
        <div class="num-field" data-target="attrCha" data-min="0" data-max="30" data-value="${a.cha}" data-label="Carisma" data-chips="0,8,12,16" onclick="openNumberEditor(this)">${a.cha}</div>
      </div>
    </div>
    <div class="modal-sub">Conjuração</div>
    <div class="field"><label>Atributo</label>
      <select name="spellAbility">
        <option value="int" ${state.spellcasting.ability==='int'?'selected':''}>INT</option>
        <option value="wis" ${state.spellcasting.ability==='wis'?'selected':''}>SAB</option>
        <option value="cha" ${state.spellcasting.ability==='cha'?'selected':''}>CAR</option>
      </select></div>`;
  openModal('Editar Personagem',html,data=>{
    state.character.name=(data.name||'').trim()||'Sem Nome';
    state.character.race=(data.race||'').trim();
    state.character.classes=modalClasses.filter(c=>c.name&&c.level);
    if(!state.character.classes.length)state.character.classes=[{name:'Bárbaro',level:1}];
    state.hp.max=Math.max(1,parseInt(data.hpMax)||1);
    state.hp.current=Math.max(0,Math.min(state.hp.max,parseInt(data.hpCur)||0));
    state.hitDice.max=Math.max(1,parseInt(data.hdMax)||1);
    state.hitDice.current=Math.max(0,Math.min(state.hitDice.max,parseInt(data.hdCur)||0));
    state.hitDieSize=parseInt(data.hitDieSize)||12;
    state.speed=parseFloat(data.speed)||9;
    state.caOverride=Math.max(0,parseInt(data.caOverride)||0);
    state.caBonus=Math.max(0,parseInt(data.caBonus)||0);
    ['str','dex','con','int','wis','cha'].forEach(k=>{
      const key='attr'+k[0].toUpperCase()+k.slice(1);
      state.attrs[k]=Math.max(0,Math.min(30,parseInt(data[key])||0));
    });
    state.spellcasting.ability=data.spellAbility||'wis';
    renderAll();save();showToast('✓ Ficha atualizada');
  });
  renderModalClasses();
}
export function renderModalClasses(){
  const el=document.getElementById('modalClassList');if(!el)return;
  el.innerHTML='';
  modalClasses.forEach((c,i)=>{
    const d=document.createElement('div');d.className='class-item';
    d.innerHTML=`<input class="class-name" type="text" value="${esc(c.name)}" oninput="modalClasses[${i}].name=this.value">
      <div class="num-field" data-callback="classLevel" data-index="${i}" data-min="1" data-max="20" data-value="${c.level}" data-label="Nível da ${esc(c.name||'classe')}" onclick="openNumberEditor(this)">${c.level}</div>
      <button type="button" class="btn-remove" onclick="modalRemoveClass(${i})">×</button>`;
    el.appendChild(d);
  });
}
export function modalAddClass(){modalClasses.push({name:'Nova',level:1});renderModalClasses();}
export function modalRemoveClass(i){modalClasses.splice(i,1);if(!modalClasses.length)modalClasses.push({name:'Nova',level:1});renderModalClasses();}

export function openWeaponModal(id){
  const w=id?state.weapons.find(x=>x.id===id):{name:'',die:'1d6',magic:0,flat:0,extraDice:'',extraType:'',attr:'str',props:''};
  const html=`
    <div class="field"><label>Nome</label><input name="name" value="${esc(w.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Dado</label><input name="die" value="${esc(w.die)}"></div>
      <div class="field"><label>Atributo</label>
        <select name="attr"><option value="str" ${w.attr==='str'?'selected':''}>FOR</option><option value="dex" ${w.attr==='dex'?'selected':''}>DES</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Bônus Mágico</label><input type="number" name="magic" value="${w.magic||0}"></div>
      <div class="field"><label>Bônus Fixo</label><input type="number" name="flat" value="${w.flat||0}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Dado Extra</label><input name="extraDice" value="${esc(w.extraDice||'')}"></div>
      <div class="field"><label>Tipo</label><input name="extraType" value="${esc(w.extraType||'')}"></div>
    </div>
    <div class="field"><label>Propriedades</label><input name="props" value="${esc(w.props||'')}"></div>`;
  openModal(id?'Editar Arma':'Nova Arma',html,data=>{
    const newW={id:id||'w_'+Date.now(),name:data.name||'Arma',die:data.die||'1d6',
      magic:parseInt(data.magic)||0,flat:parseInt(data.flat)||0,extraDice:data.extraDice||'',
      extraType:data.extraType||'',attr:data.attr||'str',props:data.props||'',
      active:id?w.active:state.weapons.length===0};
    if(id){const i=state.weapons.findIndex(x=>x.id===id);state.weapons[i]=newW;}
    else{if(newW.active)state.weapons.forEach(x=>x.active=false);state.weapons.push(newW);}
    renderAll();save();showToast('✓ Arma salva');
  });
}
export function openSpellModal(id){
  const s=id?state.spells.find(x=>x.id===id):{name:'',level:0,school:'Evocação',castTime:'1 ação',range:'9 m',components:'V, S',duration:'Instantânea',attackType:'',saveAbility:'dex',damage:'',damageType:'',damageMod:0,description:''};
  const html=`
    <div class="field-row">
      <div class="field"><label>Nome</label><input name="name" value="${esc(s.name)}"></div>
      <div class="field"><label>Nível</label><input type="number" name="level" value="${s.level}" min="0" max="9"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Escola</label>
        <select name="school">${['Abjuração','Adivinhação','Conjuração','Encantamento','Evocação','Ilusão','Necromancia','Transmutação'].map(sc=>`<option value="${sc}" ${s.school===sc?'selected':''}>${sc}</option>`).join('')}</select></div>
      <div class="field"><label>Tempo</label><input name="castTime" value="${esc(s.castTime||'')}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Alcance</label><input name="range" value="${esc(s.range||'')}"></div>
      <div class="field"><label>Componentes</label><input name="components" value="${esc(s.components||'')}"></div>
    </div>
    <div class="field"><label>Duração</label><input name="duration" value="${esc(s.duration||'')}"></div>
    <div class="modal-sub">Combate</div>
    <div class="field-row">
      <div class="field"><label>Tipo</label>
        <select name="attackType">
          <option value="" ${!s.attackType?'selected':''}>Nenhum</option>
          <option value="spell" ${s.attackType==='spell'?'selected':''}>Ataque Mágico</option>
          <option value="melee" ${s.attackType==='melee'?'selected':''}>Corpo a Corpo</option>
          <option value="save" ${s.attackType==='save'?'selected':''}>Teste de Resistência</option>
        </select></div>
      <div class="field"><label>Atributo</label>
        <select name="saveAbility">${['str','dex','con','int','wis','cha'].map(k=>`<option value="${k}" ${s.saveAbility===k?'selected':''}>${ATTR_NAMES[k]}</option>`).join('')}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Dano/Cura</label><input name="damage" value="${esc(s.damage||'')}"></div>
      <div class="field"><label>Tipo</label><input name="damageType" value="${esc(s.damageType||'')}"></div>
    </div>
    <div class="field"><label>Bônus Fixo (ex: SAB)</label><input type="number" name="damageMod" value="${s.damageMod||0}"></div>
    <div class="field"><label>Descrição</label><textarea name="description">${esc(s.description||'')}</textarea></div>`;
  openModal(id?'Editar Magia':'Nova Magia',html,data=>{
    const newS={id:id||'sp_'+Date.now(),name:data.name||'Magia',level:parseInt(data.level)||0,
      school:data.school||'',castTime:data.castTime||'',range:data.range||'',
      components:data.components||'',duration:data.duration||'',
      attackType:data.attackType||'',saveAbility:data.saveAbility||'dex',
      damage:data.damage||'',damageType:data.damageType||'',damageMod:parseInt(data.damageMod)||0,
      description:data.description||'',source:id?(state.spells.find(x=>x.id===id)?.source||undefined):undefined};
    if(id){const i=state.spells.findIndex(x=>x.id===id);state.spells[i]=newS;}
    else state.spells.push(newS);
    renderAll();save();showToast('✓ Magia salva');
  });
}
export function openFeatureModal(id){
  const f=id?state.features.find(x=>x.id===id):{name:'',source:'',desc:'',uses:null,recharge:'none'};
  const hasUses=!!f.uses;
  const html=`
    <div class="field-row">
      <div class="field"><label>Nome</label><input name="name" value="${esc(f.name)}"></div>
      <div class="field"><label>Origem</label><input name="source" value="${esc(f.source||'')}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea name="desc" style="min-height:100px">${esc(f.desc||'')}</textarea></div>
    <div class="modal-sub">Usos Limitados</div>
    <label class="checkbox-row">
      <input type="checkbox" name="hasUses" ${hasUses?'checked':''} onchange="toggleFeatureUsesFields(this.checked)">
      <span>Tem usos limitados</span>
    </label>
    <div id="featUsesFields" style="display:${hasUses?'block':'none'}">
      <div class="field-row">
        <div class="field"><label>Máx</label><input type="number" name="usesMax" value="${f.uses?.max||1}" min="1"></div>
        <div class="field"><label>Atuais</label><input type="number" name="usesCur" value="${f.uses?.current||f.uses?.max||1}" min="0"></div>
      </div>
      <div class="field"><label>Recarrega em</label>
        <select name="recharge">
          <option value="none" ${f.recharge==='none'?'selected':''}>Nunca</option>
          <option value="short" ${f.recharge==='short'?'selected':''}>Curto</option>
          <option value="long" ${f.recharge==='long'?'selected':''}>Longo</option>
        </select></div>
    </div>`;
  openModal(id?'Editar Habilidade':'Nova Habilidade',html,data=>{
    const newF={id:id||'f_'+Date.now(),name:data.name||'Habilidade',source:data.source||'',desc:data.desc||''};
    if(data.hasUses){
      const max=Math.max(1,parseInt(data.usesMax)||1);
      const cur=Math.max(0,Math.min(max,parseInt(data.usesCur)||max));
      newF.uses={current:cur,max};newF.recharge=data.recharge||'none';
    }else{newF.uses=null;newF.recharge='none';}
    if(id){const i=state.features.findIndex(x=>x.id===id);state.features[i]=newF;}
    else state.features.push(newF);
    renderAll();save();showToast('✓ Habilidade salva');
  });
}
export function toggleFeatureUsesFields(show){document.getElementById('featUsesFields').style.display=show?'block':'none';}

export function openFeatModal(id){
  const f=id?state.feats.find(x=>x.id===id):{name:'',source:'Talento',desc:'',uses:null,recharge:'none',damage:'',damageType:''};
  const hasUses=!!f.uses;
  const hasCombat=!!(f.combat&&(f.combat.dice||f.combat.attackBonus||f.combat.damageBonus));
  const combat=f.combat||{};
  const html=`
    <div class="field-row">
      <div class="field"><label>Nome</label><input name="name" value="${esc(f.name)}"></div>
      <div class="field"><label>Origem</label><input name="source" value="${esc(f.source||'Talento')}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea name="desc" style="min-height:100px">${esc(f.desc||'')}</textarea></div>
    <div class="modal-sub">Usos Limitados</div>
    <label class="checkbox-row">
      <input type="checkbox" name="hasUses" ${hasUses?'checked':''} onchange="toggleFeatUsesFields(this.checked)">
      <span>Tem usos limitados</span>
    </label>
    <div id="featUsesFields2" style="display:${hasUses?'block':'none'}">
      <div class="field-row">
        <div class="field"><label>Máx</label><input type="number" name="usesMax" value="${f.uses?.max||1}" min="1"></div>
        <div class="field"><label>Atuais</label><input type="number" name="usesCur" value="${f.uses?.current||f.uses?.max||1}" min="0"></div>
      </div>
      <div class="field"><label>Recarrega em</label>
        <select name="recharge">
          <option value="none" ${f.recharge==='none'?'selected':''}>Nunca</option>
          <option value="short" ${f.recharge==='short'?'selected':''}>Curto</option>
          <option value="long" ${f.recharge==='long'?'selected':''}>Longo</option>
        </select></div>
    </div>
    <div class="modal-sub">Efeito em Combate</div>
    <label class="checkbox-row">
      <input type="checkbox" name="hasCombat" ${hasCombat?'checked':''} onchange="toggleFeatCombatFields(this.checked)">
      <span>Este talento modifica ataques/dano em combate</span>
    </label>
    <div id="featCombatFields" style="display:${hasCombat?'block':'none'}">
      <p class="helper" style="margin:0 0 8px">Ao ativar em combate, o talento aplica os bônus abaixo ao ataque/dano.</p>
      <div class="field-row">
        <div class="field"><label>Dado de Dano Extra</label><input name="combatDice" value="${esc(combat.dice||'')}" placeholder="ex: 2d8"></div>
        <div class="field"><label>Tipo de Dano</label><input name="combatDamageType" value="${esc(combat.damageType||'')}" placeholder="veneno"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Bônus de Acerto</label><input type="number" name="combatAttackBonus" value="${combat.attackBonus||0}"></div>
        <div class="field"><label>Bônus de Dano (fixo)</label><input type="number" name="combatDamageBonus" value="${combat.damageBonus||0}"></div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" name="combatOncePerTurn" ${combat.oncePerTurn?'checked':''}>
        <span>Uma vez por turno (mostra aviso no toggle)</span>
      </label>
    </div>
    <div class="modal-sub">Dano Avulso (opcional)</div>
    <p class="helper" style="margin:0 0 6px">Use quando quiser rolar o dano separado do ataque (ex: efeito residual).</p>
    <div class="field-row">
      <div class="field"><label>Dado de Dano</label><input name="damage" value="${esc(f.damage||'')}" placeholder="ex: 2d8"></div>
      <div class="field"><label>Tipo</label><input name="damageType" value="${esc(f.damageType||'')}" placeholder="veneno"></div>
    </div>`;
  openModal(id?'Editar Talento':'Novo Talento',html,data=>{
    const newF={id:id||'feat-'+Date.now(),name:data.name||'Talento',source:data.source||'Talento',desc:data.desc||'',
      damage:data.damage||'',damageType:data.damageType||''};
    if(data.hasUses){
      const max=Math.max(1,parseInt(data.usesMax)||1);
      const cur=Math.max(0,Math.min(max,parseInt(data.usesCur)||max));
      newF.uses={current:cur,max};newF.recharge=data.recharge||'none';
    }else{newF.uses=null;newF.recharge='none';}
    if(data.hasCombat){
      const prevActive=id?(state.feats.find(x=>x.id===id)?.combat?.active||false):false;
      newF.combat={dice:data.combatDice||'',damageType:data.combatDamageType||'',
        attackBonus:parseInt(data.combatAttackBonus)||0,
        damageBonus:parseInt(data.combatDamageBonus)||0,
        oncePerTurn:!!data.combatOncePerTurn,active:prevActive};
    }else{newF.combat=null;}
    if(id){const i=state.feats.findIndex(x=>x.id===id);state.feats[i]=newF;}
    else state.feats.push(newF);
    renderAll();save();showToast('✓ Talento salvo');
  });
}
export function toggleFeatUsesFields(show){document.getElementById('featUsesFields2').style.display=show?'block':'none';}
export function toggleFeatCombatFields(show){document.getElementById('featCombatFields').style.display=show?'block':'none';}

export function openBeastModal(key){
  const src=key?state.beasts[key]:emptyBeast();
  const b=JSON.parse(JSON.stringify(src));
  const atk=b.attacks[0];
  const html=`
    <div class="field"><label>Nome</label><input name="name" value="${esc(b.name)}"></div>
    <div class="field-row-3">
      <div class="field"><label>CR</label><input name="cr" value="${esc(b.cr||'1')}"></div>
      <div class="field"><label>CA</label><input type="number" name="ca" value="${b.ca||10}"></div>
      <div class="field"><label>HP</label><input type="number" name="hp" value="${b.hp||10}"></div>
    </div>
    <div class="modal-sub">Deslocamentos (m)</div>
    <div class="field-row-3">
      <div class="field"><label>Terrestre</label><input type="number" name="speedWalk" value="${b.speedWalk||0}" step="1.5"></div>
      <div class="field"><label>Escalar</label><input type="number" name="speedClimb" value="${b.speedClimb||0}" step="1.5"></div>
      <div class="field"><label>Nadar</label><input type="number" name="speedSwim" value="${b.speedSwim||0}" step="1.5"></div>
    </div>
    <div class="field"><label>Voar</label><input type="number" name="speedFly" value="${b.speedFly||0}" step="1.5"></div>
    <div class="modal-sub">Atributos</div>
    <div class="field-row-3">
      <div class="field"><label>FOR</label><input type="number" name="bStr" value="${b.attrs.str}"></div>
      <div class="field"><label>DES</label><input type="number" name="bDex" value="${b.attrs.dex}"></div>
      <div class="field"><label>CON</label><input type="number" name="bCon" value="${b.attrs.con}"></div>
    </div>
    <div class="field-row-3">
      <div class="field"><label>INT</label><input type="number" name="bInt" value="${b.attrs.int}"></div>
      <div class="field"><label>SAB</label><input type="number" name="bWis" value="${b.attrs.wis}"></div>
      <div class="field"><label>CAR</label><input type="number" name="bCha" value="${b.attrs.cha}"></div>
    </div>
    <div class="modal-sub">Sentidos e Perícias</div>
    <div class="field"><label>Sentidos</label><input name="senses" value="${esc(b.senses||'')}"></div>
    <div class="field"><label>Perícias (vírgula)</label><input name="skillsStr" value="${Object.keys(b.skills||{}).join(', ')}"></div>
    <div class="modal-sub">Multiataque e Traços</div>
    <div class="field"><label>Multiataque</label><input name="multiattack" value="${esc(b.multiattack||'')}"></div>
    <div class="field"><label>Traços (Nome: descrição)</label>
      <textarea name="traitsStr" style="min-height:80px">${esc((b.traits||[]).map(t=>`${t.name}: ${t.desc}`).join('\n'))}</textarea></div>
    <div class="modal-sub">Ataque Principal</div>
    <div class="field"><label>Nome</label><input name="atkName" value="${esc(atk.name||'Ataque')}"></div>
    <div class="field-row-3">
      <div class="field"><label>Dado</label><input name="atkDie" value="${esc(atk.die||'1d6')}"></div>
      <div class="field"><label>Mod. Acerto</label><input type="number" name="atkMod" value="${atk.mod||0}"></div>
      <div class="field"><label>Tipo</label><input name="atkType" value="${esc(atk.type||'cortante')}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Alcance</label><input name="atkReach" value="${esc(atk.reach||'1,5m')}"></div>
      <div class="field"><label>Efeito Extra</label><input name="atkExtra" value="${esc(atk.extra||'')}"></div>
    </div>`;
  openModal(key?'Editar Fera':'Nova Fera',html,data=>{
    const skillsObj={};
    (data.skillsStr||'').split(',').map(s=>s.trim().toLowerCase()).filter(k=>SKILLS[k]).forEach(k=>{skillsObj[k]='prof';});
    const traitsArr=(data.traitsStr||'').split('\n').map(line=>{
      const idx=line.indexOf(':');
      if(idx<0)return{name:line.trim(),desc:''};
      return{name:line.slice(0,idx).trim(),desc:line.slice(idx+1).trim()};
    }).filter(t=>t.name);
    const newB={name:data.name||'Fera',cr:data.cr||'1',ca:parseInt(data.ca)||10,hp:parseInt(data.hp)||10,
      speedWalk:parseFloat(data.speedWalk)||0,speedClimb:parseFloat(data.speedClimb)||0,
      speedSwim:parseFloat(data.speedSwim)||0,speedFly:parseFloat(data.speedFly)||0,
      attrs:{str:parseInt(data.bStr)||10,dex:parseInt(data.bDex)||10,con:parseInt(data.bCon)||10,
        int:parseInt(data.bInt)||10,wis:parseInt(data.bWis)||10,cha:parseInt(data.bCha)||10},
      saves:b.saves||{},skills:skillsObj,senses:data.senses||'',traits:traitsArr,
      multiattack:data.multiattack||'',
      attacks:[{name:data.atkName||'Ataque',die:data.atkDie||'1d6',mod:parseInt(data.atkMod)||0,
        type:data.atkType||'cortante',reach:data.atkReach||'1,5m',extra:data.atkExtra||''}]};
    const newKey=key||'b_'+Date.now();
    state.beasts[newKey]=newB;
    if(!key)state.activeBeast=newKey;
    renderAll();save();showToast('✓ Fera salva');
  });
}
export function openInvModal(id){
  const it=id?state.inventory.find(x=>x.id===id):{name:'',qty:1,weight:0,desc:'',reminder:false,reminderNote:'',availableInWild:false};
  const html=`
    <div class="field"><label>Nome</label><input name="name" value="${esc(it.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Quantidade</label><input type="number" name="qty" value="${it.qty}" min="0"></div>
      <div class="field"><label>Peso (lbs)</label><input type="number" name="weight" value="${it.weight}" min="0" step="0.1"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea name="desc">${esc(it.desc||'')}</textarea></div>
    <div class="modal-sub">Lembrete</div>
    <label class="checkbox-row">
      <input type="checkbox" name="reminder" ${it.reminder?'checked':''}>
      <span>Mostrar como lembrete fixo</span>
    </label>
    <div class="field"><label>Nota</label><input name="reminderNote" value="${esc(it.reminderNote||'')}"></div>
    <div class="modal-sub">Forma Selvagem</div>
    <label class="checkbox-row">
      <input type="checkbox" name="availableInWild" ${it.availableInWild?'checked':''}>
      <span>Disponível na Forma Selvagem</span>
    </label>`;
  openModal(id?'Editar Item':'Novo Item',html,data=>{
    const newI={id:id||'i_'+Date.now(),name:data.name||'Item',qty:parseInt(data.qty)||1,
      weight:parseFloat(data.weight)||0,desc:data.desc||'',reminder:!!data.reminder,
      reminderNote:data.reminderNote||'',availableInWild:!!data.availableInWild};
    if(id){const i=state.inventory.findIndex(x=>x.id===id);state.inventory[i]=newI;}
    else state.inventory.push(newI);
    renderAll();save();showToast('✓ Item salvo');
  });
}
export function deleteWeapon(id){if(!confirm('Remover arma?'))return;state.weapons=state.weapons.filter(w=>w.id!==id);renderAll();save();}
export function deleteSpell(id){if(!confirm('Remover magia?'))return;state.spells=state.spells.filter(s=>s.id!==id);renderAll();save();}
export function deleteInv(id){if(!confirm('Remover item?'))return;state.inventory=state.inventory.filter(i=>i.id!==id);renderAll();save();}
export function deleteBeast(key){if(!confirm('Remover fera?'))return;delete state.beasts[key];if(state.activeBeast===key)state.activeBeast=Object.keys(state.beasts)[0]||null;renderAll();save();}

// ---- Fase 0 aliases / handlers ----
export function renderStats(){return renderStatsBar();}
export function renderSavesSkillsPanel(){return renderSavesSkills();}
export function renderCombatPanel(){return renderCombat();}
export function renderFeaturesPanel(){return renderFeatures();}
export function renderFeatsPanel(){return renderFeats();}
export function renderSpellsPanel(){return renderSpells();}
export function renderBeastsPanel(){return renderForms();}
export function renderInventoryPanel(){return renderInventory();}
export function renderWildHealButton(){return renderWildActions();}

export function rollSkillNumpad(key){
  const mod=getSkillTotal(key);
  const prof=state.skills[key]?getProf():0;
  openNumpadDirect({target:'skill-'+key,mod,isD20:true,min:1,max:20,dieStr:'d20',label:(SKILLS[key]?.name||key)+' (d20'+fmtMod(mod)+')'});
}
export function rollSaveNumpad(k){
  const mod=getSaveTotal(k);
  openNumpadDirect({target:'save-'+k,mod,isD20:true,min:1,max:20,dieStr:'d20',label:'Salvaguarda '+ATTR_FULL[k]+' (d20'+fmtMod(mod)+')'});
}
export function openACModal(){return openCAModal();}
export function openCharacterEdit(){return openCharModal();}
export function openWeaponEdit(id){return openWeaponModal(id);}
export function openSpellEdit(id){return openSpellModal(id);}
export function openBeastEdit(key){showToast('em breve');}
export function openItemEdit(id){return openInvModal(id);}
export function addWeapon(){return openWeaponModal();}
export function addSpell(){return openSpellModal();}
export function addItem(){return openInvModal();}
export function openRestModal(){openModal('Descanso', renderRestPanel(), null);}

// ensure existing renderAll output includes wild heal button in expected places? keep as-is

setNumpadHooks({
  classLevel: (idx, n) => {
    if (!isNaN(idx) && modalClasses[idx]) modalClasses[idx].level = Math.max(1, Math.min(20, n));
  },
  updateSlotTotal: (idx) => updateSlotTotalDisplay(idx)
});

export function initApp() {
  state.spellSlots = getCurrentSlots();
  renderAll();
}
