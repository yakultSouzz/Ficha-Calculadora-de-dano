# FASE 13 — Editor Avançado de Forma Selvagem, Multiattack e Uso de Equipamento

Data: 2026-11-25

## Objetivo

Permitir edição profunda da ficha das feras (múltiplos ataques, traços estruturados e Ataque Múltiplo) e liberar, por fera, o uso de equipamento do personagem durante a Forma Selvagem.

## Bloco A — Estado (`src/state.js`)

### Novo campo

Todas as feras padrão passam a ter:

```js
canUseEquipment: false
```

Aplicado a:

- Urso Marrom (`brownBear`);
- Lobo Gigante (`direWolf`);
- Urso Negro (`blackBear`);
- Tigre (`tiger`).

`emptyBeast()` também cria novas feras com `canUseEquipment: false`.

### Migração

`migrate()` agora garante, para cada besta salva:

- `canUseEquipment` do tipo boolean (saves antigos recebem `false`);
- `traits` como array (o valor ausente/inválido vira `[]`);
- `attacks` como array não vazio (cópia independente do modelo quando ausente/vazio);
- `multiattack` como string (padrão `''`).

Um save com `canUseEquipment: true` continua `true` após a migração.

## Bloco B — Modal de Edição de Besta (`src/ui.js`)

`openBeastEdit(key)` substitui o stub `showToast('em breve')` e o antigo modal de ataque único. `openBeastModal(key)` virou compatibilidade e delega para o novo editor.

### Campos do modal

- Identidade: **Nome**, **CR**, **CA** e **HP**.
- Velocidades em metros: **Caminhada**, **Escalada**, **Natação** e **Voo**.
- Atributos: **FOR**, **DES**, **CON**, **INT**, **SAB** e **CAR**.
- Sentidos e perícias (mantidos do editor anterior).
- Checkbox **“Pode usar equipamento?”** ligado a `canUseEquipment`.
- Campo de texto **“Ataque Múltiplo”** ligado a `multiattack`.
- Lista dinâmica de **Ataques**.
- Lista dinâmica de **Traços**.

Campos numéricos continuam usando o teclado numérico customizado (`window.openNumericNumpad`).

### Lista dinâmica de ataques

Cada ataque é renderizado em um cartão com botão **Remover** e os campos:

- Nome;
- Dado de Dano;
- Modificador de Acerto;
- Tipo de Dano;
- Alcance e Efeito Extra (preservados das fichas existentes).

O botão **“+ Adicionar Ataque”** insere uma nova linha sem perder o que já foi digitado: os valores são mantidos em `modalBeastAttacks` via handlers `oninput` (o array é mutado no lugar, mantendo a referência exposta em `window`).

### Lista dinâmica de traços

Cada traço possui **Nome**, **Descrição** e botão **Remover**. O botão **“+ Adicionar Traço”** insere uma nova linha em `modalBeastTraits`, com o mesmo padrão de edição sem perda de dados.

### Salvamento

`saveModal()` continua coletando os campos com `name` e o checkbox. O `onSave` do editor normaliza e grava em `state.beasts[key]`:

- nomes e textos aparados;
- números convertidos com limites/padrões seguros;
- `saves` preservados;
- `skills` reconstruídos a partir da lista de perícias válidas;
- `attacks` e `traits` como arrays estruturados;
- `canUseEquipment` como boolean;
- `multiattack` como texto.

Se todos os ataques forem removidos, um ataque padrão é criado para manter a besta utilizável no combate. Novas feras recebem chave `b_<timestamp>` e viram `activeBeast`.

### Acesso na UI

O cabeçalho de cada besta em **Formas Selvagens** agora exibe o botão **“✏️ Editar”**, que chama `openBeastEdit(key)`. O botão **“+ Nova Forma”** também usa o novo editor.

## Bloco C — Integração com Equipamento (`src/ui.js`)

### `renderCombatPanel()` / `renderCombat()`

- Fora da Forma Selvagem: painel de armas normal.
- Na Forma Selvagem com `canUseEquipment: false`: **apenas** o card da besta e seus ataques naturais; o painel de armas fica oculto.
- Na Forma Selvagem com `canUseEquipment: true`: card da besta + seção **“⚙️ Equipamento da Fera”**, com:
  - as armas do personagem (rolagens de acerto/dano/crítico e botões de mão principal/inábil);
  - os itens do inventário com `availableInWild: true` e quantidade maior que zero, exibidos com nome, quantidade e descrição.

### Equipamento durante a transformação

`equipWeapon(id, hand)` não bloqueia mais o uso de armas quando:

```js
isWild() && state.beasts[state.activeBeast]?.canUseEquipment === true
```

Com `canUseEquipment: false`, a mensagem antiga (“Desative Forma Selvagem primeiro”) continua valendo. As regras de `Leve`, `Duas Mãos` e mão inábil permanecem as mesmas da Fase 12.

Quando a besta pode usar equipamento, `calcWeaponAttack()` usa os atributos da fera no cálculo de armas que usam FOR/DES; fora dessa condição, o cálculo continua usando os atributos do personagem.

`isItemAvailable()` também respeita a permissão da fera: itens marcados como disponíveis na Forma só ficam efetivamente disponíveis se a besta ativa puder usar equipamento. Isso afeta os badges do inventário e os lembretes.

### Ataque Múltiplo

O texto de `multiattack` passa a ser exibido:

- no card da besta no combate, como **“Ataque Múltiplo: …”**;
- em **Cenário Atual**, em uma linha dedicada quando a fera está ativa.

Exemplo: `Ataque Múltiplo: Uma Mordida e uma Garras.`

O cenário também foi protegido contra listas de ataques vazias.

## Estilos (`src/style.css`)

Adicionados:

- `.beast-edit-btn`;
- `.beast-equip-badge`;
- `.wild-equipment` / `.wild-equipment-title`;
- `.wild-items` / `.wild-item` / `.wild-item-name` / `.wild-item-desc`;
- `.beast-edit-list` / `.beast-edit-row` / `.beast-edit-row-head` e ajustes internos de campos.

## Validação

### Testes

```text
Test Files  2 passed (2)
Tests       22 passed (22)
```

Inclui novos testes de estado:

- todas as feras padrão começam com `canUseEquipment: false`;
- migração de bestas antigas recebe `canUseEquipment: false`, `attacks` não vazio, `traits: []` e `multiattack: ''`;
- uma besta antiga com `canUseEquipment: true` mantém o valor.

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
✓ built in 313ms
PWA v2.0.0
precache 6 entries (177.76 KiB)
```

### Smoke checks manuais (via Node)

- `renderCombatPanel()` oculta `Machadinha` na forma sem permissão e a exibe com permissão;
- itens com `availableInWild: true` aparecem na seção de equipamento;
- `renderBeastsPanel()` contém o botão “✏️ Editar”;
- abrir, adicionar/remover ataques e traços e salvar o modal grava corretamente `state.beasts[key]`.

## Arquivos alterados

- `src/state.js`
- `src/ui.js`
- `src/style.css`
- `tests/state.test.js`
- `reports/FASE-13-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Feras já cadastradas continuam sem equipamento até que a opção seja marcada no editor.
