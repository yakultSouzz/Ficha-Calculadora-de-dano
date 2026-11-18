export function getMod(score){
  return Math.floor((score-10)/2);
}
export function getProf(level){
  return 2+Math.floor((level-1)/4);
}
export function parseDice(str){
  if(!str)return{count:1,sides:6};
  const m=String(str).toLowerCase().match(/^(\d+)d(\d+)$/);
  return m?{count:parseInt(m[1]),sides:parseInt(m[2])}:{count:1,sides:6};
}
export function diceInfo(str){
  if(!str||str==='d20')return{min:1,max:20,types:[{count:1,sides:20}]};
  let min=0,max=0;const types=[];
  String(str).toLowerCase().split('+').forEach(p=>{
    const m=p.trim().match(/^(\d+)d(\d+)$/);
    if(m){
      const c=parseInt(m[1]),s=parseInt(m[2]);
      min+=c;max+=c*s;types.push({count:c,sides:s});
    }
  });
  if(!types.length)return{min:1,max:20,types:[{count:1,sides:20}]};
  return{min,max,types};
}
function parseDiceToMap(str){
  const map = {};
  if(!str) return map;
  String(str).toLowerCase().split('+').forEach(p=>{
    const m = p.trim().match(/^(\d+)d(\d+)$/);
    if(m){
      const c=parseInt(m[1]), s=parseInt(m[2]);
      map[s] = (map[s]||0) + c;
    }
  });
  return map;
}
export function calcWeaponAttack(weapon, isCrit, state){
  const attrKey = weapon.attr || 'str';
  const attrMod = getMod(state.attrs[attrKey]||10);
  const totalLevel = (state.character?.classes||[]).reduce((s,c)=>s+(parseInt(c.level)||0),0) || 1;
  const prof = getProf(totalLevel);
  const featAtkBonus = (state.feats||[]).reduce((s,f)=>s + ((f.combat&&f.combat.active)?(parseInt(f.combat.attackBonus)||0):0), 0);
  const toHit = prof + attrMod + (parseInt(weapon.magic)||0) + featAtkBonus;
  const rageActive = !!(state.effects||[]).find(e=>e.id==='rage'&&e.active);
  const rageBonus = (rageActive && attrKey==='str') ? 2 : 0;
  const featDmgBonus = (state.feats||[]).reduce((s,f)=>s + ((f.combat&&f.combat.active)?(parseInt(f.combat.damageBonus)||0):0), 0);
  const isOffHand = weapon.equipState === 'off' || weapon.isOffHand === true;
  const damageAttrMod = isOffHand ? 0 : attrMod;
  const flatBonus = damageAttrMod + (parseInt(weapon.magic)||0) + (parseInt(weapon.flat)||0) + rageBonus + featDmgBonus;
  const parts = [];
  const diceParts = [];
  if(weapon.die){
    const wd = parseDice(weapon.die);
    if(wd){
      const c = isCrit ? wd.count*2 : wd.count;
      parts.push(`${c}d${wd.sides}`);
      diceParts.push(`${c}d${wd.sides}`);
    }
  }
  if(weapon.extraDice){
    const ed = parseDice(weapon.extraDice);
    if(ed){
      const c = isCrit ? ed.count*2 : ed.count;
      parts.push(`+ ${c}d${ed.sides}${weapon.extraType?' '+weapon.extraType:''}`);
      diceParts.push(`${c}d${ed.sides}`);
    }
  }
  const featDice = (state.feats||[]).filter(f=>f.combat&&f.combat.active&&f.combat.dice).map(f=>({dice:f.combat.dice,damageType:f.combat.damageType||''}));
  featDice.forEach(fd=>{
    const d = parseDice(fd.dice);
    if(d){
      const c = isCrit ? d.count*2 : d.count;
      parts.push(`+ ${c}d${d.sides}${fd.damageType?' '+fd.damageType:''}`);
      diceParts.push(`${c}d${d.sides}`);
    }
  });
  if(flatBonus !== 0){
    parts.push((flatBonus>0?'+ ':'- ')+Math.abs(flatBonus));
  }
  const damage = parts.join(' ');
  const diceStr = diceParts.join('+') || '1d6';
  let minDmg = flatBonus, maxDmg = flatBonus;
  const dm = parseDiceToMap(diceStr);
  Object.keys(dm).map(Number).forEach(s => { minDmg += dm[s]; maxDmg += dm[s]*s; });
  return {toHit, damage, diceStr, flatBonus, rageBonus, featDice, featAtkBonus, featDmgBonus, minDmg, maxDmg, isCrit:!!isCrit};
}
export function applyRageResistance(amount, damageType, isRaging, isTotemBear){
  if(!isRaging || amount <= 0) return amount;
  const type = String(damageType || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if(isTotemBear){
    return type !== 'psiquico' ? Math.floor(amount / 2) : amount;
  }
  return ['cortante', 'perfurante', 'impacto'].includes(type) ? Math.floor(amount / 2) : amount;
}
export function calcBeastAttack(beast, atk, isCrit, isRage){
  const rageBonus = isRage ? 2 : 0;
  const dmgMod = getMod(beast?.attrs?.str || 10) + rageBonus;
  const d = parseDice(atk.die) || {count:1, sides:6};
  const count = isCrit ? d.count*2 : d.count;
  const diceStr = `${count}d${d.sides}`;
  const damage = `${diceStr} ${dmgMod>=0?'+':''}${dmgMod} ${atk.type||''}`.trim();
  return {toHit: atk.mod, damage, diceStr, dmgMod, rageBonus, isCrit:!!isCrit};
}
export function getAutoSlots(classes){
  const full=['mago','clérigo','clerigo','druida','bardo','feiticeiro'];
  const half=['paladino','patrulheiro'];
  let lvl=0;
  (classes||[]).forEach(c=>{
    const n=(c.name||'').toLowerCase();const l=parseInt(c.level)||0;
    if(full.some(x=>n.includes(x)))lvl+=l;
    else if(half.some(x=>n.includes(x)))lvl+=Math.floor(l/2);
  });
  const table=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],
    [4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],
    [4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],
    [4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
  const arr=table[Math.min(20,Math.max(0,lvl))]||[];
  const result={};arr.forEach((n,i)=>{result[i+1]=n;});
  return result;
}

export const Calc = { getMod, getProf, parseDice, diceInfo, calcWeaponAttack, calcBeastAttack, applyRageResistance, getAutoSlots };
if (typeof globalThis !== 'undefined') globalThis.Calc = Calc;
