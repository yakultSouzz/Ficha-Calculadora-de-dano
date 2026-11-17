# FASE 9 — Inspiração como Contador no Final da Ficha

Data: 2026-11-17

## Objetivo

Remover o toggle de inspiração do cabeçalho e transformá-la em um contador persistente de 0 a 5, exibido no final da ficha.

## Estado

- `defaultState.inspiration` passou de `false` para `0`.
- `createCharacter()` inicializa `inspiration` com `0`.
- `migrate()` converte saves antigos:
  - `true` → `1`;
  - `false` → `0`;
  - strings/valores numéricos são convertidos para número;
  - o resultado é arredondado e limitado entre `0` e `5`.
- Valores inválidos viram `0`.

## UI

- Botão `🌟` removido de `.header-actions` em `renderHeader()`.
- Nova função `renderInspirationPanel()`:
  - painel `.panel.inspiration-panel`;
  - título colapsável “🌟 Inspiração”;
  - botão `−`, display central e botão `+`;
  - botões ficam desabilitados nos limites 0 e 5;
  - painel insere-se no final da ficha via `renderAll()`, depois de inventário/formas.
- Nova função `setInspiration(delta)`:
  - lê o valor atual;
  - aplica o delta;
  - limita entre 0 e 5;
  - chama `save()` e `renderAll()`.
- `toggleInspiration()` foi removida.

## Estilos

Adicionados em `src/style.css`:

- `.inspiration-panel` com borda superior dourada;
- `.inspiration-panel .panel-title` com acento dourado;
- `.inspiration-control` em grid centralizado;
- `.insp-btn` circular com estética de pergaminho;
- estados `:active` e `:disabled`;
- `.inspiration-display` com número grande, fundo `--paper-2`, borda `--gold-light` e cor `--gold`.

Todos usam as variáveis existentes, funcionando também no tema escuro.

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
✓ built in 720ms
PWA v2.0.0
precache 6 entries (165.27 KiB)
```

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/style.css`
- `reports/FASE-9-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhuma alteração em `src/calc.js` ou nos testes existentes.
