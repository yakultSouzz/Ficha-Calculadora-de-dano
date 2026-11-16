# 🏗 Plano de Refatoração — Ficha Kaelen v3

## Estratégia: Strangler Pattern
Não reescrever do zero. Manter o HTML atual funcionando enquanto migramos
funções puras para módulos ES, uma camada por vez. Cada migração é testável
isoladamente.

## Estrutura de pastas alvo
/
├── index.html              # shell + imports (mantém CSS atual)
├── package.json            # vite + vitest + scripts
├── vite.config.js
├── src/
│   ├── main.js             # bootstrap
│   ├── state.js            # defaultState + reducer/patch
│   ├── persist.js          # load/save versionado + migrações
│   ├── calc/
│   │   ├── index.js
│   │   ├── dice.js         # parseDice, diceInfo, rolagem
│   │   ├── attack.js       # calcWeaponAttack, calcBeastAttack
│   │   ├── slots.js        # getAutoSlots, getMaxSlots, expendSlot
│   │   └── modifiers.js    # getMod, getProf, getSkillTotal, getSaveTotal
│   ├── ui/
│   │   ├── header.js
│   │   ├── stats.js
│   │   ├── abilities.js
│   │   ├── savesSkills.js
│   │   ├── combat.js
│   │   ├── features.js
│   │   ├── feats.js
│   │   ├── spells.js
│   │   ├── beasts.js
│   │   ├── inventory.js
│   │   ├── rest.js
│   │   ├── numpad.js
│   │   ├── modal.js
│   │   ├── history.js
│   │   └── toast.js
│   ├── render.js           # renderPanel(name) + subscribe
│   └── events.js           # event delegation (data-action)
├── styles/
│   └── main.css            # extraído do <style> atual
├── tests/
│   ├── calc.test.js
│   ├── slots.test.js
│   ├── attack.test.js
│   └── persist.test.js
└── reports/

## Módulos propostos

### src/calc/dice.js
export function parseDice(str) { /* ... */ }
export function diceInfo(str) { /* ... */ }
export function rollTotal(roll, mod) { /* ... */ }

### src/calc/modifiers.js
export const getMod = (score) => Math.floor((score - 10) / 2);
export const getProf = (level) => 2 + Math.floor((level - 1) / 4);
export const getSkillTotal = (state, key) => { /* ... */ };
export const getSaveTotal = (state, k) => { /* ... */ };

### src/calc/attack.js
export function calcWeaponAttack(weapon, ctx) { /* puro, testável */ }
export function calcBeastAttack(beast, atk, ctx) { /* puro, testável */ }
export function calcSpellDamageStr(spell, isCrit) { /* puro, testável */ }

### src/calc/slots.js
export function getAutoSlots(classes) { /* puro */ }
export function getMaxSlots(classes, override, bonus) { /* puro */ }
export function getCurrentSlots(maxSlots, current) { /* puro */ }

### src/persist.js
export const SAVE_KEY = 'ficha-v3';
export const SAVE_VERSION = 3;
export function load() { /* com migração */ }
export function save(state) { /* com version */ }
export function migrate(old) { /* v23 -> v3 */ }

### src/render.js
export function renderPanel(name) { /* só re-renderiza um painel */ }
export function subscribe(fn) { /* pub/sub simples */ }

## Ordem de execução (strangler)

### Passo 1 — Extrair lógica pura (Fase 1)
1. Criar /src/calc/*.js
2. Copiar funções puras atuais
3. Escrever testes Vitest ANTES de integrar
4. Verificar 100% cobertura

### Passo 2 — Persistência versionada (Fase 2)
1. Criar src/persist.js com migrate(v23->v3)
2. Testar migração sem perda
3. Trocar localStorage.getItem/setItem pelos exports

### Passo 3 — Render incremental (Fase 2)
1. Substituir renderAll por renderPanel(name)
2. Cada painel assina o estado que precisa
3. Event delegation com data-action

### Passo 4 — Completar funcionalidades (Fase 0/2)
1. openModal/saveModal genérico
2. Descansos curto/longo
3. spendFeatUse + reset
4. Consumo de temp HP

## Testes mínimos (Vitest)
| Teste | Cobre |
|---|---|
| calcWeaponAttack com crítico | dobra arma + extra + feat |
| calcWeaponAttack com Fúria | +2 só se attr === 'str' |
| calcBeastAttack Urso Marrom | dano usa FOR da fera (+4), não atk.mod |
| calcBeastAttack em Fúria | +2 no dano da fera |
| getAutoSlots Druida 2 | [3] |
| getAutoSlots multiclasse | soma correta full/half |
| getMod / getProf | boundaries (1, 4, 5, 8, 9, 12, 13, 20) |
| applyDamage com temp HP | consome temp antes do real |
| migrate(v23->v3) | save antigo preserva dados |
| parseDice('1d6') | {count:1, sides:6} |

## Riscos e mitigação
| Risco | Mitigação |
|---|---|
| Re-render quebrar input | renderPanel + data-action |
| Save do usuário corromper | Backup antes de migrar + teste |
| Regra 5e errada | Testes contra PHB com link na issue |
| Bundle crescer | Vite tree-shaking, sem framework |

## Definition of Done (por PR)
- npm test verde
- npm run lint sem erros
- Save antigo migra sem crashar
- Mobile testado (toque, scroll, safe-area)
- Regras 5e validadas (link PHB na PR)
- renderPanel incremental (sem full re-render)
