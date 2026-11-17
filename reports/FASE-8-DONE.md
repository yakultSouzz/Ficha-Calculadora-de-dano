# FASE 8 — Modo Escuro "Grimório Noturno"

Data: 2026-11-17

## Objetivo

Adicionar tema escuro persistente, com toggle no cabeçalho e paleta de alto contraste baseada em marrom, vinho e bege.

## Estado

- `defaultState` recebeu `theme: 'light'`.
- `migrate()` valida o campo e converte valores inválidos para `'light'`.
- O tema é salvo por personagem, junto com o restante do estado.

## Toggle

- Botão `🌙` / `☀️` adicionado ao grupo `.header-actions`.
- `toggleTheme()` alterna entre `light` e `dark`, salva, renderiza e mostra toast.
- O botão usa `aria-label`, `title` e `aria-pressed`.
- Estilo adicional: `.header-btn.theme-toggle`.

## Classes do body

`renderAll()` agora aplica:

```js
document.body.className =
  'mode-' + (state.situation || 'combat') +
  ' theme-' + (state.theme || 'light');
```

O `meta[name="theme-color"]` é atualizado dinamicamente:

- claro: `#e8dcb8`;
- escuro: `#12100e`.

## Paleta escura

Bloco `body.theme-dark` sobrescreve:

- fundos: `--bg-1: #12100e`, `--bg-2: #1c1815`;
- papéis/cards: `--paper: #2a231e`, `--paper-2: #221c18`, `--paper-3: #1a1512`;
- textos: `--ink: #e8dcb8`, com bege suavizado em `--ink-soft` e `--ink-dim`;
- vermelho vinho: `--red: #c76b54`, `--red-light: #e08b70`, `--red-deep: #7d2a1c`;
- bordas e sombras adaptadas ao fundo escuro;
- wash de modos reduzido para não ofuscar.

Também foram adicionados:

- `--surface` para inputs, cards, chips e fundos que antes usavam `#fff`;
- `--on-accent` para textos sobre botões de destaque, mantendo contraste no escuro.

As variantes de situação no escuro usam acentos próprios:

- combate: `#d4775c`;
- exploração: `#8dbb73`;
- descanso: `#a58ce0`.

## Correções de fundo branco

Todas as ocorrências de fundo `#fff` no CSS foram trocadas por `var(--surface)`, incluindo:

- `.num-field`;
- inputs de modal;
- chips e botões do Numpad;
- `.radio-option`;
- `.class-item`;
- campo de busca de magias.

Textos que usavam `var(--paper)`, `white` ou `#fff` sobre fundos de destaque passaram a usar `var(--on-accent)`.

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
✓ built in 332ms
PWA v2.0.0
precache 6 entries (163.78 KiB)
```

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/style.css`
- `reports/FASE-8-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhuma alteração em `src/calc.js` ou nos testes existentes.
