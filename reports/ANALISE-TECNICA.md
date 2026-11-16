# 🔬 Análise Técnica — Ficha Kaelen v3

## Stack atual
| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 single-file |
| Estilo | CSS puro com variáveis (custom properties) |
| Lógica | JavaScript ES2020 vanilla (sem módulos) |
| Persistência | localStorage chave ficha-v23 |
| Build | Nenhum |
| Testes | Nenhum |

## Arquitetura atual
calculadora de dano.html
- <style> (~800 linhas — design system completo)
- <body>: #app, #historyFab, #numpadOverlay, #modalOverlay, #toast
- <script>:
  - Constantes (ATTR_NAMES, SKILLS, defaultState, RAGE_DESC)
  - Estado (state, save())
  - Helpers (getMod, getProf, esc, parseDice, diceInfo)
  - Cálculos (calcWeaponAttack, calcBeastAttack, calcSpellDamageStr)
  - Slots (getAutoSlots, getMaxSlots, getCurrentSlots, expendSlot)
  - Numpad (openNumpadDirect, npDigit, npConfirm, updateNumpadDisplay)
  - Histórico (logHistory, openHistoryModal, renderHistEntries)
  - HP (applyDamage, applyHealing, openHPModal, quickHP)
  - Wild Shape (openWildHealNumpad, toggleItemWild)
  - Lembretes (renderReminders, toggleReminder, consumeReminder)
  - TRUNCADO em spendFeatUse

## Problemas por severidade

### Crítico (bloqueia uso)
- C1 — Arquivo truncado em spendFeatUse. Faltam renderAll, render*, openModal, saveModal, closeModal, descansos.
- C2 — applyDamage ignora state.hp.temp. Regra 5e violada.
- C3 — spendFeatUse incompleto (não decrementa, não integra descanso).
- C4 — Descanso curto/longo ausentes -> features.recharge nunca dispara.

### Alto (dívida técnica)
- A1 — God state único (~40 campos), sem encapsulamento.
- A2 — Funções globais (window.*), sem módulos.
- A3 — renderAll full re-render perde foco/scroll/input a cada toque.
- A4 — Zero testes em funções puras (calcWeaponAttack, getAutoSlots).
- A5 — Duplicação: diceInfo vs parseDiceToMap.

### Médio (UX/regra)
- M1 — CAR 0 em Kaelen (placeholder esquecido).
- M2 — Envenenador: crítico correto (2d8->4d8), mas sem confirmação de "1x por turno".
- M3 — Slots bonus não aparecem no breakdown visual.
- M4 — Sem inspiração, condições ou exaustão.
- M5 — Histórico sem export/sync.

### Oportunidades
- O1 — PWA (offline já funciona, falta manifest + SW).
- O2 — Migração de save versionada (_v:3).
- O3 — Export/import JSON.
- O4 — Multi-personagem (tabs).

## Pontos fortes (manter)
1. Numpad universal — UX mobile consistente para dados, números e confirmação.
2. Feedback triplo — háptico + toast + histórico persistente.
3. Migração inline — o try/catch inicial já converte 1d8->2d8 e corrige raça.
4. Crítico correto — dobra arma + extra + feat (regra 5e exata).
5. Overflow de Wild Shape — dano residual passa pro humano, bem modelado.
6. Slots auto + override — flexível para multiclasse (Druida 2 = [3] slots de 1º).
7. Correção do dano de fera — usa FOR da fera, não o atk.mod de acerto (comentário no código).

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Perder save do usuário na refatoração | Alta | Alto | Migração versionada + testes |
| Re-render quebrar input em mobile | Média | Alto | Migrar para renderPanel incremental |
| Regra 5e implementada errada | Média | Médio | Testes unitários contra PHB |
| Bundle crescer com dependências | Baixa | Médio | Vanilla + Vite, sem framework |

## Estimativa de esforço
| Fase | Estimativa | Bloqueia |
|---|---|---|
| Fase 0 | ~2h opencode | Tudo |
| Fase 1 | ~2h opencode | Fase 2 (parcial) |
| Fase 2 | ~3h opencode | Fase 3 |
| Fase 3 | ~2h opencode | — |
| Total | ~9h opencode | — |
