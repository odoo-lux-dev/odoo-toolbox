---
sidebar_position: 1
title: Inicio rápido
---

# Inicio rápido

**Odoo Toolbox** tiene como objetivo mejorar la experiencia de los usuarios y desarrolladores de Odoo / Odoo.SH añadiendo una variedad de herramientas y funcionalidades.

## Instalación {/* #installation */}

### Chromium {/* #chromium */}

1. Visite la [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Haga clic en **Añadir a Chrome**
3. Confirme haciendo clic en **Añadir extensión**

### Firefox {/* #firefox */}

1. Visite la página de [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Haga clic en **Añadir a Firefox**
3. Confirme haciendo clic en **Añadir**

Una vez instalada, el icono de Odoo Toolbox aparecerá en la barra de herramientas de su navegador.

---

## Inicio rápido {/* #quick-start */}

### 1. Acceder a una instancia Odoo {/* #navigate-to-odoo */}

Abra su navegador y vaya a una instancia Odoo en **versión 14 o superior**.

### 2. Abrir el popup {/* #open-the-popup */}

Haga clic en el icono **Odoo Toolbox** en la barra de herramientas de su navegador para abrir el popup. Desde aquí puede:

- Activar o desactivar el **modo debug** (también disponible mediante un atajo de teclado)
- Cambiar el **tema** de la extensión entre claro y oscuro
- Acceder a sus **proyectos favoritos de Odoo.SH**
- Abrir la **página Options** para los ajustes avanzados

### 3. Inspeccionar los campos con la barra lateral técnica {/* #inspect-fields */}

En cualquier vista de Odoo, aparece un **botón flotante**, por defecto, en la esquina inferior derecha de la página.

1. Haga clic en el botón para abrir la **barra lateral técnica**
2. Explore la información técnica sobre la página actual (modelo, campos, vista, etc.)
3. Para mayor precisión, active el **modo de selección de elementos** haciendo clic en el icono del cursor en la parte superior derecha
4. Haga clic en cualquier campo de la página para mostrar sus detalles técnicos:
    - Nombre del campo (`name`, `partner_id`, ...)
    - Tipo de campo (`Many2one`, `Char`, `Selection`, ...)
    - Propiedades y metadatos adicionales

### 4. Usar el panel DevTools {/* #use-devtools-panel */}

El panel DevTools le permite interactuar con la capa RPC de Odoo sin salir de su navegador.

1. Abra las **DevTools** de su navegador (`F12` o `Ctrl+Shift+I` / `Cmd+Option+I` en Mac)
2. Navegue hasta la pestaña **Odoo Toolbox**
3. Seleccione una pestaña de operación:
    - **Search** - consulte registros con filtros de dominio y selección de campos
    - **Write / Create / Unlink** - modifique registros con entrada JSON
    - **Call Method** - ejecute cualquier método de modelo

---

## ¿Qué sigue? {/* #whats-next */}

Explore la documentación de cada sección:

- [Odoo](./odoo/overview) - Contiene todas las herramientas relacionadas con las bases de datos Odoo en general
- [Odoo.SH](./odoosh/overview) - Contiene todas las herramientas relacionadas con Odoo.SH
- [Options](./options) - Vista rápida de la página Options para la configuración de la extensión
