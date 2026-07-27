---
sidebar_position: 4
title: Panel DevTools
toc_max_heading_level: 4
---

# Panel DevTools

:::danger[Usar con precaución]
La mayoría de las operaciones disponibles en este panel (**Creación**, **Modificación**, **Supresión**, **Llamada a método**) escriben directamente en la base de datos y son **irreversibles**. Solo la operación de **Search** es segura, ya que es de solo lectura.

- Nunca ejecute operaciones de escritura o supresión en una base de datos de producción sin estar seguro de lo que hace.
- En caso de duda, pruebe siempre primero en una **base de datos de prueba**.
  :::

El panel DevTools es una interfaz completa de prueba RPC integrada directamente en las herramientas de desarrollo de su navegador. Le permite consultar, crear, modificar, suprimir registros y llamar a métodos en cualquier modelo Odoo sin salir de su navegador.

## Abrir el panel {/* #opening-the-panel */}

1. Abra las DevTools de su navegador (<kbd>F12</kbd> o <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> en macOS).
2. Busque la pestaña **Odoo Toolbox** en la barra de pestañas de las DevTools.
3. Haga clic en ella - el panel se abre y se conecta automáticamente a la página Odoo actual.

:::info
Si aparece un mensaje de error, asegúrese de estar en una página Odoo y conectado al backend (no en el website).
:::

![Panel DevTools - vista general](/img/devtools-panel/overview.png)

## La interfaz {/* #the-interface */}

El panel se divide en dos zonas principales:

- **Izquierda / superior - Constructor de consulta**: aquí es donde configura el modelo, la operación, el dominio, los campos y el payload.
- **Derecha / inferior - Visor de respuesta**: aquí es donde se muestra la respuesta JSON tras la ejecución.

![Panel DevTools - vista general de la interfaz](/img/devtools-panel/interface-overview.png)

### Barra lateral {/* #sidebar */}

Esta barra lateral a la izquierda contiene los campos de entrada para construir su consulta. Los campos mostrados cambian en función de la operación seleccionada (Search, Creación, Modificación, Supresión, Llamada a método). Todos los campos posibles se muestran en la pestaña **Search**; las otras operaciones solo muestran los campos pertinentes.

:::info
Incluso en una pestaña distinta a la de búsqueda, puede rellenar esta barra lateral con los criterios disponibles para ejecutar luego una nueva búsqueda. Útil si, por ejemplo, desea cambiar los registros sobre los que se aplicarán sus acciones.
:::

#### Modelo {/* #model */}

El campo **Model** espera el nombre técnico del modelo (ej. `res.partner`, `sale.order`, etc.). Dispone de autocompletado para ayudarle a encontrar el modelo correcto.

#### IDs {/* #ids */}

El campo **Record IDs** espera un array JSON de IDs de registros (ej. `[1, 2, 3]`) o una lista separada por comas (ej. `1,2,3`). Se utiliza para seleccionar registros específicos en las operaciones de modificación, supresión o llamada a método.

#### Selección de campos {/* #field-selection */}

El campo **Fields** dispone de una búsqueda y de una lista de campos disponibles para el modelo. Limitar los campos recuperados hace que la respuesta sea más legible y la llamada más rápida.

Deje el campo vacío para devolver todos los campos del modelo.

#### Filtros de dominio {/* #domain-filters */}

Los dominios siguen la [sintaxis de dominio Odoo](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains) estándar: un array JSON de condiciones combinadas con los operadores de prefijo `&` (Y, por defecto) y `|` (O).

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

El panel valida el dominio como JSON en tiempo real y señala los errores de sintaxis antes incluso de que ejecute la consulta.

:::tip
Utilice un array vacío `[]` para coincidir con todos los registros (equivalente a ningún filtro).
:::

#### Ordenación y paginación {/* #sorting-and-pagination */}

El campo **Order By** permite especificar el orden de los resultados (ej. `name ASC` o `create_date DESC`). Dispone de una búsqueda y de una lista de campos disponibles para el modelo.

El campo **Limit** permite limitar el número de registros devueltos, y el campo **Offset** permite saltar un número de registros (para la paginación).

#### Botón de ejecución {/* #execute-button */}

Una vez que haya configurado su consulta, haga clic en el botón **Execute Query** para ejecutarla. La respuesta se mostrará en la zona derecha.

#### Botón Get Current {/* #get-current-button */}

El botón **Get Current** rellena automáticamente los campos de la barra lateral con los valores correspondientes a la vista Odoo actual. Por ejemplo, si se encuentra en la ficha de un partner, rellenará el campo **Model** con `res.partner` y el campo **Record IDs** con el ID del partner mostrado. Si ha seleccionado varios registros en una vista lista, rellenará el campo **Record IDs** con los IDs de esos registros.

### Visor de respuesta {/* #response-viewer */}

Tras la ejecución de una llamada, el(los) registro(s) que coinciden con los criterios definidos se muestra(n) en la zona de respuesta.

- Un botón **Copy** permite copiar la respuesta completa al portapapeles, **Download** permite descargarla en formato JSON.
- Los errores devueltos por Odoo (ej. derechos de acceso, campos faltantes) se muestran con su mensaje y su traceback.

#### Opciones de visualización {/* #display-options */}

La respuesta se muestra por defecto en vista lista. En la pestaña **Search**, también puede cambiar a la vista tabla mediante el botón situado en la parte superior derecha.

#### Botones de acción sobre los registros {/* #record-action-buttons */}

En la vista lista, cada registro dispone de botones de acción rápida para enfocar el registro, abrirlo en Odoo o abrirlo en Odoo en forma de popup.

| Icono                                       | Acción                                                                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![Focus](/img/devtools-panel/focus-icon.png) | Enfoca el registro en las DevTools. Útil para utilizarlo como punto de partida para realizar otras operaciones (modificación, supresión, llamada a método) sobre ese registro.                              |
| ![Open](/img/devtools-panel/open-icon.png)   | Abre el registro en Odoo (sustituye el contenido de la ventana principal)                                                                                                                                    |
| ![Popup](/img/devtools-panel/popup-icon.png) | Abre el registro en un popup de Odoo. Útil para consultar rápidamente los detalles de un registro sin perder el contexto de su trabajo en la ventana principal.                                              |

## Operaciones {/* #operations */}

Utilice el menú superior para elegir lo que desea hacer. Cada operación solo muestra los campos de entrada que le son pertinentes.

### Search {/* #search */}

La operación más común y la predeterminada. Devuelve una lista de registros que coinciden con los criterios dados (dominio, modelo, ...).

:::note[Campos de la barra lateral]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![Panel DevTools - Search](/img/devtools-panel/search.png)

### Modificación {/* #write */}

Modifica los registros existentes que coinciden con los criterios dados.

:::danger
Esta operación modifica los registros existentes en la base de datos. Asegúrese de que los IDs que proporciona corresponden a los registros que desea modificar y de que los valores son correctos. Si no está seguro, pruebe primero en una base de datos de prueba.
:::

:::note[Campos de la barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panel DevTools - Modificación](/img/devtools-panel/write.png)

### Creación {/* #create */}

Crea un registro con los valores dados y lo muestra una vez creado.

:::danger
Esta operación crea nuevos registros en la base de datos. Asegúrese de que los valores que proporciona son correctos y de que está en una base de datos de prueba si no está seguro.
:::

:::note[Campos de la barra lateral]
`Model` · `Context`
:::

![Panel DevTools - Creación](/img/devtools-panel/create.png)

### Llamada a método {/* #call-method */}

Llama a cualquier método público en un modelo. Útil para desencadenar lógica de negocio, wizards o métodos personalizados.

:::note[Campos de la barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panel DevTools - Llamada a método](/img/devtools-panel/call-method.png)

### Supresión y archivado {/* #unlink */}

(Dés)archiva o suprime los registros correspondientes.

:::danger
Esta operación modifica o suprime los registros existentes en la base de datos. Asegúrese de que los IDs que proporciona corresponden a los registros que desea modificar o suprimir. Si no está seguro, pruebe primero en una base de datos de prueba.
:::

:::note[Campos de la barra lateral]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panel DevTools - Supresión y archivado](/img/devtools-panel/unlink.png)

## Historial de consultas {/* #request-history */}

El panel guarda un historial de sus consultas recientes (hasta 150), accesible desde la pestaña **History** en el menú superior. Puede encontrar los detalles de cada consulta (modelo, dominio, payload, respuesta) y volver a ejecutarlas o copiarlas fácilmente.

![Panel DevTools - Pestaña Historial](/img/devtools-panel/history-tab.png)
