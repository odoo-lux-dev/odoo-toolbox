---
sidebar_position: 1
title: Introdução
---

# Introdução

O **Odoo Toolbox** tem como objetivo melhorar a experiência dos utilizadores e programadores de Odoo e Odoo.SH, adicionando uma variedade de ferramentas e funcionalidades.

## Instalação {/* #installation */}

### Chromium {/* #chromium */}

1. Aceda à [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Clique em **Adicionar ao Chrome**
3. Confirme clicando em **Adicionar extensão**

### Firefox {/* #firefox */}

1. Aceda à página de [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Clique em **Adicionar ao Firefox**
3. Confirme clicando em **Adicionar**

Depois de instalada, o ícone do Odoo Toolbox aparecerá na barra de ferramentas do seu navegador.

---

## Início rápido {/* #quick-start */}

### 1. Aceder a uma instância Odoo {/* #navigate-to-odoo */}

Abra o seu navegador e aceda a qualquer instância Odoo com a **versão 14 ou superior**.

### 2. Abrir o popup {/* #open-the-popup */}

Clique no ícone **Odoo Toolbox** na barra de ferramentas do seu navegador para abrir o popup. A partir daqui, pode:

- Ativar ou desativar o **modo de depuração** (também disponível através de um atalho de teclado)
- Alternar o **tema** da extensão entre claro e escuro
- Aceder aos seus **projetos favoritos Odoo.SH**
- Abrir a **página de Options** para configurações avançadas

### 3. Inspecionar campos com a barra lateral técnica {/* #inspect-fields */}

Em qualquer vista Odoo, aparece um **botão flutuante** no canto inferior direito (por defeito) da página.

1. Clique no botão para abrir a **barra lateral técnica**
2. Percorra as informações técnicas sobre a página atual (modelo, campos, vista, etc.)
3. Para maior precisão, ative o **modo de seleção de elementos** clicando no ícone de cursor no canto superior direito
4. Clique em qualquer campo da página para revelar os seus detalhes técnicos:
    - Nome do campo (`name`, `partner_id`, ...)
    - Tipo de campo (`Many2one`, `Char`, `Selection`, ...)
    - Propriedades e metadados adicionais

### 4. Utilizar o painel DevTools {/* #use-devtools-panel */}

O painel DevTools permite-lhe interagir com a camada RPC do Odoo sem sair do seu navegador.

1. Abra as **DevTools** do seu navegador (`F12` ou `Ctrl+Shift+I` / `Cmd+Option+I` no Mac)
2. Navegue até ao separador **Odoo Toolbox**
3. Selecione um separador de operação:
    - **Search** - consultar registos com filtros de domínio e seleção de campos
    - **Write / Create / Unlink** - modificar registos com entrada JSON
    - **Call Method** - executar qualquer método de modelo

---

## E agora? {/* #whats-next */}

Explore a documentação de cada secção:

- [Odoo](./odoo/overview) - Contém todas as ferramentas relacionadas com bases de dados Odoo em geral
- [Odoo.SH](./odoosh/overview) - Contém todas as ferramentas relacionadas com o Odoo.SH
- [Options](./options) - Visão geral rápida da página de Options para a configuração da extensão
