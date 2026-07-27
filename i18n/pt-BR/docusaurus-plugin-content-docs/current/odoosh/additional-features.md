---
sidebar_position: 3
title: Recursos adicionais
---

# Recursos adicionais

Esta página aborda os pequenos utilitários que o Odoo Toolbox adiciona à interface do Odoo.SH para facilitar o gerenciamento diário de projetos e branches. Essas funcionalidades estão disponíveis diretamente no [Odoo.SH](https://www.odoo.sh), sem necessidade de configuração.

## Atalhos de branch {/* #branch-shortcuts */}

![Atalhos de branch](/img/odoosh/additional-features/shortcuts.png)

### Cópia do nome de branch {/* #branch-name-copy */}

Em uma página de projeto Odoo.SH, cada linha de branch possui um **ícone de cópia** ao lado do nome do branch. Clique nele para copiar instantaneamente o nome do branch para a área de transferência - útil para comandos `git checkout`, mensagens de commit ou nomes de tarefas.

{/* ![Cópia do nome de branch](/img/odoosh/additional-features/branch-copy.png) */}

### Links do GitHub {/* #github-links */}

O Odoo Toolbox adiciona um **link do GitHub** direto em cada branch, apontando para o branch correspondente no seu repositório do GitHub. Chega de navegar até o GitHub separadamente e procurar pelo branch certo.

{/* ![Links do GitHub](/img/odoosh/additional-features/github-links.png) */}

### Integração de tarefas {/* #task-integration */}

O Odoo Toolbox pode associar um branch do Odoo.SH a uma tarefa no seu projeto Odoo. Quando uma correspondência é detectada no nome do branch, um link direto para a tarefa é exibido ao lado do branch.

#### Como funciona

A extensão analisa cada nome de branch usando a expressão regular `/-(\d+)-/`. O ID numérico capturado é então injetado em uma URL personalizável através do placeholder `{{task_id}}`. Tanto a regex quanto a URL podem ser personalizadas nas opções da extensão.

O padrão padrão corresponde ao formato: `VERSION-TASKID-DESCRIPTION_OPCIONAL`

Exemplos de nomes de branch reconhecidos: `17.0-12345-my-feature`, `15.0-6789-fixes`

Para configurar a URL de destino, acesse as **opções da extensão** e defina a URL com o placeholder `{{task_id}}`. Por exemplo:

```
https://meu-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
Você pode definir uma URL específica por favorito a partir da página **SH Favorites** nas opções da extensão.
:::

## Indicadores de status de build adaptados para daltônicos {/* #colorblind-build-status */}

Por padrão, o Odoo.SH usa apenas cores para indicar os status dos builds (verde, vermelho, laranja). O Odoo Toolbox aprimora esses indicadores com ícones e formas distintos, tornando os status legíveis mesmo sem distinção de cores.

| Status      | Indicador visual                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sucesso     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Falha       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| Em andamento | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| Aguardando  | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Indicadores de status adaptados para daltônicos](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Esta funcionalidade é especialmente útil ao usar o Odoo.SH em um monitor mal calibrado ou em um ambiente com iluminação ambiente intensa.
:::
