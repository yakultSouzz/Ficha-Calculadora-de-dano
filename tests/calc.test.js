import { describe, it, expect } from 'vitest';
import { getMod, getProf, parseDice, diceInfo, calcWeaponAttack, calcBeastAttack, getAutoSlots } from '../src/calc.js';

describe('getMod', () => {
  it('handles standard scores', () => {
    expect(getMod(8)).toBe(-1);
    expect(getMod(10)).toBe(0);
    expect(getMod(13)).toBe(1);
    expect(getMod(20)).toBe(5);
  });
});

describe('getProf', () => {
  it('scales with level', () => {
    expect(getProf(1)).toBe(2);
    expect(getProf(5)).toBe(3);
    expect(getProf(9)).toBe(4);
    expect(getProf(20)).toBe(6);
  });
});

describe('calcWeaponAttack', () => {
  const baseState = {
    character: { classes: [{name:'Bárbaro',level:3},{name:'Druida',level:2}] }, // prof +3
    attrs: {str:16,dex:13,con:20,int:8,wis:13,cha:10},
    effects: [{id:'rage',active:false}],
    feats: []
  };
  const axe = {die:'1d6',magic:2,flat:0,extraDice:'1d6',extraType:'fogo',attr:'str'};

  it('base attack and damage with prof+attr+magic', () => {
    const r = calcWeaponAttack(axe, false, baseState);
    // toHit = prof(3)+str(3)+magic(2)=8
    expect(r.toHit).toBe(8);
    // flat = str(3)+magic(2)=5, damage 1d6 + 1d6 fogo + 5
    expect(r.flatBonus).toBe(5);
    expect(r.diceStr).toBe('1d6+1d6');
    expect(r.damage).toContain('1d6');
    expect(r.damage).toContain('2d6'.replace('2d6','1d6')); // sanity
  });

  it('critical doubles ALL dice', () => {
    const r = calcWeaponAttack(axe, true, baseState);
    expect(r.diceStr).toBe('2d6+2d6');
    expect(r.damage).toContain('2d6 fogo');
  });

  it('rage adds +2 damage only for str weapons', () => {
    const rageState = {...baseState, effects:[{id:'rage',active:true}]};
    const rStr = calcWeaponAttack({...axe, attr:'str'}, false, rageState);
    const rDex = calcWeaponAttack({...axe, attr:'dex', die:'1d6', extraDice:''}, false, rageState);
    expect(rStr.flatBonus).toBe(7); // 3(str)+2(magic)+2(rage)
    expect(rDex.rageBonus).toBe(0);
    expect(rDex.flatBonus).toBe(3); // 1(dex)+2(magic)+0
  });
});

describe('calcBeastAttack', () => {
  const bear = { attrs: {str:19,dex:10,con:16,int:2,wis:13,cha:7} };
  const bite = { name:'Mordida', die:'1d8', mod:5, type:'perfurante' };

  it('uses beast STR mod for damage, not atk.mod', () => {
    const r = calcBeastAttack(bear, bite, false, false);
    expect(r.dmgMod).toBe(4); // FOR 19 = +4
    expect(r.toHit).toBe(5);
    expect(r.damage).toContain('+4');
  });

  it('adds +2 rage damage', () => {
    const r = calcBeastAttack(bear, bite, false, true);
    expect(r.dmgMod).toBe(6);
    expect(r.rageBonus).toBe(2);
  });
});

describe('getAutoSlots', () => {
  it('Druid 2 (full caster)', () => {
    expect(getAutoSlots([{name:'Druida', level:2}])).toEqual({1:3});
  });
  it('Paladin 4 (half caster -> caster level 2)', () => {
    expect(getAutoSlots([{name:'Paladino', level:4}])).toEqual({1:3});
  });
  it('Multiclass Wizard 3 / Cleric 2', () => {
    expect(getAutoSlots([{name:'Mago', level:3},{name:'Clérigo', level:2}])).toEqual({1:4,2:3,3:2});
  });
});
