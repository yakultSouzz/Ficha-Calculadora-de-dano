# FASE 6 — UX de Magias: Cartas Colapsáveis e Filtro de Pesquisa

Data: 2026-11-17

## Objetivo

Reduzir a altura do painel de magias transformando cada magia em uma carta colapsável e adicionar pesquisa por nome.

## Estado persistido

- `defaultState` recebeu `expandedSpells: []`.
- `migrate()` garante que saves anteriores tenham `expandedSpells` como array.
- Cada personagem mantém sua própria lista de magias expandidas.

## Cartas colapsáveis

Cada `.spell-card` agora começa fechada:

- cabeçalho com ícone `▸`, nome, nível e botão de edição;
- botões de rolagem de dano/cura e crítico continuam visíveis;
- `.spell-meta`, `.spell-combat`, linha de acerto e `.spell-desc` ficam ocultos.

Ao clicar no cabeçalho:

- `toggleSpellExpand(id)` adiciona ou remove o ID de `state.expandedSpells`;
- a carta é re-renderizada aberta com ícone `▾`;
- todos os detalhes aparecem, incluindo descrição, metadados, combate e acerto;
- o estado é salvo com `save()` antes de `renderAll()`.

O botão de edição usa `event.stopPropagation()` para não abrir/fechar a carta ao ser tocado.

## Pesquisa

- Input `.spell-search-input` no topo do painel, com placeholder `🔍 Pesquisar magia...`.
- `oninput` chama `filterSpells(this.value)`.
- A query fica em `window.spellSearchQuery`.
- A filtragem usa `name.toLowerCase().includes(query.toLowerCase())`.
- `filterSpells()` chama `renderSpellsPanel()`, que substitui apenas o painel de magias no DOM, e devolve o foco ao input.
- Quando a busca não encontra resultados, aparece “Nenhuma magia encontrada.”
- O botão `+ Nova Magia` permanece no final da lista.

## Estilos

- `.spell-search-input` com fundo branco, borda da ficha, foco destacado e fonte padrão.
- `.spell-card` com cantos arredondados, transição `all 0.2s` e estado `.open`.
- `.spell-header` com `cursor: pointer`.
- `.spell-expand-icon` com cor alterada quando aberto.
- `.spell-rolls` mantém os botões de rolagem alinhados à direita/embaixo, inclusive com a carta fechada.

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
✓ built in 1.06s
PWA v2.0.0
precache 6 entries (159.33 KiB)
```

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/style.css`
- `reports/FASE-6-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- `src/calc.js` e os 10 testes originais de cálculo não foram alterados.
