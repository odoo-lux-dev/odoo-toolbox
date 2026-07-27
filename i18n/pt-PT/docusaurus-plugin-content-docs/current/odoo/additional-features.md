---
sidebar_position: 5
title: Funcionalidades adicionais
---

# Funcionalidades adicionais

Esta página abrange as funcionalidades mais ligeiras do Odoo Toolbox que melhoram a sua experiência quotidiana nas instâncias Odoo, sem constituírem uma ferramenta completa por si só.

## Nome técnico do modelo {/* #model-name */}

Em qualquer página de registo Odoo, o Odoo Toolbox apresenta o nome técnico do modelo atual diretamente na interface. Esta informação estava historicamente presente no URL da página, mas deixou de ser o caso a partir da versão 17.2.

Este nome de modelo é, portanto, apenas apresentado na versão 17.2 e posteriores do Odoo.

![Nome técnico do modelo](/img/additional-features/technical-name.png)

:::tip
Esta informação é particularmente útil quando está a escrever código Python, regras de acesso ou vistas XML e precisa do nome exato do modelo.
:::

## Pré-visualização de relatórios PDF/HTML {/* #report-preview */}

O Odoo Toolbox adiciona acesso rápido aos relatórios diretamente a partir das opções de impressão de um registo. Pode aceder ao relatório associado em formato **PDF** ou **HTML** sem ter de descarregar o relatório todas as vezes.

![Pré-visualização de relatórios](/img/additional-features/report-preview.png)

## Botões de início de sessão rápido

O Odoo Toolbox adiciona botões de início de sessão rápido nas páginas de login do Odoo. Estão disponíveis três botões:

- Admin
- Demo
- Portal

:::tip
Isto é particularmente útil em instâncias de desenvolvimento ou teste, bem como nos runbots do Odoo.
:::

![Botões de início de sessão rápido](/img/additional-features/quick-connect-buttons.png)
