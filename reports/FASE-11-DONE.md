# FASE 11 — Resistência a Dano da Fúria e Totem do Urso

Data: 2026-11-18

## Objetivo

Aplicar automaticamente a resistência da Fúria no dano recebido, incluindo a resistência ampla do Totem do Urso, e permitir informar o tipo de dano no modal de HP.

## Lógica pura

Nova função exportada em `src/calc.js`:

```js
applyRageResistance(amount, damageType, isRaging, isTotemBear)
```

Regras implementadas:

- Sem Fúria ou dano `<= 0`: retorna o valor original.
- Fúria normal:
  - cortante, perfurante ou impacto → metade (`Math.floor`);
  - demais tipos → valor original.
- Totem do Urso:
  - qualquer tipo exceto psíquico → metade;
  - psíquico → valor original.
- O tipo de dano é normalizado para minúsculas e sem acentos, aceitando `Psíquico`, `psiquico`, etc.
- Função também adicionada ao objeto `Calc`.

## UI

### Seletor de tipo de dano

Em `openHPModal()`, a seção “Tomar Dano” agora possui:

- campo de quantidade;
- `<select id="dmgType" name="dmgType">` com:
  - Cortante (padrão)
  - Perfurante
  - Impacto
  - Fogo
  - Gélido
  - Ácido
  - Elétrico
  - Trovejante
  - Venenoso
  - Psíquico
  - Radiante
  - Necrótico
  - Força
- botão “Aplicar Dano”.

`applyDamageModal()` captura o tipo selecionado e chama:

```js
applyDamage(a, type)
```

### Aplicação do dano

`applyDamage(amount, damageType = 'cortante')` agora:

- calcula `isTotemBear` com `hasTotemBear()`;
- calcula `finalDamage` com `applyRageResistance(amount, damageType, isRage(), isTotemBear)`;
- subtrai HP usando `finalDamage`;
- usa o dano final no overflow da Forma Selvagem;
- mostra toast de resistência quando o dano é reduzido:
  ```text
  🛡️ Resistência! Dano reduzido de X para Y
  ```
- usa o dano final para a CD de concentração;
- registra no histórico:
  - `originalDamage`;
  - `finalDamage`;
  - `damageType`;
  - `resisted`.

## Histórico

Entradas de HP agora exibem o tipo de dano e, quando aplicável, a resistência:

```text
fogo • 🛡️ 21 → 10
```

O valor principal do registro continua mostrando o HP antes/depois e o dano efetivamente aplicado.

## Testes

Adicionados 5 testes para `applyRageResistance`:

- Fúria normal + cortante → metade.
- Fúria normal + fogo → sem redução.
- Totem do Urso + fogo → metade.
- Totem do Urso + psíquico → sem redução.
- Sem Fúria → sem redução.

Resultado:

```text
Test Files  2 passed (2)
Tests       19 passed (19)
```

## Build

```text
vite v8.3.8 building client environment for production...
✓ 12 modules transformed.
✓ built in 1.07s
PWA v2.0.0
precache 6 entries (169.45 KiB)
```

## Arquivos alterados

- `src/calc.js`
- `src/ui.js`
- `src/history.js`
- `tests/calc.test.js`
- `reports/FASE-11-DONE.md` (novo)

## Observações

- O push fica a cargo do usuário.
- Nenhuma alteração nas regras de cura, descanso ou cálculo de ataques.
