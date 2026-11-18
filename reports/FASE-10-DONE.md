# FASE 10 — Economia de Ações e Combate com Duas Armas

Data: 2026-11-18

## Objetivo

Adicionar rastreamento de Ação, Ação Bônus e Reação ao painel de combate, suportar a Machadinha de mão inábil sem modificador de atributo no dano e consumir Ação Bônus ao ativar Fúria/Forma Selvagem ou usar a arma inábil.

## Estado

- `defaultState.actionsUsed` adicionado:
  ```js
  { action: false, bonus: false, reaction: false }
  ```
- `migrate()` garante o objeto, mescla valores ausentes e valida cada chave como booleano.
- Segunda Machadinha adicionada às armas de Kaelen:
  - `id: 'w_axe_off'`
  - `name: 'Machadinha +2 (Mão Inábil)'`
  - `isOffHand: true`
- `migrate()` adiciona a arma inábil em saves existentes de Kaelen que ainda não a possuem, sem duplicar.

## Cálculo

Em `calcWeaponAttack()`:

- Armas com `isOffHand: true` não somam o modificador de atributo ao dano.
- O bônus mágico, bônus fixo da arma, bônus de Fúria (`+2` para armas de FOR) e bônus de talentos continuam sendo aplicados.
- O modificador de atributo continua valendo normalmente para o acerto.

Exemplo testado com FOR 16 e Machadinha +2:

- Acerto: `prof 3 + FOR 3 + mágico 2 = +8`
- Dano base inábil: `+2` (somente mágico)
- Dano inábil em Fúria: `+4` (mágico + Fúria)

## UI

- `renderCombat()` agora exibe `.action-tracker` abaixo do Round:
  - `🟢 Ação`
  - `🟡 Bônus`
  - `🔵 Reação`
- `toggleAction(type)` alterna o estado, salva e re-renderiza.
- Ações gastas recebem `.used`, com `line-through` e opacidade reduzida.
- `nextTurn()` reseta `actionsUsed` para todos falsos.
- `resetCombat()` também reseta a economia de ações.
- `toggleEffect()` marca Ação Bônus ao ativar `rage` ou `wild`.
- O Numpad recebeu suporte a `usageAction`:
  - botões de ataque/dano/crítico da arma inábil enviam `bonus`;
  - a marcação ocorre ao confirmar a rolagem;
  - hook `actionUsed` chama `markActionUsed('bonus')`.
- `markActionUsed(type)` evita marcar novamente caso a ação já esteja gasta.

## Estilos

Adicionados em `src/style.css`:

- `.action-tracker`
- `.action-tracker-title`
- `.action-buttons`
- `.action-btn`
- `.action-btn.used`

Todos usam variáveis existentes, mantendo suporte ao tema claro e escuro.

## Validação

### Testes

```text
Test Files  2 passed (2)
Tests       14 passed (14)
```

Novo teste de cálculo cobre a arma inábil com e sem Fúria. Teste de migração valida `actionsUsed` e a arma `w_axe_off`.

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
✓ built in 965ms
PWA v2.0.0
precache 6 entries (167.94 KiB)
```

## Arquivos alterados

- `src/state.js`
- `src/calc.js`
- `src/ui.js`
- `src/numpad.js`
- `src/style.css`
- `tests/calc.test.js`
- `tests/state.test.js`
- `reports/FASE-10-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhuma alteração em regras de magia, descanso ou cálculo de formas selvagens.
