---
sidebar_position: 4
title: Painel DevTools
toc_max_heading_level: 4
---

# Painel DevTools

:::danger[Use com cautela]
A maioria das operações disponíveis neste painel (**Create**, **Update**, **Delete**, **Call Method**) grava diretamente no banco de dados e são **irreversíveis**. Apenas a operação de **Search** é segura, por ser somente leitura.

- Nunca execute operações de escrita ou exclusão em um banco de dados de produção, a menos que tenha certeza do que está fazendo.
- Em caso de dúvida, sempre teste primeiro em um **banco de dados de teste**.
  :::

O painel DevTools é uma interface completa de testes RPC incorporada diretamente nas ferramentas de desenvolvimento do seu navegador. Ele permite consultar, criar, atualizar, excluir e chamar métodos em qualquer modelo Odoo sem sair do seu navegador.

## Abrindo o painel {/* #opening-the-panel */}

1. Abra as DevTools do seu navegador (<kbd>F12</kbd> ou <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> no macOS).
2. Procure pela aba **Odoo Toolbox** na barra de abas das DevTools.
3. Clique nela - o painel abre e se conecta automaticamente à página Odoo atual.

:::info
Se aparecer uma mensagem de erro, certifique-se de estar em uma página Odoo e conectado ao backend (não ao website).
:::

![Painel DevTools - visão geral](/img/devtools-panel/overview.png)

## A interface {/* #the-interface */}

O painel está dividido em duas áreas principais:

- **Esquerda / superior - Construtor de consulta**: onde você configura o modelo, operação, domínio, campos e payload.
- **Direita / inferior - Visualizador de resposta**: onde a resposta JSON é exibida após a execução.

![Painel DevTools - visão geral da interface](/img/devtools-panel/interface-overview.png)

### Barra lateral {/* #sidebar */}

A barra lateral à esquerda contém os campos de entrada usados para construir sua consulta. Os campos exibidos mudam dependendo da operação selecionada (Search, Create, Update, Delete, Call Method). Todos os campos possíveis são mostrados na aba **Search**; as outras operações mostram apenas os campos relevantes.

:::info
Mesmo estando em uma aba diferente de Search, você pode preencher os campos da barra lateral para executar uma nova busca. Útil se quiser alterar o conjunto de registros alvo da sua próxima ação.
:::

#### Model {/* #model */}

O campo **Model** espera um nome técnico de modelo (ex. `res.partner`, `sale.order`). Ele possui autocompletar para ajudá-lo a encontrar o modelo correto.

#### IDs {/* #ids */}

O campo **Record IDs** espera um array JSON de IDs de registros (ex. `[1, 2, 3]`) ou uma lista separada por vírgulas (ex. `1,2,3`). É usado para direcionar registros específicos em operações de atualização, exclusão ou chamada de método.

#### Seleção de campos {/* #field-selection */}

O campo **Fields** possui uma busca e uma lista de campos disponíveis para o modelo. Limitar os campos que você busca torna a resposta mais legível e a chamada mais rápida.

Deixe o campo vazio para retornar todos os campos do modelo.

#### Filtros de domínio {/* #domain-filters */}

Os domínios seguem a [sintaxe de domínio Odoo](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains) padrão: um array JSON de condições combinadas com os operadores de prefixo `&` (AND, padrão) e `|` (OR).

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

O painel valida o domínio como JSON em tempo real e destaca erros de sintaxe antes mesmo de você executar a consulta.

:::tip
Use um array vazio `[]` para corresponder a todos os registros (equivalente a nenhum filtro).
:::

#### Ordenação e paginação {/* #sorting-and-pagination */}

O campo **Order By** permite especificar a ordenação dos resultados (ex. `name ASC` ou `create_date DESC`). Ele possui uma busca e uma lista de campos disponíveis para o modelo.

O campo **Limit** limita o número de registros retornados, e **Offset** ignora um número de registros (para paginação).

#### Botão de execução {/* #execute-button */}

Após configurar sua consulta, clique em **Execute Query** para executá-la. A resposta aparece na área à direita.

#### Botão Get Current {/* #get-current-button */}

O botão **Get Current** preenche os campos da barra lateral com os valores da visão Odoo atual. Por exemplo, se você estiver em um formulário de parceiro, ele preencherá **Model** com `res.partner` e **Record IDs** com o ID do registro exibido. Se você tiver vários registros selecionados em uma visão de lista, ele preencherá **Record IDs** com todos os seus IDs.

### Visualizador de resposta {/* #response-viewer */}

Após executar uma chamada, os registros que correspondem aos critérios definidos são exibidos na área de resposta.

- Um botão **Copy** permite copiar a resposta completa para a área de transferência. **Download** permite salvá-la como um arquivo JSON.
- Erros retornados pelo Odoo (ex. direitos de acesso, campos ausentes) são exibidos com sua mensagem e traceback.

#### Opções de exibição {/* #display-options */}

A resposta é exibida por padrão em visão de lista. Na aba **Search**, você também pode alternar para a visão de tabela usando o botão no canto superior direito.

#### Botões de ação do registro {/* #record-action-buttons */}

Na visão de lista, cada registro possui botões de ação rápida para focá-lo, abri-lo no Odoo ou abri-lo como popup.

| Ícone                                        | Ação                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Foca o registro nas DevTools - útil como ponto de partida para outras operações (atualização, exclusão, chamada de método) nesse registro específico.      |
| ![Open](/img/devtools-panel/open-icon.png)   | Abre o registro no Odoo (substitui o conteúdo da janela pai).                                                                                              |
| ![Popup](/img/devtools-panel/popup-icon.png) | Abre o registro em um popup do Odoo - útil para inspecionar rapidamente os detalhes de um registro sem perder o contexto do seu trabalho na janela pai.    |

## Operações {/* #operations */}

Use o menu superior para escolher o que você deseja fazer. Cada operação mostra apenas os campos da barra lateral relevantes para ela.

### Busca {/* #search */}

A operação mais comum e a padrão. Retorna uma lista de registros que correspondem aos critérios informados (domínio, modelo, ...).

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![Painel DevTools - Search](/img/devtools-panel/search.png)

### Escrita {/* #write */}

Atualiza registros existentes que correspondem aos critérios informados.

:::danger
Esta operação modifica registros existentes no banco de dados. Certifique-se de que os IDs fornecidos correspondem aos registros que você deseja atualizar e que os valores estão corretos. Em caso de dúvida, teste primeiro em um banco de dados de teste.
:::

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Update](/img/devtools-panel/write.png)

### Criação {/* #create */}

Cria um registro com os valores fornecidos e o exibe após a criação.

:::danger
Esta operação cria novos registros no banco de dados. Certifique-se de que os valores fornecidos estão corretos e de que você está em um banco de dados de teste se não tiver certeza.
:::

:::note[Campos da barra lateral]
`Model` · `Context`
:::

![Painel DevTools - Create](/img/devtools-panel/create.png)

### Chamada de método {/* #call-method */}

Chama qualquer método público em um modelo. Útil para acionar lógica de negócios, wizards ou métodos personalizados.

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Call Method](/img/devtools-panel/call-method.png)

### Exclusão e arquivamento {/* #unlink */}

Arquiva, desarquiva ou exclui permanentemente os registros correspondentes.

:::danger
Esta operação modifica ou exclui permanentemente registros existentes no banco de dados. Certifique-se de que os IDs fornecidos correspondem aos registros que você deseja modificar ou excluir. Em caso de dúvida, teste primeiro em um banco de dados de teste.
:::

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Delete & Archive](/img/devtools-panel/unlink.png)

## Histórico de requisições {/* #request-history */}

O painel mantém um histórico das suas consultas recentes (até 150), acessível através da aba **History** no menu superior. Você pode navegar pelos detalhes de cada requisição (modelo, domínio, payload, resposta) e executá-las novamente ou copiá-las facilmente.

![Painel DevTools - aba History](/img/devtools-panel/history-tab.png)
