---
sidebar_position: 1
title: Primeiros passos
---

# Primeiros passos

O **Odoo Toolbox** tem como objetivo melhorar a experiência dos usuários e desenvolvedores de Odoo e Odoo.SH adicionando uma variedade de ferramentas e funcionalidades.

## Instalação {/* #installation */}

### Chromium {/* #chromium */}

1. Acesse a [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Clique em **Adicionar ao Chrome**
3. Confirme clicando em **Adicionar extensão**

### Firefox {/* #firefox */}

1. Acesse a página de [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Clique em **Adicionar ao Firefox**
3. Confirme clicando em **Adicionar**

Após a instalação, o ícone do Odoo Toolbox aparecerá na barra de ferramentas do seu navegador.

---

## Início rápido {/* #quick-start */}

### 1. Acessar uma instância Odoo {/* #navigate-to-odoo */}

Abra seu navegador e acesse qualquer instância Odoo rodando a **versão 14 ou superior**.

### 2. Abrir o popup {/* #open-the-popup */}

Clique no ícone do **Odoo Toolbox** na barra de ferramentas do seu navegador para abrir o popup. A partir dele, você pode:

- Ativar ou desativar o **modo debug** (também disponível via atalho de teclado)
- Alternar o **tema** da extensão entre claro e escuro
- Acessar seus **projetos favoritos do Odoo.SH**
- Abrir a **página de Options** para configurações avançadas

### 3. Inspecionar campos com a barra lateral técnica {/* #inspect-fields */}

Em qualquer visão Odoo, um **botão flutuante** aparece no canto inferior direito da página (por padrão).

1. Clique no botão para abrir a **Technical Sidebar**
2. Navegue pelas informações técnicas sobre a página atual (modelo, campos, visão, etc.)
3. Para mais precisão, ative o **modo de seleção de elemento** clicando no ícone de cursor no canto superior direito
4. Clique em qualquer campo da página para revelar seus detalhes técnicos:
    - Nome do campo (`name`, `partner_id`, ...)
    - Tipo do campo (`Many2one`, `Char`, `Selection`, ...)
    - Propriedades e metadados adicionais

### 4. Usar o painel DevTools {/* #use-devtools-panel */}

O painel DevTools permite interagir com a camada RPC do Odoo sem sair do seu navegador.

1. Abra as **DevTools** do seu navegador (`F12` ou `Ctrl+Shift+I` / `Cmd+Option+I` no Mac)
2. Navegue até a aba **Odoo Toolbox**
3. Selecione uma aba de operação:
    - **Search** - consulte registros com filtros de domínio e seleção de campos
    - **Write / Create / Unlink** - modifique registros com entrada JSON
    - **Call Method** - execute qualquer método de modelo

---

## E agora? {/* #whats-next */}

Explore a documentação de cada seção:

- [Odoo](./odoo/overview) - Contém todas as ferramentas relacionadas a bancos de dados Odoo em geral
- [Odoo.SH](./odoosh/overview) - Contém todas as ferramentas relacionadas ao Odoo.SH
- [Options](./options) - Visão geral rápida da página de Options para configuração da extensão
