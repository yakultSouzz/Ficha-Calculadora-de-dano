# FASE 5 — Polimento de Combate: Turnos, Concentração e Vantagem/Desvantagem

Data: 2026-11-17

## Objetivo

Adicionar controle de turnos de combate, estado de concentração com teste de CON ao sofrer dano e suporte a rolagens com vantagem/desvantagem no Numpad.

## Estado persistido

Novos campos em `defaultState` e normalizados no `migrate()`:

```json
{
  "combatRound": 1,
  "concentration": false
}
```

`combatRound` é limitado a inteiros a partir de 1. Saves antigos recebem os valores padrão automaticamente.

## Turnos

- `nextTurn()` incrementa `combatRound`, reseta `usedThisTurn` dos talentos de combate (Envenenador) e salva/renderiza.
- `resetCombat()` volta o round para 1.
- A barra `⚔️ Round: N` foi adicionada no início de `renderCombatPanel()`, antes dos toggles de efeitos.
- O antigo botão isolado “🔄 Novo Turno” foi removido de `renderCombatFeatToggles()`.

## Concentração

- Toggle `🧠 Concentração` na barra de turnos, com estado ativo persistido.
- `toggleConcentration()` alterna o estado e exibe toast.
- Em `applyDamage()`, quando concentrado e o dano é maior que zero:
  - CD calculada como `Math.max(10, Math.floor(dano / 2))`.
  - Toast: `🧠 Dano! Teste de Concentração CD X`.
  - Numpad d20 abre com modificador de CON.
  - O callback apenas fecha o Numpad, sem registrar a rolagem como ataque.
- A concentração não é encerrada automaticamente após o teste; o jogador decide quando desativar.

## Vantagem e Desvantagem no Numpad

- Linha `Normal / Vantagem / Desvantagem` exibida apenas para rolagens de d20.
- `numpadState` recebeu `rollMode`, `value2` e `activeRoll`.
- No modo vantagem/desvantagem, o display mostra dois valores (`15 / 18`).
- O primeiro valor é preenchido normalmente; o segundo pode ser selecionado tocando no display.
- Valores de dois dígitos avançam automaticamente para o segundo dado.
- `npConfirm()` usa:
  - `Math.max(n1, n2)` em vantagem;
  - `Math.min(n1, n2)` em desvantagem;
  - soma do modificador normalmente.
- O histórico e o toast identificam `(Vantagem)` ou `(Desvantagem)` e exibem os dois valores rolados.
- Chips, teclado e backspace operam no dado ativo.

## Estilos

Adicionados usando as variáveis existentes:

- `.combat-turn-bar`, `.combat-turn-top`, `.combat-round`
- `.combat-turn-actions`, `.btn-action.btn-turn`, `.btn-action.btn-turn.reset`
- `.toggle-btn.concentration`
- `.numpad-roll-modes`, `.numpad-mode-btn`, `.np-roll-slot`, `.np-roll-sep`

## Validação

### Testes

```text
Test Files  2 passed (2)
Tests       13 passed (13)
```

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
✓ built in 1.03s
PWA v2.0.0
precache 6 entries (157.09 KiB)
```

### Smoke test do Numpad

Script temporário com DOM mínimo confirmou:

- vantagem escolhe o maior valor;
- desvantagem escolhe o menor valor;
- modo normal mantém a rolagem única;
- digitação sequencial `12` / `18` confirma 18 em vantagem;
- rolagem incompleta não confirma.

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/numpad.js`
- `src/style.css`
- `index.html`
- `reports/FASE-5-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- `src/calc.js` e os 10 testes originais de cálculo não foram alterados.
