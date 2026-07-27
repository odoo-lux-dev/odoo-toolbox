---
sidebar_position: 3
title: Barra lateral técnica
---

# Barra lateral técnica

:::warning
Esta funcionalidade suporta apenas a versão 16 e posteriores do Odoo.
:::

A barra lateral técnica é um painel de inspeção flutuante que se sobrepõe a qualquer página Odoo. Ela permite inspecionar campos, seus tipos, propriedades e metadados em tempo real, sem sair da página ou abrir as DevTools.

## Ativar a barra lateral {/* #activate-the-sidebar */}

A barra lateral é ativada a partir do [popup da extensão](./popup): clique no ícone da extensão na barra de ferramentas do seu navegador e ative o botão **Technical Sidebar**. Ela também pode ser ativada a partir das [opções da extensão](../options).

## Visão geral {/* #overview */}

A barra lateral é um painel ancorado na lateral da página. Ela contém:

- **Informações do banco de dados**: exibe informações sobre o banco de dados atual, como nome, versão, etc.
- **Informações do registro**: exibe informações sobre o registro da visão atual, como ID, modelo, etc.
- **A lista de campos**: exibe todos os campos do modelo atual com algumas informações técnicas.
- **A lista de ações**: exibe todas as ações disponíveis para o modelo atual com algumas informações técnicas.
- **A barra de pesquisa**: filtra a lista de campos e ações por nome técnico, rótulo de exibição ou tipo.

![Barra lateral técnica - interface](/img/technical-sidebar/interface.png)

:::info
Não é necessário ativar o modo debug para acessar as informações.
:::

## Funcionalidades {/* #features */}

### Informações do banco de dados {/* #database-information */}

Informações sobre o banco de dados atual são exibidas no topo da barra lateral, incluindo:

- A versão do Odoo
- O nome do banco de dados
- O idioma atual
- O status do modo desenvolvedor

![Barra lateral técnica - informações do banco de dados](/img/technical-sidebar/database-information.png)

### Informações do registro {/* #record-information */}

Informações sobre o registro da visão atual são exibidas abaixo das informações do banco de dados, incluindo:

- O nome do modelo (ex. `res.partner`, `sale.order`)
- O ID do registro
- O tipo de visão (ex. `form`, `list`, `kanban`)
- O tipo de ação (ex. `ir.actions.act_window`)
- O nome da ação (ex. `Mostrar parceiros`)
- O ID da ação
- O XML ID da ação (ex. `base.action_res_partner_form`)
- O contexto da ação (ex. `{'search_default_group_by_country': 1}`)

![Barra lateral técnica - informações do registro](/img/technical-sidebar/record-information.png)

#### Botões de ação {/* #action-buttons */}

Vários botões de ação também estão disponíveis nesta seção para executar diferentes ações:

- Mostrar campos do modelo
- Mostrar direitos de acesso do modelo
- Mostrar regras de registro do modelo
- Mostrar ações disponíveis para o modelo
- Mostrar a ação vinculada à visão atual
- Mostrar os dados do registro atual em formato JSON

![Barra lateral técnica - botões de ação](/img/technical-sidebar/record-actions.png)

### Lista de campos e ações {/* #fields-and-actions-list */}

Os campos e ações do modelo atual são listados na barra lateral com algumas informações técnicas. Filtros e uma barra de pesquisa também estão disponíveis para encontrar rapidamente um campo ou ação específica.

Ao passar o mouse sobre um item da lista, ele é destacado na página, permitindo identificá-lo visualmente.

![Barra lateral técnica - hover](/img/technical-sidebar/fields-highlight.png)

### Detalhes de um campo ou ação {/* #field-or-action-details */}

Também é possível ativar um modo que permite clicar em um campo ou ação para exibir seus detalhes técnicos na barra lateral. Isso fornece informações focadas sobre aquele campo ou ação específica.

Esse modo é ativado clicando no botão de inspeção no canto superior direito da barra lateral.

![Barra lateral técnica - modo de inspeção](/img/technical-sidebar/field-selected.png)
