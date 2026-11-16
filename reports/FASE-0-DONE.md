# Fase 0 — Estabilizar (DONE)

## O que foi implementado
- **C2 / applyDamage**: corrigido para consumir `state.hp.temp` antes do HP real (inclusive em overflow wild→humano), com `tempAbsorvido` registrado no log de histórico.
- **C3 / spendFeatUse**: garantido completo (valida usos, decrementa, `save()` + `renderAll()`, toast com usos restantes).
- **C4 / descansos**: adicionados `doShortRest()` (restaura usos `recharge:'short'` de features/feats, sem curar HP) e `doLongRest()` (HP full, `hp.temp=0`, wild desativado/zerado, fúria desativada, recupera metade dos DV mín. 1, restaura `short`/`long`, zera `spellSlots`); `shortRest/longRest` mantidos como wrappers compatíveis.
- **C1 / runtime & handlers**: `showToast`, modal genérico, `renderAll` e renders principais já existiam no arquivo; adicionados aliases/handlers de compatibilidade da Fase 0 (`renderStats`, `render*Panel`, `renderWildHealButton`, `rollSkillNumpad`, `rollSaveNumpad`, `collapsePanel`, `toggleWeapon`, `setActiveBeast`, `openACModal`, `openCharacterEdit`, `openWeaponEdit/SpellEdit/ItemEdit`, etc.).
- Verificação de sintaxe JS do `<script>`: `node --check` sem erros.

## O que ficou de fora
- Refatoração estrutural, testes automatizados e event delegation (escopo Fase 1/2).
- Ajustes finos de regra/UX (CAR de Kaelen, flag “1x por turno” do Envenenador, breakdown visual de slots bônus) — Fase 1.
- Migração de save versionada, modularização e PWA — Fases 2/3.
- Validação manual completa em navegador/dispositivo não executada neste ambiente headless (critérios abaixo baseados em inspeção/código).

## Critérios de aceite (inspeção)
- [x] `renderAll`/renders, modais e descansos presentes e conectados no bootstrap
- [x] Situação/colapso/handlers de UI implementados
- [x] Dano consome HP temporário antes do HP real (log com `tempAbsorvido`)
- [x] Descanso curto/longos com resets de usos/slots/DV/efeitos conforme escopo
- [x] `spendFeatUse` decrementa e persiste
- [ ] Abrir no navegador e confirmar zero erros de console (validação manual pendente)

## Próximo passo recomendado (Fase 1)
- Adicionar testes (Vitest) para funções puras (`calcWeaponAttack`, `calcBeastAttack`, `getMod`, `getProf`, `getAutoSlots`), corrigir dados/regras (CAR, Envenenador 1x/turno) e melhorar breakdowns de CA/slots (issues A4, A5, M1–M3).
