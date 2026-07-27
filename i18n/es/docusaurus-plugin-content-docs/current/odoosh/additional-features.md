---
sidebar_position: 3
title: Funcionalidades adicionales
---

# Funcionalidades adicionales

Esta página reúne las pequeñas utilidades que Odoo Toolbox añade a la interfaz de Odoo.SH para facilitar la gestión diaria de proyectos y ramas. Estas funcionalidades están disponibles directamente en [Odoo.SH](https://www.odoo.sh), sin configuración particular.

## Atajos para las ramas {/* #branch-shortcuts */}

![Atajos para las ramas](/img/odoosh/additional-features/shortcuts.png)

### Copia del nombre de rama {/* #branch-name-copy */}

En la página de un proyecto Odoo.SH, cada rama dispone de un botón de copia rápida que coloca su nombre exacto en el portapapeles con un solo clic. Práctico para comandos `git checkout`, mensajes de commit o nombres de tareas.

{/* ![Copia del nombre de rama](/img/odoosh/additional-features/branch-copy.png) */}

### Enlaces GitHub {/* #github-links */}

Odoo Toolbox añade enlaces directos a GitHub junto a cada rama. Un clic le lleva a la rama correspondiente en su repositorio GitHub, sin tener que salir de Odoo.SH ni buscar manualmente en GitHub.

{/* ![Enlaces GitHub](/img/odoosh/additional-features/github-links.png) */}

### Integración de tareas {/* #task-integration */}

Odoo Toolbox puede asociar una rama Odoo.SH a una tarea en su proyecto Odoo. Cuando se detecta una coincidencia en el nombre de la rama, se muestra un enlace directo a la tarea junto a la rama.

#### Funcionamiento

La extensión analiza el nombre de cada rama mediante la expresión regular `/-(\d+)-/`. El identificador numérico capturado se inyecta luego en una URL personalizable mediante el marcador de posición `{{task_id}}`. Tanto la regex como la URL se pueden personalizar en las opciones de la extensión.

El patrón por defecto corresponde al formato: `VERSION-TASKID-DESCRIPCIÓN_OPCIONAL`

Ejemplos de nombres de rama reconocidos: `17.0-12345-my-feature`, `15.0-6789-fixes`

Para configurar la URL de destino, vaya a las **opciones de la extensión** e introduzca su URL con el marcador de posición `{{task_id}}`. Por ejemplo:

```
https://mi-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
La URL también se puede definir individualmente por favorito desde la página **SH Favorites** de las opciones de la extensión.
:::

## Indicadores de estado de builds adaptados para daltónicos {/* #colorblind-build-status */}

Por defecto, Odoo.SH indica el estado de los builds únicamente mediante colores (verde, rojo, naranja). Odoo Toolbox enriquece estos indicadores con iconos y formas distintas, haciendo que los estados sean legibles incluso sin distinción de colores.

| Estado        | Indicador visual                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Éxito         | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Fallo         | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| En curso      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| En espera     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Indicadores de estado adaptados para daltónicos](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Esta funcionalidad es especialmente útil si utiliza Odoo.SH en un monitor mal calibrado o en un entorno con fuerte iluminación ambiental.
:::
