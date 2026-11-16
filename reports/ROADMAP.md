# 🗺 Roadmap — Ficha Kaelen v3

## Visão geral
App offline-first de ficha + calculadora D&D 5e, single-page, mobile-first.
Objetivo: transformar um protótipo feito por IA num produto estável, testável
e extensível, mantendo a estética atual (papel/pergaminho).

## Estado atual (baseline)

### O que já existe e funciona
- Numpad customizado (2 modos: dice e number)
- Cálculo de ataque de arma com crítico (dobra todos os dados)
- Cálculo de ataque de fera (correção do mod de FOR aplicada)
- Overflow de Wild Shape (wild -> humano)
- Histórico persistente (3 abas: perícias, ataques, HP)
- Slots de magia auto + override + bônus
- Feats de combate plugáveis (Envenenador, Magic Initiate)
- Lembretes de inventário com restrição por forma selvagem
- Migração básica de save (1d8->2d8 do Envenenador)

### O que falta (bloqueia uso)
- renderAll() e todos os render* (header, stats, combat, features, spells, inventory)
- openModal() / saveModal() / closeModal()
- Descanso curto e longo
- spendFeatUse() completo + integração com descanso
- Consumo de temp HP em applyDamage

## Fases

### Fase 0 — Estabilizar (Sprint 1)
Objetivo: o app roda e respeita regras básicas.
- T0.1 — renderAll + renderHeader, renderStats, renderAbilities, renderSavesSkills, renderCombat, renderFeatures, renderFeats, renderSpells, renderBeasts, renderInventory, renderRest
- T0.2 — openModal / saveModal / closeModal (form genérico)
- T0.3 — Descanso curto: recupera recharge:'short' + DV
- T0.4 — Descanso longo: HP full, metade dos DV (mín 1), recharge:'long', slots full
- T0.5 — applyDamage consome temp HP antes do HP real (log separado)
- T0.6 — spendFeatUse completo + reset no descanso
DoD: app abre, navega, edita e persiste sem crashar.

### Fase 1 — Corrigir regras (Sprint 2)
Objetivo: regras 5e validadas.
- T1.1 — Testes (Vitest) para calcWeaponAttack, calcBeastAttack, getMod, getProf, getAutoSlots
- T1.2 — Envenenador: flag usedThisTurn + botão "novo turno"
- T1.3 — Corrigir CAR 0 de Kaelen (provável 8 ou 10)
- T1.4 — Breakdown de CA no modal (base + bônus + override)
- T1.5 — Modal de slots mostra auto/override/bonus/total numa linha
DoD: npm test verde cobrindo as funções puras.

### Fase 2 — Refatorar estrutura (Sprint 3)
Objetivo: código mantível.
- T2.1 — Quebrar em módulos ES (/src/state.js, calc.js, persist.js, ui/*)
- T2.2 — renderPanel(name) em vez de renderAll (substituição incremental)
- T2.3 — Event delegation (remover onclick= inline)
- T2.4 — Save versionado (ficha-v3 com _v:3 + migrate())
DoD: build com Vite, bundle < 100KB, save antigo migra.

### Fase 3 — Produto (Sprint 4+)
- T3.1 — PWA (manifest + service worker)
- T3.2 — Export/import JSON do personagem
- T3.3 — Condições & exaustão (chips no header)
- T3.4 — Inspiração
- T3.5 — Multi-personagem (tabs)

## Priorização (MoSCoW)
| Must | Should | Could | Won't (agora) |
|---|---|---|---|
| Fase 0 inteira | Fase 1 | PWA | Sync em nuvem |
| Save versionado | Testes | Multi-personagem | Autenticação |
| Descansos | Event delegation | Condições | Backend |

## Métricas de sucesso
| Métrica | Baseline | Meta |
|---|---|---|
| App funciona 100% | 0% | 100% (fim Fase 0) |
| Cobertura de testes (lógica pura) | 0% | 90% (fim Fase 1) |
| LOC por arquivo | monólito | < 400 (fim Fase 2) |
| Tempo de load | n/a | < 200ms (Fase 3) |
| Bundle size | n/a | < 100KB (Fase 3) |
