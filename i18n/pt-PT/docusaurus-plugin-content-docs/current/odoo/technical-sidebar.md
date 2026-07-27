---
sidebar_position: 3
title: Barra lateral técnica
---

# Barra lateral técnica

:::warning
Esta funcionalidade apenas suporta a versão 16 e posteriores do Odoo.
:::

A barra lateral técnica é um painel de inspeção flutuante que se sobrepõe a qualquer página Odoo. Permite-lhe inspecionar campos, os seus tipos, propriedades e metadados em tempo real, sem sair da página ou abrir as DevTools.

## Ativar a barra lateral {/* #activate-the-sidebar */}

A barra lateral é ativada a partir do [popup da extensão](./popup): clique no ícone da extensão na barra de ferramentas do seu navegador e, em seguida, ative o interruptor **Technical Sidebar**. Também pode ser ativada a partir das [opções da extensão](../options).

## Visão geral {/* #overview */}

A barra lateral é um painel ancorado na lateral da página. Contém:

- **Informações da base de dados**: apresenta informações sobre a base de dados atual, como o nome, a versão, etc.
- **Informações do registo**: apresenta informações sobre o registo da vista atual, como o ID, o modelo, etc.
- **A lista de campos**: apresenta todos os campos do modelo atual com algumas informações técnicas.
- **A lista de ações**: apresenta todas as ações disponíveis para o modelo atual com algumas informações técnicas.
- **A barra de pesquisa**: filtra a lista de campos e ações por nome técnico, nome apresentado ou tipo.

![Barra lateral técnica - interface](/img/technical-sidebar/interface.png)

:::info
Não é necessário ativar o modo de depuração para aceder às informações.
:::

## Funcionalidades {/* #features */}

### Informações da base de dados {/* #database-information */}

As informações sobre a base de dados atual são apresentadas no topo da barra lateral, incluindo:

- A versão do Odoo
- O nome da base de dados
- O idioma atual
- O estado do modo de programador

![Barra lateral técnica - informações da base de dados](/img/technical-sidebar/database-information.png)

### Informações do registo {/* #record-information */}

As informações sobre o registo da vista atual são apresentadas abaixo das informações da base de dados, incluindo:

- O nome do modelo (ex. `res.partner`, `sale.order`)
- O ID do registo
- O tipo de vista (ex. `form`, `list`, `kanban`)
- O tipo de ação (ex. `ir.actions.act_window`)
- O nome da ação (ex. `Mostrar Parceiros`)
- O ID da ação
- O XML ID da ação (ex. `base.action_res_partner_form`)
- O contexto da ação (ex. `{'search_default_group_by_country': 1}`)

![Barra lateral técnica - informações do registo](/img/technical-sidebar/record-information.png)

#### Botões de ação {/* #action-buttons */}

Vários botões de ação também estão disponíveis nesta secção para executar diferentes ações:

- Mostrar os campos do modelo
- Mostrar os direitos de acesso do modelo
- Mostrar as regras de registo do modelo
- Mostrar as ações disponíveis para o modelo
- Mostrar a ação associada à vista atual
- Mostrar os dados do registo atual em formato JSON

![Barra lateral técnica - botões de ação](/img/technical-sidebar/record-actions.png)

### Lista de campos e ações {/* #fields-and-actions-list */}

Os campos e as ações do modelo atual estão listados na barra lateral com algumas informações técnicas. Filtros e uma barra de pesquisa também estão disponíveis para encontrar rapidamente um campo ou ação específica.

Ao passar o rato sobre um elemento da lista, este é realçado na página, permitindo identificá-lo visualmente.

![Barra lateral técnica - passar o rato](/img/technical-sidebar/fields-highlight.png)

### Detalhes de um campo ou ação {/* #field-or-action-details */}

Também é possível ativar um modo que permite clicar num campo ou ação para apresentar os seus detalhes técnicos na barra lateral. Isto fornece informações focadas sobre esse campo ou ação específica.

Este modo é ativado clicando no botão de inspeção no canto superior direito da barra lateral.

![Barra lateral técnica - modo de inspeção](/img/technical-sidebar/field-selected.png)
