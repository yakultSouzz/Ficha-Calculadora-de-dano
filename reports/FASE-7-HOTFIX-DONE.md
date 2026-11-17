# FASE 7 — HOTFIX: Teclado Numérico por Clique Direto

Data: 2026-11-17

## Problema

A implementação anterior interceptava `pointerdown`, `click` e `focusin` com `preventDefault()` em fase de captura. No celular, isso competia com o comportamento nativo de foco e fazia o Numpad exigir múltiplos toques para abrir.

## Mudança de estratégia

- Removidos de `src/main.js`:
  - listener global de `pointerdown`;
  - listener global de `click`;
  - listener global de `focusin`;
  - variáveis de deduplicação e a função local de abertura.
- `src/main.js` voltou apenas a expor os módulos globais, carregar o estado e iniciar o app.
- Nenhum `MutationObserver` foi necessário: todos os `input[type="number"]` passaram a nascer com o handler inline.

## HTML dos inputs

Todos os 33 `<input type="number">` gerados em `src/ui.js` agora são criados com:

```html
<input type="number" readonly inputmode="none" onclick="window.openNumericNumpad(this)">
```

O atributo `readonly` impede o teclado nativo, `inputmode="none"` reforça a ausência de teclado virtual e o `onclick` abre o Numpad diretamente no primeiro toque.

## Função global

`openNumericNumpad(el)` foi movida para `src/ui.js` e exportada. Como `main.js` já faz `Object.assign(window, ui, numpad, history, toast)`, ela fica disponível como `window.openNumericNumpad`.

A função:

- mantém `inputmode="none"` e `readOnly = true`;
- lê `min` e `max` do input, com padrão `0` e `999`;
- usa `name`, `id` ou `placeholder` como label;
- chama `openNumpadDirect()` com `mode: 'number'` e o valor atual;
- no `onConfirm`, atualiza `el.value` e dispara eventos `input` e `change`.

## Compatibilidade

- `saveModal()` continua lendo os valores diretamente do DOM via `#modalBody [name]`.
- Os `.num-field` com `openNumberEditor(this)` não foram alterados e não recebem o handler global.
- Inline handlers são criados junto com cada input dinâmico, então não há conflito com re-renderizações.

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
✓ built in 1.33s
PWA v2.0.0
precache 6 entries (162.01 KiB)
```

## Arquivos alterados

- `src/main.js`
- `src/ui.js`
- `reports/FASE-7-HOTFIX-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhuma alteração em `src/calc.js` ou nos testes existentes.
