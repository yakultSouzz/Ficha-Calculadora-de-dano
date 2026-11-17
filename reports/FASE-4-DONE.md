# FASE 4 — Multi-personagem com Tabs e Migração de Save

Data: 2026-11-17

## Objetivo

Evoluir o save de personagem único para um banco local com múltiplos personagens, adicionar abas para alternar entre eles e preservar integralmente o save existente (Kaelen).

## Estrutura do save

O `localStorage` continua usando a chave `ficha-v22`, mas o conteúdo agora é:

```json
{
  "activeId": "id_do_personagem_ativo",
  "characters": {
    "id_do_personagem_1": { "...defaultState...": true },
    "id_do_personagem_2": { "...defaultState...": true }
  }
}
```

Cada personagem mantém seu próprio estado completo: HP, atributos, condições, inventário, magias, efeitos e histórico de rolagens.

## Migração

`loadState()` detecta automaticamente o formato:

- **Formato novo:** lê `characters` e `activeId`, migra cada personagem e normaliza o ativo.
- **Formato antigo (personagem único):** cria um `id` com `Date.now().toString()`, coloca o personagem em `characters`, define como `activeId` e salva no novo formato.

O save antigo de Kaelen não é descartado nem sobrescrito antes da conversão.

## Funções de estado

- `getActiveCharacter()`: retorna o personagem apontado por `activeId`.
- `switchCharacter(id)`: troca o ativo, atualiza a referência global `state` e persiste.
- `createCharacter(name)`: cria um personagem com atributos base 10, nível 1, 10 HP, 1 DV, arma desarmada e histórico vazio.
- `deleteCharacter(id)`: remove um personagem e ativa outro; impede excluir o último.
- `getActiveId()` e `getCharacters()`: auxiliam a renderização das abas.

A variável exportada `state` continua sendo uma referência viva ao personagem ativo. Ao trocar de personagem, `state` aponta para o objeto dentro de `characters`, então os módulos existentes passam a ler o personagem correto sem duplicar cópias.

## UI — Abas de personagens

- `renderCharTabs()` adiciona uma barra horizontal acima do cabeçalho.
- Cada personagem tem uma `.char-tab`; a aba ativa recebe `.active`.
- A aba ativa exibe um `✕` para excluir, com `confirm()` antes.
- O botão `.char-tab-add` (`+`) pede o nome com `prompt()`, cria o personagem e já o ativa.
- `switchCharacterTab()`, `promptNewCharacter()` e `confirmDeleteCharacter()` concentram as ações de UI.
- O cabeçalho agora lê `getActiveCharacter()` para exibir nome, classes, raça, nível e proficiência.
- O botão “✏ Editar” continua alterando somente o personagem ativo.

## Histórico por personagem

`src/history.js` passou a obter o personagem ativo por `getActiveCharacter()` em cada operação. Como cada personagem possui seu próprio `history`, o log de rolagens, o badge do FAB e as entradas do modal são independentes ao trocar de aba.

## Exportar / Importar

- Exportação baixa o personagem ativo com nome de arquivo derivado do nome dele.
- Importação substitui apenas o personagem ativo, preservando os demais personagens do banco.

## Estilos

Adicionados em `src/style.css`, usando as variáveis existentes:

- `.char-tabs`, `.char-tab`, `.char-tab.active`
- `.char-tab-name`, `.char-tab-close`, `.char-tab-add`

A barra usa `overflow-x: auto` e esconde a scrollbar, mantendo a rolagem horizontal no celular.

## Validação

### Testes

```text
Test Files  2 passed (2)
Tests       13 passed (13)
```

Além dos 10 testes de cálculo existentes, foram adicionados 3 testes em `tests/state.test.js`:

- migração de save antigo de personagem único;
- criação, troca e exclusão de personagens;
- persistência do personagem ativo após recarregar o estado.

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
PWA generateSW
precache 6 entries
✓ built
```

### Smoke test

- Save antigo foi migrado para `{ activeId, characters }`.
- Aba renderizada com a classe ativa.
- Botão `+` presente.
- Cabeçalho exibindo o personagem ativo.

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/history.js`
- `src/style.css`
- `tests/state.test.js` (novo)
- `reports/FASE-4-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Não houve alteração em `src/calc.js` nem nos 10 testes originais.
