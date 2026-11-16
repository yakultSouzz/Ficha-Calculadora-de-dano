# Fase 1 — Regras + Testes + Início da Modularização (DONE)

## 1) Extração para `src/calc.js`
- Criado `src/calc.js` com lógica pura exportada como ES Modules: `getMod`, `getProf`, `parseDice`, `diceInfo`, `calcWeaponAttack(weapon, isCrit, state)`, `calcBeastAttack(beast, atk, isCrit, isRage)`, `getAutoSlots(classes)`.
- Para manter o app funcional no navegador/Vercel (script inline legado), o módulo também expõe `window.Calc`; `index.html` carrega `<script src="src/calc.js"></script>` e consome as funções, removendo as definições duplicadas do arquivo principal e adaptando chamadas/wrappers (`getAutoSlots(state.character.classes)`, wrappers de ataque usando `state`/`isRage()`).
- CSS e estrutura visual mantidos intactos.

## 2) Testes automatizados
- Ambiente: `package.json` (type module) + Vitest, script `npm test` (`vitest run`).
- `tests/calc.test.js` cobre regras 5e: `getMod` (8/10/13/20), `getProf` (1/5/9/20), `calcWeaponAttack` (prof+atrib+mágico, crítico dobra todos os dados, Fúria +2 só em FOR), `calcBeastAttack` (dano usa FOR da fera, +2 em Fúria) e `getAutoSlots` (Druida 2, Paladino 4, Mago 3/Clérigo 2).

Resultado `npm test`: **1 arquivo, 10 testes, 10 passaram**.

## 3) Correções (M1, M2, M3)
- **M1 (CAR 0)**: `defaultState.attrs.cha` alterado de `0` para `10`.
- **M2 (Envenenador 1x/turno)**: `usedThisTurn: false` no feat `feat-poisoner`; UI de Talentos em Combate exibe “1/turno” e estado gasto (opacidade) quando usado; botão **“🔄 Novo Turno”** no painel de combate; `newTurn()` reseta `usedThisTurn` dos feats de combate (`save` + `renderAll`); confirmação da rolagem do Envenenador (`openPoisonNumpad`) marca `usedThisTurn=true`.
- **M3 (Slots)**: modal de espaços já apresenta colunas **Nível | Manual | +Bônus | Total** e cálculo consistente com `getMaxSlots`: `(manual > 0 ? manual : auto) + bonus`.

## 4) Próximo passo recomendado (Fase 2 — Refatoração e PWA)
- Modularização incremental da UI/estado/persistência (`src/state`, `src/persist`, `src/ui/*`), `renderPanel` em vez de full re-render, event delegation, migração de save versionada e PWA (manifest + service worker), conforme `reports/PLANO-REFATORACAO.md` e `reports/ROADMAP.md`.
