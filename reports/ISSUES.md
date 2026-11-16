# 🐛 Issues — Ficha Kaelen v3

Legenda de status: 🔴 aberto · 🟡 em progresso · 🟢 resolvido
Legenda de esforço: S (<30min) · M (30min–2h) · L (>2h)

## Crítico
| ID | Área | Descrição | Esforço | Status |
|---|---|---|---|---|
| C1 | Build | Arquivo HTML truncado — falta metade do JS (renderAll, render*, openModal, saveModal, closeModal, descansos) | L | 🔴 |
| C2 | Regra/HP | applyDamage não consome state.hp.temp antes do HP real | S | 🔴 |
| C3 | Features | spendFeatUse incompleto — não decrementa uses.current nem reseta no descanso | M | 🔴 |
| C4 | Descanso | Descanso curto/longo ausentes — features.recharge nunca dispara | M | 🔴 |

## Alto
| ID | Área | Descrição | Esforço | Status |
|---|---|---|---|---|
| A1 | Estado | God state único, sem encapsulamento | L | 🔴 |
| A2 | Estrutura | Funções globais, sem módulos ES | L | 🔴 |
| A3 | Render | renderAll full re-render perde foco/scroll/input | M | 🔴 |
| A4 | Testes | Zero testes em funções puras | M | 🔴 |
| A5 | Código | diceInfo vs parseDiceToMap duplicam lógica | S | 🔴 |

## Médio
| ID | Área | Descrição | Esforço | Status |
|---|---|---|---|---|
| M1 | Dados | CAR 0 em Kaelen (placeholder esquecido) | S | 🔴 |
| M2 | Regra | Envenenador sem confirmação de "1x por turno" | S | 🔴 |
| M3 | UI | Slots bonus fora do breakdown visual | S | 🔴 |
| M4 | Features | Sem inspiração, condições, exaustão | M | 🔴 |
| M5 | Histórico | Sem export/sync | M | 🔴 |

## Oportunidades
| ID | Área | Descrição | Esforço | Status |
|---|---|---|---|---|
| O1 | PWA | Manifest + service worker (offline já funciona) | M | 🔴 |
| O2 | Persistência | Save versionado (_v:3 + migrate()) | S | 🔴 |
| O3 | Dados | Export/import JSON do personagem | S | 🔴 |
| O4 | UI | Multi-personagem (tabs) | M | 🔴 |

## Rastreabilidade por fase
| Fase | Issues |
|---|---|
| Fase 0 | C1, C2, C3, C4 |
| Fase 1 | A4, A5, M1, M2, M3 |
| Fase 2 | A1, A2, A3, O2 |
| Fase 3 | M4, M5, O1, O3, O4 |
