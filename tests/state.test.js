import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadState,
  getActiveCharacter,
  getActiveId,
  getCharacters,
  switchCharacter,
  createCharacter,
  deleteCharacter,
  SAVE_KEY
} from '../src/state.js';

const store = {};

globalThis.localStorage = {
  getItem: key => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: key => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(key => delete store[key]); }
};

describe('multi-character state', () => {
  beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
  });

  it('migrates a legacy single-character save', () => {
    store[SAVE_KEY] = JSON.stringify({
      version: 3,
      character: { name: 'Kaelen', race: 'Humano', classes: [{ name: 'Bárbaro', level: 3 }] },
      hp: { current: 20, max: 40, temp: 0 },
      attrs: { str: 16, dex: 13, con: 20, int: 8, wis: 13, cha: 10 }
    });

    const active = loadState();
    expect(active.character.name).toBe('Kaelen');
    expect(getActiveCharacter()).toBe(active);

    const saved = JSON.parse(store[SAVE_KEY]);
    expect(saved.activeId).toBeTruthy();
    expect(saved.characters[saved.activeId].character.name).toBe('Kaelen');
    expect(saved.characters[saved.activeId].hp.max).toBe(40);
    expect(active.actionsUsed).toEqual({ action: false, bonus: false, reaction: false });
    expect(active.weapons.some(w => w.id === 'w_axe_off' && w.equipState === 'off')).toBe(true);
  });

  it('migrates legacy weapon active flags to hand equipment', () => {
    store[SAVE_KEY] = JSON.stringify({
      version: 3,
      character: { name: 'Kaelen', race: 'Humano', classes: [{ name: 'Bárbaro', level: 3 }] },
      weapons: [
        { id: 'w_axe', name: 'Machadinha', active: true },
        { id: 'w_axe_off', name: 'Machadinha Inábil', active: false, isOffHand: true },
        { id: 'w_tri', name: 'Tridente', active: false }
      ]
    });

    const active = loadState();
    const byId = id => active.weapons.find(w => w.id === id);

    expect(byId('w_axe').equipState).toBe('main');
    expect(byId('w_axe_off').equipState).toBe('off');
    expect(byId('w_tri').equipState).toBe('none');
    expect('active' in byId('w_axe')).toBe(false);
    expect('isOffHand' in byId('w_axe_off')).toBe(false);
  });

  it('starts all default beasts without equipment', () => {
    const active = loadState();
    expect(Object.keys(active.beasts).length).toBeGreaterThan(0);
    expect(Object.values(active.beasts).every(b => b.canUseEquipment === false)).toBe(true);
  });

  it('migrates legacy beasts with equipment flag and structured lists', () => {
    store[SAVE_KEY] = JSON.stringify({
      version: 3,
      activeBeast: 'oldBear',
      beasts: {
        oldBear: { name: 'Urso Antigo', ca: 11, hp: 30, traits: null, speedWalk: 12 },
        oldWolf: { name: 'Lobo Antigo', canUseEquipment: true, attacks: [], traits: [{ name: 'Faro', desc: 'Vantagem.' }] }
      }
    });

    const active = loadState();
    const bear = active.beasts.oldBear;
    const wolf = active.beasts.oldWolf;

    expect(bear.canUseEquipment).toBe(false);
    expect(Array.isArray(bear.attacks)).toBe(true);
    expect(bear.attacks.length).toBeGreaterThan(0);
    expect(bear.traits).toEqual([]);
    expect(bear.multiattack).toBe('');
    expect(wolf.canUseEquipment).toBe(true);
    expect(wolf.attacks.length).toBeGreaterThan(0);
    expect(wolf.traits).toEqual([{ name: 'Faro', desc: 'Vantagem.' }]);
  });

  it('creates, switches and deletes characters', () => {
    loadState();
    const firstId = getActiveId();

    const created = createCharacter('Lyra');
    const secondId = getActiveId();

    expect(created.character.name).toBe('Lyra');
    expect(secondId).not.toBe(firstId);
    expect(Object.keys(getCharacters())).toHaveLength(2);
    expect(getActiveCharacter().attrs.str).toBe(10);
    expect(getActiveCharacter().character.classes[0].level).toBe(1);

    switchCharacter(firstId);
    expect(getActiveCharacter().character.name).toBe('Kaelen');

    expect(deleteCharacter(firstId)).toBe(true);
    expect(getActiveCharacter().character.name).toBe('Lyra');
    expect(Object.keys(getCharacters())).toHaveLength(1);
    expect(deleteCharacter(secondId)).toBe(false);
  });

  it('persists the active character across reloads', () => {
    loadState();
    createCharacter('Persistente');
    const id = getActiveId();

    const reloaded = loadState();
    expect(reloaded.character.name).toBe('Persistente');
    expect(getActiveId()).toBe(id);
  });
});
