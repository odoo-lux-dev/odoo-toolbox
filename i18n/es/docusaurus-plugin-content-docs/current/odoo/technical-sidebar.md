---
sidebar_position: 3
title: Barra lateral técnica
---

# Barra lateral técnica

:::warning
Esta funcionalidad solo es compatible con Odoo versión 16 y posteriores.
:::

La barra lateral técnica es un panel de inspección flotante que se superpone a cualquier página Odoo. Le permite inspeccionar en tiempo real los campos, sus tipos, sus propiedades y sus metadatos sin salir de la página ni abrir las DevTools.

## Activar la barra lateral {/* #activate-the-sidebar */}

La barra lateral se activa desde el [popup de la extensión](./popup): haga clic en el icono de la extensión en la barra de herramientas de su navegador y active el botón **Barra lateral técnica**. También se puede activar desde las [opciones de la extensión](../options).

## Presentación {/* #overview */}

La barra lateral se presenta en forma de panel anclado en el lateral de la página. Contiene:

- **Información sobre la base de datos**: muestra información sobre la base de datos actual, como su nombre, la versión, etc.
- **Información sobre el registro**: muestra información sobre el registro de la vista actual, como su ID, su modelo, etc.
- **La lista de campos**: muestra todos los campos del modelo actual con información técnica.
- **La lista de acciones**: muestra todas las acciones disponibles para el modelo actual con información técnica.
- **La barra de búsqueda**: filtra la lista de campos y acciones por nombre técnico, nombre mostrado o tipo.

![Barra lateral técnica - interfaz](/img/technical-sidebar/interface.png)

:::info
No es necesario tener activado el modo debug para acceder a la información.
:::

## Funcionalidades {/* #features */}

### Información sobre la base de datos {/* #database-information */}

La información sobre la base de datos actual se muestra en la parte superior de la barra lateral, en particular:

- La versión de Odoo
- El nombre de la base de datos
- El idioma actual
- El estado del modo desarrollador

![Barra lateral técnica - información sobre la base de datos](/img/technical-sidebar/database-information.png)

### Información sobre el registro {/* #record-information */}

La información sobre el registro de la vista actual se muestra debajo de la información sobre la base de datos, en particular:

- El nombre del modelo (ej. `res.partner`, `sale.order`)
- El ID del registro
- El tipo de vista (ej. `form`, `list`, `kanban`)
- El tipo de acción (ej. `ir.actions.act_window`)
- El nombre de la acción (ej. `Mostrar partners`)
- El ID de la acción
- El XML ID de la acción (ej. `base.action_res_partner_form`)
- El contexto de la acción (ej. `{'search_default_group_by_country': 1}`)

![Barra lateral técnica - información sobre el registro](/img/technical-sidebar/record-information.png)

#### Botones de acción {/* #action-buttons */}

Varios botones de acción también están disponibles en esta sección y permiten realizar diferentes acciones:

- Mostrar los campos del modelo
- Mostrar los derechos de acceso del modelo
- Mostrar las reglas de registro del modelo
- Mostrar las acciones disponibles para el modelo
- Mostrar la acción vinculada a la vista actual
- Mostrar los datos del registro actual en formato JSON

![Barra lateral técnica - botones de acción](/img/technical-sidebar/record-actions.png)

### Lista de campos y de acciones {/* #fields-and-actions-list */}

Los campos y las acciones del modelo actual se listan en la barra lateral con información técnica. Varios filtros y una barra de búsqueda también están disponibles y permiten encontrar rápidamente un campo o una acción específica.

Al pasar el cursor por uno de los elementos de la lista, este se resaltará en la página, lo que permite identificarlo visualmente.

![Barra lateral técnica - Hover](/img/technical-sidebar/fields-highlight.png)

### Detalles de un campo o una acción {/* #field-or-action-details */}

También es posible activar un modo que permite hacer clic en un campo o una acción para mostrar sus detalles técnicos en la barra lateral. Esto permite obtener información de ese campo o acción únicamente.

Este modo se activa haciendo clic en el botón de inspección situado en la parte superior derecha de la barra lateral.

![Barra lateral técnica - modo de inspección](/img/technical-sidebar/field-selected.png)
