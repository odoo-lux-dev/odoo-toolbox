---
sidebar_position: 4
title: Painel DevTools
toc_max_heading_level: 4
---

# Painel DevTools

:::danger[Utilizar com precaução]
A maioria das operações disponíveis neste painel (**Create**, **Update**, **Delete**, **Call Method**) escreve diretamente na base de dados e são **irreversíveis**. Apenas a operação de **Search** é segura, por ser apenas de leitura.

- Nunca execute operações de escrita ou eliminação numa base de dados de produção, a menos que tenha a certeza do que está a fazer.
- Em caso de dúvida, teste sempre primeiro numa **base de dados de teste**.
   :::

O painel DevTools é uma interface completa de testes RPC incorporada diretamente nas ferramentas de programador do seu navegador. Permite-lhe consultar, criar, atualizar, eliminar e chamar métodos em qualquer modelo Odoo sem sair do seu navegador.

## Abrir o painel {/* #opening-the-panel */}

1. Abra as DevTools do seu navegador (<kbd>F12</kbd> ou <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> no macOS).
2. Procure o separador **Odoo Toolbox** na barra de separadores das DevTools.
3. Clique nele - o painel abre-se e liga-se automaticamente à página Odoo atual.

:::info
Se aparecer uma mensagem de erro, certifique-se de que está numa página Odoo e ligado ao backend (não ao website).
:::

![Painel DevTools - visão geral](/img/devtools-panel/overview.png)

## A interface {/* #the-interface */}

O painel está dividido em duas zonas principais:

- **Esquerda / topo - Construtor de consultas**: onde configura o modelo, a operação, o domínio, os campos e o payload.
- **Direita / fundo - Visualizador de resposta**: onde a resposta JSON é apresentada após a execução.

![Painel DevTools - visão geral da interface](/img/devtools-panel/interface-overview.png)

### Barra lateral {/* #sidebar */}

A barra lateral à esquerda contém os campos de entrada utilizados para construir a sua consulta. Os campos apresentados mudam consoante a operação selecionada (Search, Create, Update, Delete, Call Method). Todos os campos possíveis são apresentados no separador **Search**; as outras operações apenas mostram os campos relevantes.

:::info
Mesmo num separador diferente do de Search, pode preencher os campos da barra lateral para executar uma nova pesquisa. Útil se quiser alterar o conjunto de registos visados pela sua próxima ação.
:::

#### Model {/* #model */}

O campo **Model** espera um nome técnico de modelo (ex. `res.partner`, `sale.order`). Suporta conclusão automática para o ajudar a encontrar o modelo certo.

#### IDs {/* #ids */}

O campo **Record IDs** espera um array JSON de IDs de registos (ex. `[1, 2, 3]`) ou uma lista separada por vírgulas (ex. `1,2,3`). É utilizado para visar registos específicos nas operações de atualização, eliminação ou chamada de método.

#### Seleção de campos {/* #field-selection */}

O campo **Fields** tem uma pesquisa e uma lista de campos disponíveis para o modelo. Limitar os campos obtidos torna a resposta mais legível e a chamada mais rápida.

Deixe o campo vazio para devolver todos os campos do modelo.

#### Filtros de domínio {/* #domain-filters */}

Os domínios seguem a [sintaxe de domínio Odoo](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains) padrão: um array JSON de condições combinadas com os operadores de prefixo `&` (E, por defeito) e `|` (OU).

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

O painel valida o domínio como JSON em tempo real e realça os erros de sintaxe antes mesmo de executar a consulta.

:::tip
Utilize um array vazio `[]` para corresponder a todos os registos (equivalente a nenhum filtro).
:::

#### Ordenação e paginação {/* #sorting-and-pagination */}

O campo **Order By** permite-lhe especificar a ordenação dos resultados (ex. `name ASC` ou `create_date DESC`). Tem uma pesquisa e uma lista de campos disponíveis para o modelo.

O campo **Limit** limita o número de registos devolvidos, e o campo **Offset** ignora um número de registos (para paginação).

#### Botão de execução {/* #execute-button */}

Depois de configurar a sua consulta, clique em **Execute Query** para a executar. A resposta aparece na zona à direita.

#### Botão Get Current {/* #get-current-button */}

O botão **Get Current** pré-preenche os campos da barra lateral com os valores da vista Odoo atual. Por exemplo, se estiver num formulário de parceiro, preencherá o campo **Model** com `res.partner` e o campo **Record IDs** com o ID do registo apresentado. Se tiver vários registos selecionados numa vista de lista, preencherá o campo **Record IDs** com todos os seus IDs.

### Visualizador de resposta {/* #response-viewer */}

Após executar uma chamada, os registos que correspondem aos critérios definidos são apresentados na zona de resposta.

- Um botão **Copy** permite-lhe copiar a resposta completa para a área de transferência. O botão **Download** permite-lhe guardá-la como um ficheiro JSON.
- Os erros devolvidos pelo Odoo (ex. direitos de acesso, campos em falta) são apresentados com a sua mensagem e traceback.

#### Opções de apresentação {/* #display-options */}

A resposta é apresentada por defeito em vista de lista. No separador **Search**, também pode mudar para vista de tabela através do botão no canto superior direito.

#### Botões de ação sobre registos {/* #record-action-buttons */}

Na vista de lista, cada registo tem botões de ação rápida para focá-lo, abri-lo no Odoo ou abri-lo como popup.

| Ícone                                        | Ação                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Foca o registo nas DevTools - útil como ponto de partida para operações posteriores (atualização, eliminação, chamada de método) nesse registo específico.           |
| ![Open](/img/devtools-panel/open-icon.png)   | Abre o registo no Odoo (substitui o conteúdo da janela principal).                                                                                                   |
| ![Popup](/img/devtools-panel/popup-icon.png) | Abre o registo num popup Odoo - útil para inspecionar rapidamente os detalhes de um registo sem perder o contexto do seu trabalho atual na janela principal.        |

## Operações {/* #operations */}

Utilize o menu superior para escolher o que pretende fazer. Cada operação mostra apenas os campos da barra lateral que lhe são relevantes.

### Search {/* #search */}

A operação mais comum e a predefinida. Devolve uma lista de registos que correspondem aos critérios fornecidos (domínio, modelo, ...).

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![Painel DevTools - Search](/img/devtools-panel/search.png)

### Write {/* #write */}

Atualiza registos existentes que correspondem aos critérios fornecidos.

:::danger
Esta operação modifica registos existentes na base de dados. Certifique-se de que os IDs fornecidos correspondem aos registos que pretende atualizar e de que os valores estão corretos. Em caso de dúvida, teste primeiro numa base de dados de teste.
:::

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Update](/img/devtools-panel/write.png)

### Create {/* #create */}

Cria um registo com os valores fornecidos e apresenta-o assim que for criado.

:::danger
Esta operação cria novos registos na base de dados. Certifique-se de que os valores fornecidos estão corretos e de que está numa base de dados de teste se não tiver a certeza.
:::

:::note[Campos da barra lateral]
`Model` · `Context`
:::

![Painel DevTools - Create](/img/devtools-panel/create.png)

### Call Method {/* #call-method */}

Chama qualquer método público num modelo. Útil para acionar lógica de negócio, assistentes ou métodos personalizados.

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Call Method](/img/devtools-panel/call-method.png)

### Delete & Archive {/* #unlink */}

Arquiva, desarquiva ou elimina definitivamente os registos correspondentes.

:::danger
Esta operação modifica ou elimina definitivamente registos existentes na base de dados. Certifique-se de que os IDs fornecidos correspondem aos registos que pretende modificar ou eliminar. Em caso de dúvida, teste primeiro numa base de dados de teste.
:::

:::note[Campos da barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Painel DevTools - Delete & Archive](/img/devtools-panel/unlink.png)

## Histórico de pedidos {/* #request-history */}

O painel mantém um histórico das suas consultas recentes (até 150), acessível através do separador **History** no menu superior. Pode consultar os detalhes de cada pedido (modelo, domínio, payload, resposta) e executá-los novamente ou copiá-los facilmente.

![Painel DevTools - separador History](/img/devtools-panel/history-tab.png)
