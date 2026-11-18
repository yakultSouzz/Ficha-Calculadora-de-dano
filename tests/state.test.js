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
    expect(active.weapons.some(w => w.id === 'w_axe_off' && w.isOffHand)).toBe(true);
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
