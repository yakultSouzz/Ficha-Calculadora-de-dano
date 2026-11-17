# FASE 7 — Padronização do Teclado Numérico

Data: 2026-11-17

## Objetivo

Impedir que o teclado nativo do Android/iOS apareça em campos numéricos e redirecionar todas as edições para o Numpad customizado.

## Interceptação global

`src/main.js` agora registra listeners globais em fase de captura para:

- `pointerdown`: intercepta antes do foco padrão, chama `preventDefault()` e abre o Numpad;
- `click`: fallback para ambientes sem Pointer Events, com proteção contra abertura duplicada;
- `focusin`: fallback para foco por teclado/programático, com `preventDefault()`, `blur()` e abertura do Numpad.

A deduplicação usa o último input e um intervalo de 400 ms, evitando abrir o Numpad duas vezes para o mesmo toque.

## Campos atendidos

- Todos os `input[type="number"]` do app, incluindo os criados dinamicamente dentro de modais.
- Os `.num-field` existentes continuam usando `openNumberEditor(this)`; o listener global ignora explicitamente esses elementos para não conflitar.

## Configuração passada ao Numpad

`openNumericNumpad(el)` lê o input e chama `openNumpadDirect()` com:

- `mode: 'number'`;
- `label`: `name`, `id` ou `placeholder` do input;
- `value`: valor atual;
- `min`: atributo `min` ou `0`;
- `max`: atributo `max` ou `999`;
- `onConfirm`: atualiza o valor e dispara eventos `input` e `change`.

## Bloqueio do teclado nativo

Ao interceptar o campo:

- `inputmode="none"` é aplicado dinamicamente;
- `readOnly = true` é definido;
- `blur()` é chamado imediatamente.

Isso cobre toque, clique e foco por teclado sem deixar o teclado do sistema subir.

## Compatibilidade com `saveModal()`

O callback do Numpad escreve diretamente em `el.value` e dispara:

```js
new Event('input', { bubbles: true })
new Event('change', { bubbles: true })
```

Como `saveModal()` continua lendo `#modalBody [name]` diretamente do DOM, os valores confirmados pelo Numpad são salvos normalmente. O mesmo vale para os `.num-field`, que atualizam `dataset.value` e `textContent`.

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
✓ built in 1.10s
PWA v2.0.0
precache 6 entries (160.40 KiB)
```

## Arquivos alterados

- `src/main.js`
- `reports/FASE-7-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhum campo `.num-field` teve sua lógica alterada; apenas os `input[type="number"]` passaram a ser interceptados globalmente.
