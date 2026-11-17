# FASE 3 — Produto & UX (Export/Import, Inspiração, Condições e PWA Icons)

Data: 2026-11-17

## Objetivo

Adicionar recursos de mesa de jogo (backup da ficha, inspiração, exaustão e condições) e finalizar o ícone do PWA, preservando a estética e as variáveis CSS existentes.

## Implementações

### A — Exportar / Importar JSON

- `src/state.js`
  - `exportState()`: serializa o estado atual, cria um `Blob` JSON, gera um link temporário com `download="ficha-kaelen.json"` e dispara o download.
  - `importState(file)`: lê o arquivo via `FileReader`, faz o parse do JSON, aplica `migrate()`, persiste no `localStorage`, atualiza o estado global, chama `renderAll()` e exibe toast de sucesso.
- `src/ui.js`
  - Botões `📤` (Exportar) e `📥` (Importar) adicionados ao lado de “✏ Editar” no cabeçalho.
  - Importação acionada por um `<input type="file" accept=".json,application/json" hidden>`.

### B — Inspiração

- `defaultState.inspiration: false` e normalização no `migrate()`.
- Botão `🌟` no cabeçalho: dourado/brilhante quando ativo e apagado/em escala de cinza quando inativo.
- `toggleInspiration()` inverte o valor, salva, renderiza novamente e exibe toast.

### C — Condições e Exaustão

- `defaultState.exhaustion: 0` e `defaultState.conditions: []`.
- `migrate()` normaliza a exaustão para o intervalo 0–6 e garante que `conditions` seja um array.
- Novo painel `💀 Condições & Exaustão` (`.panel`) logo abaixo da barra de atributos nas três situações:
  - Controle de exaustão com botões `−` / `+`, 6 bolinhas clicáveis e contador `N/6`.
  - Chips alternáveis para Caído, Envenenado, Amedrontado, Atordoado e Inconsciente.
- Funções `setExhaustion(level)` e `toggleCondition(condition)` em `src/ui.js`.

### D — PWA Icons

- `public/icon.svg` criado com fundo `#6b1f11`, moldura dourada e letra “K” em `#e8dcb8`.
- `public/manifest.json` atualizado com `/icon.svg`, `"sizes": "any"` e `"type": "image/svg+xml"`.
- `vite.config.js` atualizado com `includeAssets: ['icon.svg', 'manifest.json']` para incluir os arquivos no precache do service worker.

### Estilos

- Novos estilos em `src/style.css` usando apenas variáveis existentes:
  - `.header-actions`, `.header-btn`, estado `.inspiration.active`
  - `.exhaustion-row`, `.exh-step`, `.exh-dot`, `.exh-value`
  - `.condition-chips`, `.condition-chip`
- Ajuste responsivo para o cabeçalho em telas pequenas.

## Validação

### Testes

```text
Test Files  1 passed (1)
Tests       10 passed (10)
```

### Build

```text
vite v8.3.8 building client environment for production...
✓ 13 modules transformed.
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
PWA generateSW
precache 6 entries (148.42 KiB)
dist/sw.js
dist/workbox-*.js
✓ built
```

O build concluiu sem erros. A importação usa a função `renderAll` já exposta em `window` por `src/main.js`, evitando dependência circular entre `state.js` e `ui.js`.

### PWA

```text
dist/icon.svg       -> presente
dist/manifest.json  -> icons aponta para /icon.svg
dist/sw.js          -> icon.svg no precache
```

### Preview

```text
/               -> 200
/manifest.json  -> 200
/sw.js          -> 200
/icon.svg       -> 200
```

### Smoke test

- Export gerou e clicou no link de download.
- Import aplicou a migração, salvou no `localStorage` e chamou `renderAll()`.
- Import normalizou exaustão `99` para `6` e `conditions: null` para `[]`.
- Cabeçalho renderizou a estrela e o painel de condições com os 5 chips.

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/style.css`
- `public/icon.svg` (novo)
- `public/manifest.json`
- `vite.config.js`
- `reports/FASE-3-DONE.md` (novo)

## Observações

- Nenhuma alteração visual fora do cabeçalho e do novo painel de condições.
- O push fica a cargo do usuário.
