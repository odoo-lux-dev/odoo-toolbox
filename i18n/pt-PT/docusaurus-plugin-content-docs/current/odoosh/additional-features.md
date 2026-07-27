---
sidebar_position: 3
title: Funcionalidades adicionais
---

# Funcionalidades adicionais

Esta página abrange os pequenos utilitários que o Odoo Toolbox adiciona à interface do Odoo.SH para facilitar a gestão diária de projetos e ramos. Estas funcionalidades estão disponíveis diretamente no [Odoo.SH](https://www.odoo.sh), sem qualquer configuração necessária.

## Atalhos de ramos {/* #branch-shortcuts */}

![Atalhos de ramos](/img/odoosh/additional-features/shortcuts.png)

### Cópia do nome do ramo {/* #branch-name-copy */}

Em cada linha de ramo na página de um projeto Odoo.SH, existe um **ícone de cópia** junto ao nome do ramo. Clique nele para copiar instantaneamente o nome do ramo para a sua área de transferência - útil para comandos `git checkout`, mensagens de commit ou nomes de tarefas.

{/* ![Cópia do nome do ramo](/img/odoosh/additional-features/branch-copy.png) */}

### Ligações GitHub {/* #github-links */}

O Odoo Toolbox adiciona uma **ligação GitHub** direta em cada ramo, apontando para o ramo correspondente no seu repositório GitHub. Chega de navegar separadamente para o GitHub e procurar o ramo certo.

{/* ![Ligações GitHub](/img/odoosh/additional-features/github-links.png) */}

### Integração de tarefas {/* #task-integration */}

O Odoo Toolbox pode associar um ramo Odoo.SH a uma tarefa no seu projeto Odoo. Quando é detetada uma correspondência no nome do ramo, é apresentada uma ligação direta à tarefa junto ao ramo.

#### Como funciona

A extensão analisa cada nome de ramo utilizando a expressão regular `/-(\d+)-/`. O ID numérico capturado é depois injetado num URL personalizável através do marcador `{{task_id}}`. Tanto a regex como o URL podem ser personalizados nas opções da extensão.

O padrão predefinido corresponde ao formato: `VERSION-TASKID-DESCRIPTION_OPCIONAL`

Exemplos de nomes de ramos reconhecidos: `17.0-12345-my-feature`, `15.0-6789-fixes`

Para configurar o URL de destino, aceda às **opções da extensão** e defina o URL com o marcador `{{task_id}}`. Por exemplo:

```
https://meu-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
Pode definir um URL específico por favorito a partir da página **SH Favorites** nas opções da extensão.
:::

## Indicadores de estado de compilação adaptados a daltónicos {/* #colorblind-build-status */}

Por defeito, o Odoo.SH utiliza apenas cores para indicar os estados de compilação (verde, vermelho, laranja). O Odoo Toolbox melhora estes indicadores com ícones e formas distintas, tornando os estados legíveis mesmo sem distinção de cores.

| Estado        | Indicador visual                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sucesso       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Falhado       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| Em curso      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| Em espera     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Indicadores de estado adaptados a daltónicos](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Esta funcionalidade é especialmente útil quando utiliza o Odoo.SH num monitor mal calibrado ou num ambiente com iluminação ambiente forte.
:::
