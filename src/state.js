export const ATTR_NAMES={str:'FOR',dex:'DES',con:'CON',int:'INT',wis:'SAB',cha:'CAR'};
export const ATTR_FULL={str:'Força',dex:'Destreza',con:'Constituição',int:'Inteligência',wis:'Sabedoria',cha:'Carisma'};
export const SKILLS={
  acrobacia:{name:'Acrobacia',attr:'dex'},adestrar:{name:'Adestrar Animais',attr:'wis'},
  arcanismo:{name:'Arcanismo',attr:'int'},atletismo:{name:'Atletismo',attr:'str'},
  atuacao:{name:'Atuação',attr:'cha'},enganacao:{name:'Enganação',attr:'cha'},
  furtividade:{name:'Furtividade',attr:'dex'},historia:{name:'História',attr:'int'},
  intimidacao:{name:'Intimidação',attr:'cha'},intuicao:{name:'Intuição',attr:'wis'},
  investigacao:{name:'Investigação',attr:'int'},medicina:{name:'Medicina',attr:'wis'},
  natureza:{name:'Natureza',attr:'int'},percepcao:{name:'Percepção',attr:'wis'},
  persuasao:{name:'Persuasão',attr:'cha'},prestidigitacao:{name:'Prestidigitação',attr:'dex'},
  religiao:{name:'Religião',attr:'int'},sobrevivencia:{name:'Sobrevivência',attr:'wis'}
};
export const emptyBeast=()=>({name:'',cr:'1',ca:10,hp:20,speedWalk:12,speedClimb:0,speedSwim:0,speedFly:0,
  attrs:{str:10,dex:10,con:10,int:2,wis:10,cha:6},saves:{},skills:{},senses:'',traits:[],multiattack:'',
  attacks:[{name:'Mordida',die:'1d6',mod:2,type:'perfurante',reach:'1,5m'}]});
export const RAGE_DESC='+2 dano (FOR) • Resistência a TODOS os danos exceto psíquico (Totem do Urso)';

export const defaultState={
  version:3,
  situation:'combat',
  character:{name:'Kaelen',race:'Humano',classes:[{name:'Bárbaro',level:3},{name:'Druida',level:2}]},
  hp:{current:66,max:66,temp:0},wildHp:{current:0,max:0},
  hitDice:{current:5,max:5},hitDieSize:12,speed:9,
  caOverride:0,caBonus:0,caWildMode:'auto',
  attrs:{str:16,dex:13,con:20,int:8,wis:13,cha:10},
  saves:{str:true,dex:false,con:true,int:false,wis:true,cha:false},
  skills:{atletismo:true,sobrevivencia:true,percepcao:true,natureza:true,intimidacao:true},
  spellcasting:{ability:'wis'},spellSlots:{},
  spellSlotsOverride:{},
  spellSlotsBonus:{},
  history:{skills:[],attacks:[],hp:[]},
  weapons:[
    {id:'w_axe',name:'Machadinha +2 (Fogo)',die:'1d6',magic:2,flat:0,extraDice:'1d6',extraType:'fogo',attr:'str',props:'Leve, Arremesso 6/18m',active:true},
    {id:'w_tri',name:'Tridente +1',die:'1d8',magic:1,flat:0,extraDice:'',extraType:'',attr:'str',props:'Versátil, Arremesso 6/18m',active:false}
  ],
  effects:[
    {id:'rage',name:'Fúria',type:'rage',active:false,desc:RAGE_DESC,totemBear:true},
    {id:'wild',name:'Forma Selvagem',type:'wild',active:false,desc:'Assume forma de fera'}
  ],
  features:[
    {id:'f1',name:'Fúria',source:'Bárbaro 1',desc:'Ação bônus. +2 dano em ataques com FOR, vantagem em testes de FOR. Enquanto em Fúria: resistência a TODOS os danos exceto psíquico (Totem do Urso). 3 usos por descanso longo.',uses:{current:3,max:3},recharge:'long',totemBear:true},
    {id:'f2',name:'Defesa sem Armadura',source:'Bárbaro 1',desc:'CA = 10 + DES + CON. Na Forma Selvagem, use os modificadores da fera.'},
    {id:'f3',name:'Ataque Descuidado',source:'Bárbaro 2',desc:'Vantagem em ataques com FOR no turno, mas inimigos têm vantagem contra você até seu próximo turno.'},
    {id:'f4',name:'Caminho do Totem (Urso)',source:'Bárbaro 3',desc:'Escolheu o Urso no nível 3. Enquanto em Fúria, você tem resistência a TODOS os tipos de dano, exceto psíquico. Esta resistência é automática e já está incluída na Fúria.'},
    {id:'f5',name:'Forma Selvagem',source:'Druida 2',desc:'Ação para se transformar em fera. Círculo da Lua permite CR 1 no nível 2.',uses:{current:2,max:2},recharge:'short'},
    {id:'f6',name:'Círculo da Lua',source:'Druida 2',desc:'Forma Selvagem como ação bônus. Pode gastar espaço de magia (ação bônus) para curar 1d8 por nível do espaço.'}
  ],
  feats:[
    {id:'feat-magic-initiate',name:'Iniciado em Magia (Mago)',source:'Talento',
     desc:'Aprendeu 2 truques e 1 magia de 1º nível da lista do Mago. Pode conjurar a magia de 1º nível uma vez sem gastar espaço de magia (recarrega em descanso longo). Atributo de conjuração: INT.\n\nTruques: Prestidigitação, Ilusão Menor.\nMagia 1º nível: Escudo Arcano.',
     uses:{current:1,max:1},recharge:'long'},
    {id:'feat-poisoner',name:'Envenenador',source:'Talento',
     desc:'Proficiência com kit de envenenador. Pode aplicar veneno a uma arma ou munição como ação bônus. Uma vez por turno, ao acertar com arma que cause dano perfurante ou cortante, adicione 2d8 de dano de veneno.',
     damage:'2d8',damageType:'veneno',usedThisTurn:false,
     combat:{dice:'2d8',damageType:'veneno',attackBonus:0,damageBonus:0,active:false,oncePerTurn:true}}
  ],
  spells:[],
  beasts:{
    brownBear:{name:'Urso Marrom',cr:'1',ca:11,hp:34,speedWalk:12,speedClimb:9,speedSwim:0,speedFly:0,
      attrs:{str:19,dex:10,con:16,int:2,wis:13,cha:7},saves:{},skills:{percepcao:'prof'},
      senses:'Visão no escuro 18m, Percepção passiva 13',
      traits:[{name:'Olfato Aguçado',desc:'Vantagem em Percepção baseada em olfato.'}],
      attacks:[{name:'Mordida',die:'1d8',mod:5,type:'perfurante',reach:'1,5m'},{name:'Garras',die:'2d6',mod:5,type:'cortante',reach:'1,5m'}],
      multiattack:'Uma Mordida e uma Garras.'},
    direWolf:{name:'Lobo Gigante',cr:'1',ca:14,hp:37,speedWalk:15,speedClimb:0,speedSwim:0,speedFly:0,
      attrs:{str:17,dex:15,con:15,int:3,wis:12,cha:6},saves:{},skills:{percepcao:'prof',furtividade:'prof'},
      senses:'Percepção passiva 13',
      traits:[{name:'Audição/Olfato Aguçado',desc:'Vantagem em Percepção.'},{name:'Táticas de Matilha',desc:'Vantagem em ataque se aliado a 1,5m.'}],
      attacks:[{name:'Mordida',die:'2d6',mod:5,type:'perfurante',reach:'1,5m',extra:'Teste de FOR CD 13 ou caído.'}]},
    blackBear:{name:'Urso Negro',cr:'1/2',ca:11,hp:19,speedWalk:12,speedClimb:9,speedSwim:0,speedFly:0,
      attrs:{str:15,dex:10,con:14,int:2,wis:12,cha:7},saves:{},skills:{percepcao:'prof'},
      senses:'Percepção passiva 13',
      traits:[{name:'Olfato Aguçado',desc:'Vantagem em Percepção baseada em olfato.'}],
      attacks:[{name:'Mordida',die:'1d6',mod:3,type:'perfurante',reach:'1,5m'},{name:'Garras',die:'2d4',mod:3,type:'cortante',reach:'1,5m'}],
      multiattack:'Uma Mordida e uma Garras.'},
    tiger:{name:'Tigre',cr:'1',ca:12,hp:37,speedWalk:12,speedClimb:0,speedSwim:0,speedFly:0,
      attrs:{str:17,dex:15,con:14,int:3,wis:12,cha:8},saves:{},skills:{percepcao:'prof',furtividade:'prof'},
      senses:'Visão no escuro 18m, Percepção passiva 13',
      traits:[{name:'Olfato Aguçado',desc:'Vantagem em Percepção baseada em olfato.'},{name:'Bote',desc:'Se move 6m+ em linha reta e acerta com garras, bônus para morder.'}],
      attacks:[{name:'Mordida',die:'1d10',mod:5,type:'perfurante',reach:'1,5m'},{name:'Garras',die:'1d8',mod:5,type:'cortante',reach:'1,5m'}]}
  },
  activeBeast:'brownBear',
  inventory:[]
};

export const SAVE_KEY = 'ficha-v22';
export const SAVE_VERSION = 3;

export let state;

const clone = (value) => JSON.parse(JSON.stringify(value));

export function migrate(savedState) {
  const base = clone(defaultState);
  const s = savedState && typeof savedState === 'object' ? { ...base, ...savedState } : base;

  if (!s.hp) s.hp = { ...base.hp };
  else s.hp = { ...base.hp, ...s.hp };
  if (s.hp.temp === undefined) s.hp.temp = 0;

  if (!s.saves) s.saves = { ...base.saves };
  if (!s.skills) s.skills = { ...base.skills };
  if (s.caOverride === undefined) s.caOverride = 0;
  if (s.caBonus === undefined) s.caBonus = 0;
  if (!s.caWildMode) s.caWildMode = 'auto';
  if (!s.spellSlots) s.spellSlots = {};
  if (!s.spellSlotsOverride) s.spellSlotsOverride = {};
  if (!s.spellSlotsBonus) s.spellSlotsBonus = {};
  if (s.character && s.character.name === 'Kaelen' && s.character.race === 'Meio-Orc') {
    s.character.race = 'Humano';
  }
  if (!s.situation) s.situation = 'combat';
  if (!s.hitDice) s.hitDice = { current: 5, max: 5 };
  if (!s.hitDieSize) s.hitDieSize = 12;
  if (!s.wildHp) s.wildHp = { current: 0, max: 0 };
  if (!s.history || !s.history.skills || !s.history.attacks || !s.history.hp) {
    s.history = { skills: [], attacks: [], hp: [] };
  }
  if (!Array.isArray(s.feats)) s.feats = clone(base.feats);
  s.feats.forEach(f => {
    if (!f.combat && (f.damage || f.damageType)) {
      f.combat = {
        dice: f.damage || '',
        damageType: f.damageType || '',
        attackBonus: 0,
        damageBonus: 0,
        active: false,
        oncePerTurn: true
      };
    }
    if (f.combat) {
      if (f.combat.attackBonus === undefined) f.combat.attackBonus = 0;
      if (f.combat.damageBonus === undefined) f.combat.damageBonus = 0;
      if (f.combat.active === undefined) f.combat.active = false;
    }
    if (f.usedThisTurn === undefined) f.usedThisTurn = false;
  });

  const poisoner = s.feats.find(f => f.id === 'feat-poisoner');
  if (poisoner) {
    if (poisoner.damage === '1d8') poisoner.damage = '2d8';
    if (poisoner.combat && poisoner.combat.dice === '1d8') poisoner.combat.dice = '2d8';
    if (poisoner.desc && poisoner.desc.includes('1d8 de dano de veneno')) {
      poisoner.desc = poisoner.desc.replace('1d8 de dano de veneno', '2d8 de dano de veneno');
    }
  }

  if (!s.beasts) s.beasts = clone(base.beasts);
  Object.keys(s.beasts).forEach(k => {
    const b = s.beasts[k];
    const tpl = emptyBeast();
    if (!b.attrs) b.attrs = tpl.attrs;
    if (!b.saves) b.saves = {};
    if (!b.skills) b.skills = {};
    if (b.senses === undefined) b.senses = '';
    if (!Array.isArray(b.traits)) b.traits = [];
    if (b.speedWalk === undefined) b.speedWalk = b.speed || tpl.speedWalk;
    if (b.speedClimb === undefined) b.speedClimb = 0;
    if (b.speedSwim === undefined) b.speedSwim = 0;
    if (b.speedFly === undefined) b.speedFly = 0;
    if (!Array.isArray(b.attacks) || !b.attacks.length) b.attacks = tpl.attacks;
  });

  if (!Array.isArray(s.inventory)) s.inventory = [];
  s.inventory.forEach(it => {
    if (it.reminder === undefined) it.reminder = false;
    if (it.reminderNote === undefined) it.reminderNote = '';
    if (it.availableInWild === undefined) it.availableInWild = false;
  });

  if (!Array.isArray(s.features)) s.features = clone(base.features);
  s.features.forEach(f => {
    if (f.uses === undefined) f.uses = null;
    if (f.recharge === undefined) f.recharge = 'none';
  });

  if (!Array.isArray(s.spells)) s.spells = [];
  s.spells.forEach(sp => {
    if (sp.damageMod === undefined) sp.damageMod = 0;
  });

  s.version = SAVE_VERSION;
  return s;
}

export function saveState() {
  try {
    state.version = SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

export function loadState() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    state = migrate(saved ? JSON.parse(saved) : null);
  } catch (e) {
    state = migrate(null);
  }
  saveState();
  return state;
}
