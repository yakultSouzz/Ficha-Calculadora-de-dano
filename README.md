# 🎲 Ficha Kaelen v3 — Calculadora de Dano & Ficha Interativa

E aí, aventureiro! Cansado de borrar a ficha de papel com borracha, ou de ficar calculando dano de duas armas na calculadora do celular no meio do combate? 

Este projeto nasceu exatamente pra resolver isso. É uma ficha de D&D 5e interativa, rápida e (na nossa humilde opinião) muito bonita. Focada no mobile, ela funciona offline, instala no celular como um app nativo e tem todas as regras do 5e automatizadas para você só se preocupar em rolar os dados.

## ✨ O que tem aqui dentro? (Features)

*   **📱 PWA de Verdade:** Instala no celular (Android/iOS) com ícone próprio, abre em tela cheia e funciona 100% offline.
*   **🎲 Numpad Customizado:** Chega de teclado nativo feio. O app tem um teclado próprio com tema pergaminho que abre na hora e calcula tudo.
*   **⚔️ Combate Tático (O Coração do App):**
    *   Rastreamento de Ações (Ação, Bônus, Reação).
    *   Regras de Combate com Duas Armas (Mão inábil sem somar FOR).
    *   Teste de Concentração automático ao tomar dano.
    *   Vantagem e Desvantagem integradas no teclado.
    *   Resistência a Dano (Fúria normal e Totem do Urso).
*   **📖 Codex de Magias:** Cartas colapsáveis, barra de pesquisa e botões de rolagem sempre à mão.
*   **👥 Multi-personagem:** Cansou do Bárbaro? Cria um Mago na mesma hora. Cada herói tem seu próprio HP, magias, itens e histórico de rolagens.
*   **🌙 Modo Escuro / Grimório Noturno:** Perfeito para aquelas sessões que varam a madrugada.
*   **💾 Backup em JSON:** Exporte a ficha do seu personagem e nunca perca o progresso se trocar de celular.

## 🛠️ Por baixo do capô (Tech Stack)

Nada de frameworks gigantes e pesados. O negócio aqui é leve e rápido:
*   **Vanilla JS** (JavaScript puro, sem React ou Vue).
*   **Vite** para o build (super rápido).
*   **Vitest** para os testes automatizados (sim, a matemática do D&D é testada!).
*   **CSS Puro** com variáveis (para trocar do modo claro pro escuro na hora).

## 🚀 Como rodar na sua máquina

Quer mexer no código? É facinho.

    git clone https://github.com/SEU_USUARIO/SEU_REPO.git
    cd SEU_REPO
    npm install
    npm run dev

O app vai abrir no seu navegador (geralmente em http://localhost:5173).

## 📲 Como instalar no celular

1. Acesse o link do projeto no Vercel (ou o seu localhost na rede local).
2. **No Android (Chrome):** Clique nos três pontinhos > "Instalar aplicativo" (ou "Adicionar à tela inicial").
3. **No iPhone (Safari):** Clique no botão de Compartilhar (quadradinho com a setinha) > "Adicionar à Tela de Início".
4. Pronto! Ele vai aparecer na sua tela inicial com o ícone e funcionar como um app normal.

## 🧪 Rodando os Testes

Se você é desenvolvedor e quer garantir que a matemática do 5e não está quebrada:

    npm test

## 🤝 Contribuições
Ideias, bugs ou magias novas? Sinta-se livre para abrir uma Issue ou mandar um Pull Request. 

---
*Feito com muito café, dados de 20 lados e código limpo.* 🐉⚔️🛡️
