# FASE 12 — Equipamento de Armas por Mãos

Data: 2026-11-18

## Objetivo

Substituir o controle booleano `active` por um sistema de mãos (`main`, `off`, `none`), permitindo Combate com Duas Armas e respeitando as propriedades Leve e Duas Mãos.

## Estado

As armas agora usam:

```js
equipState: 'none' | 'main' | 'off'
```

Armas padrão de Kaelen:

- Machadinha +2 (Fogo): `main`
- Machadinha +2 (Mão Inábil): `off`
- Tridente +1: `none`

Novos personagens recebem o Ataque Desarmado como `main`.

### Migração

`migrate()` converte saves antigos:

- `active: true` → `equipState: 'main'`;
- `w_axe_off` ou `isOffHand: true` → `equipState: 'off'`;
- `active: false` → `equipState: 'none'`;
- valores inválidos → `none`.

Durante a migração:

- a propriedade antiga `active` é removida;
- `isOffHand` persistido é removido;
- a arma inábil de Kaelen é adicionada caso ainda não exista.

## Cálculo

`calcWeaponAttack()` agora considera mão inábil por:

```js
weapon.equipState === 'off' || weapon.isOffHand === true
```

A arma inábil continua sem somar o modificador de atributo no dano, mantendo bônus mágico, bônus fixo, Fúria e talentos. O modificador de atributo continua valendo no acerto.

## UI

Cada cartão de arma agora possui:

- botão `Mão Principal`;
- botão `Mão Inábil` quando a arma não é de duas mãos;
- classe `.equipped` no botão correspondente ao estado atual;
- badge `Principal` ou `Inábil`;
- borda destacada quando equipada.

O botão de Mão Inábil é ocultado para armas cujo texto de propriedades contém “Duas mãos”.

### `equipWeapon(id, hand)`

Regras implementadas:

- `main`:
  - desequipa outras armas da mão principal;
  - se a arma for de duas mãos, desequipa todas as armas da mão inábil;
  - equipa a arma como `main`.
- `off`:
  - exige a propriedade “Leve”;
  - se não for Leve, exibe:
    ```text
    ⚠️ Esta arma não pode ser usada na mão inábil (não é Leve).
    ```
  - desequipa outras armas da mão inábil;
  - desequipa uma arma de duas mãos da mão principal, se houver;
  - equipa a arma como `off`.
- Em ambos os casos: salva, renderiza e mostra toast de sucesso.

`selectWeapon()` e `toggleWeapon()` agora delegam para `equipWeapon(id, 'main')`.

O modal de arma preserva o `equipState` ao editar. Armas novas entram como `none`, exceto quando são a primeira arma do personagem, que entra como `main`.

O cenário atual prioriza a arma da mão principal e usa a inábil como fallback.

## Estilos

Adicionados/ajustados em `src/style.css`:

- `.atk-card.equipped`;
- `.atk-heading`;
- `.weapon-hand-controls`;
- `.hand-btn`;
- `.hand-btn.equipped`;
- `.hand-btn.off.equipped`;
- `.atk-tag.off`.

Os estados equipados usam `--red` para a mão principal e `--green` para a inábil.

## Validação

### Testes

```text
Test Files  2 passed (2)
Tests       20 passed (20)
```

Inclui teste de migração de `active` para `equipState`, validação da remoção das propriedades antigas e cálculo da arma inábil usando `equipState: 'off'`.

### Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
✓ built in 786ms
PWA v2.0.0
precache 6 entries (171.89 KiB)
```

## Arquivos alterados

- `src/state.js`
- `src/calc.js`
- `src/ui.js`
- `src/style.css`
- `tests/calc.test.js`
- `tests/state.test.js`
- `reports/FASE-12-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- A regra de Ação Bônus para ataques com a mão inábil continua ativa via `usageAction`.
