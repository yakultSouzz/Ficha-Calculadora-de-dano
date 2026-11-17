# FASE 2 — Modularização + Vite + PWA + Save Versionado

Data: 2026-11-17

## Objetivo

Dividir o `index.html` standalone em módulos ES, adicionar build com Vite, configurar PWA instalável/offline e versionar a migração do save no `localStorage` sem perder os dados existentes.

## Estrutura criada

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Shell HTML apenas com `<link rel="stylesheet">`, `<link rel="manifest">` e `<script type="module" src="/src/main.js">` |
| `src/style.css` | Todo o CSS extraído da tag `<style>` |
| `src/state.js` | `defaultState`, constantes, `loadState`, `saveState` e `migrate` |
| `src/calc.js` | Funções puras de cálculo (mantidas como ES Modules) |
| `src/numpad.js` | Numpad, `numpadState`, `calcValues`, `calcTapHTML` e edição numérica |
| `src/ui.js` | Renderização, modais, toasts, ações de HP/descanso/inventário etc. |
| `src/history.js` | Histórico de rolagens, categoria e badge do FAB |
| `src/toast.js` | Toasts normais e de crítico |
| `src/utils.js` | Utilitários compartilhados (`esc`, `fmtMod`) |
| `src/main.js` | Importa CSS, carrega o save, injeta handlers globais e chama `renderAll()` |
| `public/manifest.json` | Manifesto PWA |

`src/utils.js`, `src/history.js` e `src/toast.js` foram adicionados como módulos auxiliares para evitar dependências circulares entre UI, numpad e histórico.

## Compatibilidade do código

- As funções usadas em `onclick`/`onchange` inline continuam disponíveis via `window`, atribuídas em `src/main.js`, preservando o HTML existente.
- As funções de cálculo continuam importadas/exportadas entre módulos.
- O app foi dividido sem remover funcionalidades da Fase 1.

## Save versionado

- Chave do save preservada: `ficha-v22`.
- `SAVE_VERSION = 3`.
- Todo save passa a gravar `version: 3`.
- `migrate(savedState)` normaliza estados antigos, incluindo:
  - `hp.temp`
  - `usedThisTurn` dos talentos
  - combate de talentos
  - migração do Envenenador de `1d8` para `2d8`
  - campos de bestas, inventário, habilidades e magias
  - raça antiga “Meio-Orc” → “Humano”
- `loadState()` executa a migração e persiste o estado normalizado.

## PWA

- `vite-plugin-pwa` instalado e configurado em `vite.config.js`.
- `registerType: 'autoUpdate'`.
- `manifest: false` no plugin para evitar um segundo manifesto padrão com nome/cores errados; o app usa o `public/manifest.json` customizado.
- Manifesto: nome “Ficha Kaelen”, short name “Kaelen”, `start_url: "/"`, `display: "standalone"`, cores `#e8dcb8` e `#6b1f11`, `icons: []`.
- Build gera `sw.js`, `registerSW.js` e precache dos assets principais para funcionamento offline.

## Validação

### Testes

```text
Test Files  1 passed (1)
Tests       10 passed (10)
```

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
PWA generateSW
precache 4 entries
dist/sw.js
dist/workbox-*.js
✓ built
```

### Preview

```text
/             -> 200
/manifest.json -> 200
/sw.js         -> 200
preview OK
```

Também foi executado um smoke test com DOM simulado: `renderAll()` nas três situações (combate, exploração e descanso), abertura de 11 modais e validação de todos os handlers inline. Sem erros.

## Configuração necessária no Vercel

- Framework Preset: **Vite**
- Build Command: **`npm run build`**
- Output Directory: **`dist`**
- Install Command: **`npm install`**

## Observações

- `node_modules` já estava versionado no repositório antes desta fase. Recomenda-se removê-lo do índice do Git (`git rm -r --cached node_modules`) e adicionar `node_modules/` e `dist/` ao `.gitignore` antes do próximo commit.
- `dist/` é artefato de build e não precisa ser enviado ao GitHub; o Vercel gera no deploy.
